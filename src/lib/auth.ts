import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, teachers } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "rms_session";
const SESSION_DAYS = 7;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(teacherId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, teacherId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentTeacher() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({
      id: teachers.id,
      fullName: teachers.fullName,
      email: teachers.email,
      role: teachers.role,
      isActive: teachers.isActive,
    })
    .from(sessions)
    .innerJoin(teachers, eq(teachers.id, sessions.teacherId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const t = rows[0];
  if (!t || !t.isActive) return null;
  return t;
}

export async function requireTeacher() {
  const t = await getCurrentTeacher();
  if (!t) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return t;
}
