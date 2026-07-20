import { db } from "@/db";
import { subjectTeachers } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(subjectTeachers);
  return Response.json({ assignments: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const subjectId = Number(body?.subjectId);
  const teacherId = Number(body?.teacherId);
  const classId = Number(body?.classId);
  if (!subjectId || !teacherId || !classId) {
    return Response.json(
      { error: "subjectId, teacherId, classId required" },
      { status: 400 },
    );
  }
  try {
    const [row] = await db
      .insert(subjectTeachers)
      .values({ subjectId, teacherId, classId })
      .returning();
    return Response.json({ assignment: row });
  } catch {
    return Response.json({ error: "Already assigned" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  await db.delete(subjectTeachers).where(eq(subjectTeachers.id, id));
  return Response.json({ ok: true });
}


