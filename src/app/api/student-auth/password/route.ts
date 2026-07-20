import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentStudent, hashPassword, verifyPassword } from "@/lib/student-auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentStudent();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const oldPw = (body?.oldPassword ?? "").toString();
  const newPw = (body?.newPassword ?? "").toString();
  if (!oldPw || !newPw)
    return Response.json({ error: "Both passwords required" }, { status: 400 });
  if (newPw.length < 6)
    return Response.json({ error: "New password must be at least 6 chars" }, { status: 400 });

  const [student] = await db
    .select({ passwordHash: students.passwordHash })
    .from(students)
    .where(eq(students.id, me.id))
    .limit(1);
  if (!student || !student.passwordHash)
    return Response.json({ error: "No password set" }, { status: 400 });
  const ok = await verifyPassword(oldPw, student.passwordHash);
  if (!ok) return Response.json({ error: "Old password is incorrect" }, { status: 401 });
  const hash = await hashPassword(newPw);
  await db.update(students).set({ passwordHash: hash }).where(eq(students.id, me.id));
  return Response.json({ ok: true });
}
