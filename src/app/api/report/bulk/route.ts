import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { buildReport } from "../route";

export const dynamic = "force-dynamic";

// GET /api/report/bulk?classId=..&termId=..
export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const classId = Number(url.searchParams.get("classId"));
  const termId = Number(url.searchParams.get("termId"));
  if (!classId || !termId)
    return Response.json({ error: "classId and termId required" }, { status: 400 });
  const studs = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.classId, classId))
    .orderBy(asc(students.fullName));
  const reports = [];
  for (const s of studs) {
    const r = await buildReport(s.id, termId);
    if (r) reports.push(r);
  }
  return Response.json({ reports });
}
