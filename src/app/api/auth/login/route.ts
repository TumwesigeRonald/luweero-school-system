import { db } from "@/db";
import { students, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";
import {
  createStudentSession,
  verifyPassword as verifyStudentPassword,
} from "@/lib/student-auth";

export const dynamic = "force-dynamic";

// Unified login: accepts either a teacher's EMAIL or a student's ADMISSION NUMBER.
// We try teacher first (matching email exactly), then fall back to student
// (matching admission number, case-insensitive).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifier = (body?.email ?? body?.identifier ?? "").toString().trim();
  const password = (body?.password ?? "").toString();

  if (!identifier || !password) {
    return Response.json(
      { error: "Email/Admission No. and password are required" },
      { status: 400 },
    );
  }

  // ------ Try teacher (email match) ------
  if (identifier.includes("@")) {
    const email = identifier.toLowerCase();
    const [user] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);
    if (user && user.isActive) {
      const ok = await verifyPassword(password, user.passwordHash);
      if (ok) {
        await createSession(user.id);
        return Response.json({
          ok: true,
          userType: "teacher",
          user: { id: user.id, fullName: user.fullName, role: user.role },
          redirectTo: "/dashboard",
        });
      }
    }
    // Fall through -> maybe it's actually a student using an email-like admNo
  }

  // ------ Try student (admission number match) ------
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.admissionNo, identifier))
    .limit(1);

  if (student && student.passwordHash) {
    const ok = await verifyStudentPassword(password, student.passwordHash);
    if (ok) {
      await createStudentSession(student.id);
      return Response.json({
        ok: true,
        userType: "student",
        user: { id: student.id, fullName: student.fullName },
        redirectTo: "/portal",
      });
    }
  }

  // Nothing matched
  return Response.json(
    { error: "Invalid email/admission number or password" },
    { status: 401 },
  );
}
