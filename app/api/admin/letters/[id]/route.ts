import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/auth";
import { LIMITS_REPLY_MAX, STATUSES } from "@/lib/config";
import { LetterPatch, store } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const letter = await store.get(id);
  if (!letter) return NextResponse.json({ error: "找不到這封信" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const patch: LetterPatch = {};

  if (body.status !== undefined) {
    if (!(body.status in STATUSES)) return NextResponse.json({ error: "狀態錯誤" }, { status: 400 });
    patch.status = body.status;
  }
  if (body.reply !== undefined) {
    const reply = String(body.reply).trim();
    if (reply.length > LIMITS_REPLY_MAX) return NextResponse.json({ error: `回覆最多 ${LIMITS_REPLY_MAX} 字` }, { status: 400 });
    patch.reply = reply || null;
    patch.replied_at = reply ? new Date().toISOString() : null;
  }
  if (body.is_public !== undefined) {
    if (body.is_public && !letter.allow_public) {
      return NextResponse.json({ error: "投信者不同意公開，無法放到公告" }, { status: 400 });
    }
    patch.is_public = Boolean(body.is_public);
  }

  await store.update(id, patch);
  return NextResponse.json({ ok: true });
}
