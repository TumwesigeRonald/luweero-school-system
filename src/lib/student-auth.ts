import { cookies } from "next/headers";
import { db } from "@/db";
import { students, studentSessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export const STUDENT_SESSION_COOKIE = "rms_student";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createStudentSession(studentId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(studentSessions).values({ token, studentId, expiresAt });
  const jar = await cookies();
  jar.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroyStudentSession() {
  const jar = await cookies();
  const token = jar.get(STUDENT_SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(studentSessions).where(eq(studentSessions.token, token));
  }
  jar.delete(STUDENT_SESSION_COOKIE);
}

export async function getCurrentStudent() {
  const jar = await cookies();
  const token = jar.get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: students.id,
      admissionNo: students.admissionNo,
      fullName: students.fullName,
      classId: students.classId,
      gender: students.gender,
      photoUrl: students.photoUrl,
    })
    .from(studentSessions)
    .innerJoin(students, eq(students.id, studentSessions.studentId))
    .where(
      and(
        eq(studentSessions.token, token),
        gt(studentSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
