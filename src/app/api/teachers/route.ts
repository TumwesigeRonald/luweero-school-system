import { db } from "@/db";
import { teachers } from "@/db/schema";
import { getCurrentTeacher, hashPassword } from "@/lib/auth";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select({
      id: teachers.id,
      fullName: teachers.fullName,
      email: teachers.email,
      role: teachers.role,
      isActive: teachers.isActive,
    })
    .from(teachers)
    .orderBy(asc(teachers.fullName));
  return Response.json({ teachers: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const fullName = (body?.fullName ?? "").toString().trim();
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();
  const role = body?.role === "admin" ? "admin" : "teacher";
  if (!fullName || !email || !password) {
    return Response.json({ error: "fullName, email, password required" }, { status: 400 });
  }
  try {
    const hash = await hashPassword(password);
    const [row] = await db
      .insert(teachers)
      .values({ fullName, email, passwordHash: hash, role })
      .returning({
        id: teachers.id,
        fullName: teachers.fullName,
        email: teachers.email,
        role: teachers.role,
        isActive: teachers.isActive,
      });
    return Response.json({ teacher: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
