import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Status } from "./config";

export type Attachment = { name: string; path: string; type: string; size: number };
export type Letter = {
  id: string;
  created_at: string;
  category: string;
  title: string | null;
  content: string;
  status: Status;
  attachments: Attachment[];
};
export type UploadFile = { name: string; type: string; data: Buffer };

interface Store {
  create(input: { category: string; title: string | null; content: string; files: UploadFile[] }): Promise<Letter>;
  list(): Promise<Letter[]>;
  get(id: string): Promise<Letter | null>;
  setStatus(id: string, status: Status): Promise<void>;
  readFile(att: Attachment): Promise<Buffer>;
}

/* ---------- Supabase（正式環境） ---------- */
const BUCKET = "attachments";

function supabaseStore(sb: SupabaseClient): Store {
  return {
    async create({ category, title, content, files }) {
      const id = randomUUID();
      const attachments: Attachment[] = [];
      for (const [i, f] of files.entries()) {
        const p = `${id}/${i}-${f.name}`;
        const { error } = await sb.storage.from(BUCKET).upload(p, f.data, { contentType: f.type });
        if (error) throw error;
        attachments.push({ name: f.name, path: p, type: f.type, size: f.data.length });
      }
      const { data, error } = await sb
        .from("letters")
        .insert({ id, category, title, content, attachments })
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
    async get(id) {
      const { data } = await sb.from("letters").select("*").eq("id", id).maybeSingle();
      return (data as Letter) ?? null;
    },
    async setStatus(id, status) {
      const { error } = await sb.from("letters").update({ status }).eq("id", id);
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
  async create({ category, title, content, files }) {
    const id = randomUUID();
    const attachments: Attachment[] = [];
    for (const [i, f] of files.entries()) {
      const p = `${id}/${i}-${f.name}`;
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
    };
    await writeAll([letter, ...(await readAll())]);
    return letter;
  },
  async list() {
    return readAll();
  },
  async get(id) {
    return (await readAll()).find((l) => l.id === id) ?? null;
  },
  async setStatus(id, status) {
    const all = await readAll();
    const l = all.find((x) => x.id === id);
    if (l) l.status = status;
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
