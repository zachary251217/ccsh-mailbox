import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AUTO_PUBLISH, Status } from "./config";

const PUBLIC_FIELDS = ["id", "created_at", "category", "title", "content", "reply", "replied_at"] as const;
const toPublic = (l: Letter): PublicLetter =>
  Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, l[k]])) as PublicLetter;

export type Attachment = { name: string; path: string; type: string; size: number };
export type Letter = {
  id: string;
  created_at: string;
  category: string;
  title: string | null;
  content: string;
  status: Status;
  attachments: Attachment[];
  /** 投信者是否同意公開到公告區 */
  allow_public: boolean;
  /** 學生會是否已公開到公告區 */
  is_public: boolean;
  reply: string | null;
  replied_at: string | null;
};
export type LetterPatch = Partial<Pick<Letter, "status" | "is_public" | "reply" | "replied_at">>;
export type PublicLetter = Pick<Letter, "id" | "created_at" | "category" | "title" | "content" | "reply" | "replied_at">;
type CreateInput = { category: string; title: string | null; content: string; allow_public: boolean; files: UploadFile[] };
export type UploadFile = { name: string; type: string; data: Buffer };

interface Store {
  create(input: CreateInput): Promise<Letter>;
  list(): Promise<Letter[]>;
  /** 公告區：只回傳已公開信件的必要欄位（不含附件） */
  listPublic(): Promise<PublicLetter[]>;
  get(id: string): Promise<Letter | null>;
  update(id: string, patch: LetterPatch): Promise<void>;
  readFile(att: Attachment): Promise<Buffer>;
}

/* ---------- Supabase（正式環境） ---------- */
const BUCKET = "attachments";

function supabaseStore(sb: SupabaseClient): Store {
  return {
    async create({ category, title, content, allow_public, files }) {
      const id = randomUUID();
      const attachments: Attachment[] = [];
      for (const [i, f] of files.entries()) {
        const p = `${id}/${i}${path.extname(f.name)}`; // 儲存路徑只用英數，Supabase Storage 不接受中文
        const { error } = await sb.storage.from(BUCKET).upload(p, f.data, { contentType: f.type });
        if (error) throw error;
        attachments.push({ name: f.name, path: p, type: f.type, size: f.data.length });
      }
      const { data, error } = await sb
        .from("letters")
        .insert({ id, category, title, content, attachments, allow_public, is_public: AUTO_PUBLISH && allow_public })
        .select()
        .single();
      if (error) throw error;
      return data as Letter;
    },
    async list() {
      const { data, error } = await sb.from("letters").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Letter[];
    },
    async listPublic() {
      const { data, error } = await sb
        .from("letters")
        .select(PUBLIC_FIELDS.join(","))
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PublicLetter[];
    },
    async get(id) {
      const { data } = await sb.from("letters").select("*").eq("id", id).maybeSingle();
      return (data as Letter) ?? null;
    },
    async update(id, patch) {
      const { error } = await sb.from("letters").update(patch).eq("id", id);
      if (error) throw error;
    },
    async readFile(att) {
      const { data, error } = await sb.storage.from(BUCKET).download(att.path);
      if (error) throw error;
      return Buffer.from(await data.arrayBuffer());
    },
  };
}

/* ---------- 本機檔案（開發預覽用） ---------- */
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "letters.json");

async function readAll(): Promise<Letter[]> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}
async function writeAll(letters: Letter[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(letters, null, 2));
}

const localStore: Store = {
  async create({ category, title, content, allow_public, files }) {
    const id = randomUUID();
    const attachments: Attachment[] = [];
    for (const [i, f] of files.entries()) {
      const p = `${id}/${i}${path.extname(f.name)}`; // 儲存路徑只用英數，Supabase Storage 不接受中文
      const full = path.join(DATA_DIR, "uploads", p);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, f.data);
      attachments.push({ name: f.name, path: p, type: f.type, size: f.data.length });
    }
    const letter: Letter = {
      id,
      created_at: new Date().toISOString(),
      category,
      title,
      content,
      status: "new",
      attachments,
      allow_public,
      is_public: AUTO_PUBLISH && allow_public,
      reply: null,
      replied_at: null,
    };
    await writeAll([letter, ...(await readAll())]);
    return letter;
  },
  async list() {
    return readAll();
  },
  async listPublic() {
    return (await readAll()).filter((l) => l.is_public).map(toPublic);
  },
  async get(id) {
    return (await readAll()).find((l) => l.id === id) ?? null;
  },
  async update(id, patch) {
    const all = await readAll();
    const l = all.find((x) => x.id === id);
    if (l) Object.assign(l, patch);
    await writeAll(all);
  },
  async readFile(att) {
    return fs.readFile(path.join(DATA_DIR, "uploads", att.path));
  },
};

export const usingSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const store: Store = usingSupabase
  ? supabaseStore(
      createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false },
      }),
    )
  : localStore;
