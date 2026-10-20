import { NextResponse } from "next/server";
import { isAdmin } from "@/auth";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; idx: string }> }) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const { id, idx } = await params;
  const letter = await store.get(id);
  const att = letter?.attachments[Number(idx)];
  if (!att) return new NextResponse("Not found", { status: 404 });
  const data = await store.readFile(att);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": att.type,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.name)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
