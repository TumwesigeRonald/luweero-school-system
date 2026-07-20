import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const subjectId = Number(id);
  if (!subjectId) return Response.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(subjects).where(eq(subjects.id, subjectId));
  return Response.json({ ok: true });
}
