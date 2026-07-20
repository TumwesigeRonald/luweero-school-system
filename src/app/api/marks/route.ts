import { db } from "@/db";
import { classes, marks, students, subjects } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const termId = searchParams.get("termId");
  const classNameParam = searchParams.get("className");

  if (!classId || !termId) {
    return NextResponse.json({ error: "Missing classId or termId" }, { status: 400 });
  }

  const numClassId = Number(classId);
  const numTermId = Number(termId);

  // 1. Fetch target class
  const [targetClass] = await db.select().from(classes).where(eq(classes.id, numClassId));

  // 2. Fetch all students and match by classId or class name in JavaScript (100% type-safe)
  const rawClassName = targetClass?.name || classNameParam || "";
  const cleanClassName = rawClassName.split(" ")[0].toLowerCase();

  const allStudents = await db.select().from(students);
  const studentList = allStudents.filter((s: any) => {
    // Match by numerical classId if available
    if (s.classId && Number(s.classId) === numClassId) return true;
    // Match by class string field (e.g. "S1", "S1 (O-LEVEL)")
    if (s.class) {
      const sClass = String(s.class).toLowerCase();
      return sClass.includes(cleanClassName);
    }
    return false;
  });

  // 3. Fetch subjects matching level
  const subjectList = targetClass
    ? await db.select().from(subjects).where(eq(subjects.level, targetClass.level))
    : await db.select().from(subjects);

  // 4. Fetch marks for active term
  const markList = await db
    .select()
    .from(marks)
    .where(eq(marks.termId, numTermId));

  const components = targetClass?.level === "A-LEVEL" ? ["P1", "P2"] : ["AOI1", "AOI2", "EOT"];

  return NextResponse.json({
    class: targetClass,
    students: studentList,
    subjects: subjectList,
    components,
    marks: markList,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, subjectId, termId, component, score } = body;

    if (!studentId || !subjectId || !termId || !component) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numStudentId = Number(studentId);
    const numSubjectId = Number(subjectId);
    const numTermId = Number(termId);

    if (score === "" || score === null) {
      await db
        .delete(marks)
        .where(
          and(
            eq(marks.studentId, numStudentId),
            eq(marks.subjectId, numSubjectId),
            eq(marks.termId, numTermId),
            eq(marks.component, component)
          )
        );
      return NextResponse.json({ success: true });
    }

    const existing = await db
      .select()
      .from(marks)
      .where(
        and(
          eq(marks.studentId, numStudentId),
          eq(marks.subjectId, numSubjectId),
          eq(marks.termId, numTermId),
          eq(marks.component, component)
        )
      );

    if (existing.length > 0) {
      await db
        .update(marks)
        .set({ score: String(score), updatedAt: new Date() })
        .where(eq(marks.id, existing[0].id));
    } else {
      await db.insert(marks).values({
        studentId: numStudentId,
        subjectId: numSubjectId,
        termId: numTermId,
        component,
        score: String(score),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save mark" }, { status: 500 });
  }
}