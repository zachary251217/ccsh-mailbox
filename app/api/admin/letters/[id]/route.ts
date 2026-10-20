import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/auth";
import { STATUSES } from "@/lib/config";
import { store } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!(status in STATUSES)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  await store.setStatus(id, status);
  return NextResponse.json({ ok: true });
}
