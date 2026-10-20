import { NextResponse } from "next/server";
import { isAdmin } from "@/auth";
import { store, usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";

/** 部署檢查用：確認資料庫是否連得上（不回傳任何信件內容） */
/** 只描述設定值的「格式」，不洩漏金鑰內容 */
function describe(value: string | undefined) {
  if (!value) return { set: false };
  const nonAscii = [...value]
    .map((ch, i) => ({ i, ch }))
    .filter(({ ch }) => ch.charCodeAt(0) > 127)
    .slice(0, 5)
    .map(({ i, ch }) => `位置 ${i}：「${ch}」`);
  return {
    set: true,
    length: value.length,
    hasSpacesAtEnds: value !== value.trim(),
    nonAscii,
  };
}

export async function GET() {
  // 詳細設定診斷只給已登入的學生會看；一般人只看得到正常與否
  const admin = await isAdmin();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const config = {
    SUPABASE_URL: { ...describe(url), looksRight: /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url ?? "") },
    SUPABASE_SERVICE_ROLE_KEY: {
      ...describe(key),
      kind: key?.startsWith("sb_secret_") ? "secret key ✅"
        : key?.startsWith("sb_publishable_") ? "publishable key ❌（權限不夠，要用 secret key）"
        : key?.startsWith("eyJ") ? "legacy JWT key"
        : "無法辨識",
    },
    AUTH_GOOGLE_ID: { ...describe(process.env.AUTH_GOOGLE_ID), looksRight: /\.apps\.googleusercontent\.com$/.test(process.env.AUTH_GOOGLE_ID ?? "") },
    AUTH_GOOGLE_SECRET: { ...describe(process.env.AUTH_GOOGLE_SECRET), looksRight: (process.env.AUTH_GOOGLE_SECRET ?? "").startsWith("GOCSPX-") },
    AUTH_SECRET: { ...describe(process.env.AUTH_SECRET), looksRight: (process.env.AUTH_SECRET ?? "").length >= 32 },
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? null,
    GMAIL_USER: process.env.GMAIL_USER ?? null,
    GMAIL_APP_PASSWORD: { ...describe(process.env.GMAIL_APP_PASSWORD), looksRight: (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "").length === 16 },
    SITE_URL: process.env.SITE_URL ?? null,
  };

  const detail = admin ? { config } : {};

  if (!usingSupabase) {
    return NextResponse.json({ ok: false, database: "未設定 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", ...detail }, { status: 503 });
  }
  try {
    await store.listPublic();
    return NextResponse.json({ ok: true, database: "連線正常", ...detail });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return NextResponse.json(
      { ok: false, database: "連線失敗", ...(admin ? { code: err.code ?? null, message: err.message ?? String(e), config } : {}) },
      { status: 500 },
    );
  }
}
