import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { hashPassword } from "@/lib/student-auth";
import { and, eq, inArray, isNull, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST body: { studentId, password }  -> set one student's password
// OR:      { classId, password, onlyMissing }  -> set all students in class
export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin")
    return Response.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const studentId = body?.studentId ? Number(body.studentId) : null;
  const classId = body?.classId ? Number(body.classId) : null;
  const password = (body?.password ?? "").toString();
  const onlyMissing = Boolean(body?.onlyMissing);
  if (!password || password.length < 4) {
    return Response.json(
      { error: "Password must be at least 4 characters" },
      { status: 400 },
    );
  }
  const hash = await hashPassword(password);

  if (studentId) {
    await db.update(students).set({ passwordHash: hash }).where(eq(students.id, studentId));
    return Response.json({ ok: true, updated: 1 });
  }

  if (classId) {
    const conds = [eq(students.classId, classId)];
    if (onlyMissing) {
      // Only students without a password
      conds.push(
        or(isNull(students.passwordHash), eq(students.passwordHash, ""))!,
      );
    }
    const result = await db
      .update(students)
      .set({ passwordHash: hash })
      .where(and(...conds))
      .returning({ id: students.id });
    return Response.json({ ok: true, updated: result.length });
  }

  // Bulk set for a list of ids
  if (Array.isArray(body?.studentIds) && body.studentIds.length > 0) {
    const ids = body.studentIds.map((n: unknown) => Number(n)).filter(Boolean);
    const result = await db
      .update(students)
      .set({ passwordHash: hash })
      .where(inArray(students.id, ids))
      .returning({ id: students.id });
    return Response.json({ ok: true, updated: result.length });
  }

  return Response.json(
    { error: "Provide studentId, classId, or studentIds" },
    { status: 400 },
  );
}
