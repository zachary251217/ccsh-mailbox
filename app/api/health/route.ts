import { NextResponse } from "next/server";
import { store, usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";

/** 部署檢查用：確認資料庫是否連得上（不回傳任何信件內容） */
export async function GET() {
  if (!usingSupabase) {
    return NextResponse.json({ ok: false, database: "未設定 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });
  }
  try {
    await store.listPublic();
    return NextResponse.json({ ok: true, database: "連線正常" });
  } catch (e) {
    const err = e as { message?: string; code?: string };
    return NextResponse.json({ ok: false, database: "連線失敗", code: err.code ?? null, message: err.message ?? String(e) }, { status: 500 });
  }
}
