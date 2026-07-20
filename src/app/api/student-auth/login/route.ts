import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createStudentSession, verifyPassword } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const admissionNo = (body?.admissionNo ?? "").toString().trim();
  const password = (body?.password ?? "").toString();

  if (!admissionNo || !password) {
    return Response.json(
      { error: "Admission number and password are required" },
      { status: 400 },
    );
  }

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.admissionNo, admissionNo))
    .limit(1);

  if (!student) {
    return Response.json({ error: "Invalid admission number or password" }, { status: 401 });
  }

  if (!student.passwordHash) {
    return Response.json(
      {
        error:
          "Your account has no password set yet. Please contact the school office to set your password.",
      },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, student.passwordHash);
  if (!ok) {
    return Response.json({ error: "Invalid admission number or password" }, { status: 401 });
  }

  await createStudentSession(student.id);
  return Response.json({
    ok: true,
    student: { id: student.id, fullName: student.fullName },
  });
}
