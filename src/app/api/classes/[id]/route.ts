import { db } from "@/db";
import { classes } from "@/db/schema";
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
  const classId = Number(id);
  if (!classId) return Response.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(classes).where(eq(classes.id, classId));
  return Response.json({ ok: true });
}
