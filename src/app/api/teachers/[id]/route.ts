import { db } from "@/db";
import { teachers } from "@/db/schema";
import { getCurrentTeacher, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH -> update teacher: reset password, change role, toggle active
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const teacherId = Number(id);
  if (!teacherId) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = {};
  if (body?.newPassword) {
    const pw = String(body.newPassword);
    if (pw.length < 6)
      return Response.json({ error: "Password must be at least 6 chars" }, { status: 400 });
    updates.passwordHash = await hashPassword(pw);
  }
  if (body?.role) {
    updates.role = body.role === "admin" ? "admin" : "teacher";
  }
  if (typeof body?.isActive === "boolean") {
    updates.isActive = body.isActive;
  }
  if (body?.fullName) updates.fullName = String(body.fullName);
  if (Object.keys(updates).length === 0)
    return Response.json({ error: "No updates" }, { status: 400 });
  await db.update(teachers).set(updates).where(eq(teachers.id, teacherId));
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const teacherId = Number(id);
  if (teacherId === me.id)
    return Response.json({ error: "You cannot delete yourself" }, { status: 400 });
  await db.delete(teachers).where(eq(teachers.id, teacherId));
  return Response.json({ ok: true });
}
