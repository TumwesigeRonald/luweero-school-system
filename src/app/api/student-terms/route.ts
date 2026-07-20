import { db } from "@/db";
import { studentTerms } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/student-terms?termId=..&studentId=..  -> one record
// GET /api/student-terms?termId=..&classStudentIds=1,2,3 -> multiple
export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const termId = Number(url.searchParams.get("termId"));
  const studentId = Number(url.searchParams.get("studentId"));
  if (!termId) return Response.json({ error: "termId required" }, { status: 400 });
  if (studentId) {
    const rows = await db
      .select()
      .from(studentTerms)
      .where(and(eq(studentTerms.termId, termId), eq(studentTerms.studentId, studentId)))
      .limit(1);
    return Response.json({ record: rows[0] ?? null });
  }
  const idsCsv = url.searchParams.get("classStudentIds");
  if (idsCsv) {
    const ids = idsCsv
      .split(",")
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (ids.length === 0) return Response.json({ records: [] });
    const rows = await db
      .select()
      .from(studentTerms)
      .where(and(eq(studentTerms.termId, termId), inArray(studentTerms.studentId, ids)));
    return Response.json({ records: rows });
  }
  return Response.json({ records: [] });
}

// POST body: { studentId, termId, daysPresent?, daysAbsent?, feesBalance?, feesPaid?, conduct?, classTeacherComment?, headTeacherComment? }
export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const studentId = Number(body?.studentId);
  const termId = Number(body?.termId);
  if (!studentId || !termId)
    return Response.json({ error: "studentId, termId required" }, { status: 400 });

  const numOrNull = (v: unknown) =>
    v === "" || v == null ? null : Number.isNaN(Number(v)) ? null : Number(v);
  const strOrNull = (v: unknown) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const feesToStr = (v: unknown) => {
    const n = numOrNull(v);
    return n == null ? null : n.toFixed(2);
  };

  const values = {
    studentId,
    termId,
    daysPresent: numOrNull(body?.daysPresent),
    daysAbsent: numOrNull(body?.daysAbsent),
    feesBalance: feesToStr(body?.feesBalance),
    feesPaid: feesToStr(body?.feesPaid),
    conduct: strOrNull(body?.conduct),
    classTeacherComment: strOrNull(body?.classTeacherComment),
    headTeacherComment: strOrNull(body?.headTeacherComment),
  };

  await db
    .insert(studentTerms)
    .values(values)
    .onConflictDoUpdate({
      target: [studentTerms.studentId, studentTerms.termId],
      set: {
        daysPresent: values.daysPresent,
        daysAbsent: values.daysAbsent,
        feesBalance: values.feesBalance,
        feesPaid: values.feesPaid,
        conduct: values.conduct,
        classTeacherComment: values.classTeacherComment,
        headTeacherComment: values.headTeacherComment,
        updatedAt: new Date(),
      },
    });
  return Response.json({ ok: true });
}
