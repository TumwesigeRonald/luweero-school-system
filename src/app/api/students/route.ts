import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  const q = db.select().from(students);
  const rows = classId
    ? await q.where(eq(students.classId, Number(classId))).orderBy(asc(students.fullName))
    : await q.orderBy(asc(students.fullName));
  return Response.json({ students: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const admissionNo = (body?.admissionNo ?? "").toString().trim();
  const fullName = (body?.fullName ?? "").toString().trim();
  const classId = Number(body?.classId);
  if (!admissionNo || !fullName || !classId) {
    return Response.json({ error: "admissionNo, fullName and classId required" }, { status: 400 });
  }
  try {
    const [row] = await db
      .insert(students)
      .values({
        admissionNo,
        fullName,
        classId,
        gender: body?.gender ?? null,
        dateOfBirth: body?.dateOfBirth ?? null,
        guardianName: body?.guardianName ?? null,
        guardianPhone: body?.guardianPhone ?? null,
      })
      .returning();
    return Response.json({ student: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create";
    return Response.json({ error: msg }, { status: 400 });
  }
}
