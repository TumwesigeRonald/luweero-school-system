import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const studentId = Number(id);
  if (!studentId) return Response.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(students).where(eq(students.id, studentId));
  return Response.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const studentId = Number(id);
  if (!studentId) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (body?.fullName != null) updates.fullName = String(body.fullName);
  if (body?.admissionNo != null) updates.admissionNo = String(body.admissionNo);
  if (body?.classId != null) updates.classId = Number(body.classId);
  if (body?.gender != null) updates.gender = String(body.gender);
  if (body?.dateOfBirth != null) updates.dateOfBirth = String(body.dateOfBirth);
  if (body?.guardianName != null) updates.guardianName = String(body.guardianName);
  if (body?.guardianPhone != null) updates.guardianPhone = String(body.guardianPhone);
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates" }, { status: 400 });
  }
  const [row] = await db
    .update(students)
    .set(updates)
    .where(eq(students.id, studentId))
    .returning();
  return Response.json({ student: row });
}
