import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_TYPES, CATEGORIES, LIMITS } from "@/lib/config";
import { rateLimited } from "@/lib/rateLimit";
import { sanitizeFile } from "@/lib/sanitize";
import { store, UploadFile } from "@/lib/store";
import { notifyNewLetter } from "@/lib/mail";

export const runtime = "nodejs";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
  });
  return Boolean((await res.json()).success);
}

export async function POST(req: NextRequest) {
  // IP 只用於記憶體中的頻率限制，不會被儲存
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) return fail("投信太頻繁了，請稍後再試。", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("表單格式錯誤。");
  }

  if (!(await verifyTurnstile(form.get("cf-turnstile-response") as string | null))) {
    return fail("人機驗證失敗，請重新整理後再試。");
  }

  const category = String(form.get("category") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();

  if (!(CATEGORIES as readonly string[]).includes(category)) return fail("請選擇分類。");
  if (title.length > LIMITS.titleMax) return fail(`標題最多 ${LIMITS.titleMax} 字。`);
  if (content.length < LIMITS.contentMin) return fail(`內容至少要 ${LIMITS.contentMin} 個字。`);
  if (content.length > LIMITS.contentMax) return fail(`內容最多 ${LIMITS.contentMax} 字。`);

  const rawFiles = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (rawFiles.length > LIMITS.maxFiles) return fail(`最多上傳 ${LIMITS.maxFiles} 個檔案。`);

  if (rawFiles.reduce((n, f) => n + f.size, 0) > LIMITS.maxTotalBytes) return fail("附件總大小不能超過 4MB。");

  const files: UploadFile[] = [];
  for (const [i, f] of rawFiles.entries()) {
    if (!ALLOWED_TYPES[f.type]) return fail("只接受 JPG、PNG、WEBP、HEIC 圖片或 PDF 檔。");
    try {
      files.push(await sanitizeFile(f.type, Buffer.from(await f.arrayBuffer()), i));
    } catch {
      return fail(`第 ${i + 1} 個檔案無法讀取，請確認檔案沒有損壞。`);
    }
  }

  const letter = await store.create({ category, title: title || null, content, files });

  try {
    await notifyNewLetter(letter);
  } catch (e) {
    console.error("通知信寄送失敗", e);
  }

  return NextResponse.json({ ok: true });
}
