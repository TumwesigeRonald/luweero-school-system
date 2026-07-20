import { db } from "@/db";
import { classes, marks, students, subjects, subjectTeachers } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { and, asc, eq, sql, inArray } from "drizzle-orm";
import { componentsFor } from "@/lib/grading";
import { isAssigned } from "@/lib/assignments";

export const dynamic = "force-dynamic";

// GET /api/marks?classId=..&termId=..&subjectId=..
export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const classId = Number(url.searchParams.get("classId"));
  const termId = Number(url.searchParams.get("termId"));
  const subjectId = url.searchParams.get("subjectId")
    ? Number(url.searchParams.get("subjectId"))
    : null;

  if (!classId || !termId) {
    return Response.json({ error: "classId and termId required" }, { status: 400 });
  }

  const [klass] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!klass) return Response.json({ error: "Class not found" }, { status: 404 });

  const studs = await db
    .select()
    .from(students)
    .where(eq(students.classId, classId))
    .orderBy(asc(students.fullName));

  // Subjects available for this class level
  let subs = await db
    .select()
    .from(subjects)
    .where(sql`${subjects.level} = ${klass.level} OR ${subjects.level} = 'BOTH'`)
    .orderBy(asc(subjects.name));

  // If not admin, restrict to only assigned subjects
  if (me.role !== "admin") {
    const assigned = await db
      .select({ subjectId: subjectTeachers.subjectId })
      .from(subjectTeachers)
      .where(
        and(
          eq(subjectTeachers.teacherId, me.id),
          eq(subjectTeachers.classId, classId),
        ),
      );
    const allowedIds = new Set(assigned.map((a) => a.subjectId));
    subs = subs.filter((s) => allowedIds.has(s.id));
  }

  const studentIds = studs.map((s) => s.id);
  const marksRows =
    studentIds.length > 0
      ? await db
          .select()
          .from(marks)
          .where(
            and(
              eq(marks.termId, termId),
              inArray(marks.studentId, studentIds),
              ...(subjectId ? [eq(marks.subjectId, subjectId)] : []),
            ),
          )
      : [];

  return Response.json({
    class: klass,
    components: componentsFor(klass.level),
    students: studs,
    subjects: subs,
    marks: marksRows,
  });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const studentId = Number(body?.studentId);
  const subjectId = Number(body?.subjectId);
  const termId = Number(body?.termId);
  const component = (body?.component ?? "").toString().trim();
  const scoreRaw = body?.score;

  if (!studentId || !subjectId || !termId || !component) {
    return Response.json(
      { error: "studentId, subjectId, termId, component required" },
      { status: 400 },
    );
  }

  // Authorization: teacher must be assigned to (subject, class) unless admin
  if (me.role !== "admin") {
    const [stu] = await db
      .select({ classId: students.classId })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    if (!stu) return Response.json({ error: "Student not found" }, { status: 404 });
    const ok = await isAssigned(me.id, subjectId, stu.classId);
    if (!ok) {
      return Response.json(
        { error: "You are not assigned to this subject in this class" },
        { status: 403 },
      );
    }
  }

  if (scoreRaw === "" || scoreRaw === null || scoreRaw === undefined) {
    await db
      .delete(marks)
      .where(
        and(
          eq(marks.studentId, studentId),
          eq(marks.subjectId, subjectId),
          eq(marks.termId, termId),
          eq(marks.component, component),
        ),
      );
    return Response.json({ ok: true, deleted: true });
  }

  const score = Number(scoreRaw);
  if (Number.isNaN(score) || score < 0 || score > 100) {
    return Response.json({ error: "Score must be 0-100" }, { status: 400 });
  }

  await db
    .insert(marks)
    .values({
      studentId,
      subjectId,
      termId,
      component,
      score: score.toFixed(2),
      enteredBy: me.id,
    })
    .onConflictDoUpdate({
      target: [marks.studentId, marks.subjectId, marks.termId, marks.component],
      set: {
        score: score.toFixed(2),
        enteredBy: me.id,
        updatedAt: new Date(),
      },
    });

  return Response.json({ ok: true });
}
