import { db } from "@/db";
import { classes, marks, students, subjects, terms } from "@/db/schema";
import { eq, or, ilike, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const termId = searchParams.get("termId");
  const classNameParam = searchParams.get("className");

  if (!classId || !termId) {
    return NextResponse.json({ error: "Missing classId or termId" }, { status: 400 });
  }

  // 1. Fetch class details
  const [targetClass] = await db.select().from(classes).where(eq(classes.id, Number(classId)));
  const rawClassName = targetClass?.name || classNameParam || "";
  const cleanClassName = rawClassName.split(" ")[0]; // Extracts "S1" from "S1 (O-LEVEL)"

  // 2. Fetch students by classId OR matching text name ("S1", "S1 (O-LEVEL)", etc.)
  const studentList = await db
    .select()
    .from(students)
    .where(
      or(
        eq(students.classId, Number(classId)),
        eq(students.class, rawClassName),
        eq(students.class, cleanClassName),
        ilike(students.class, `${cleanClassName}%`)
      )
    );

  // 3. Fetch subjects matching level (e.g. O-LEVEL or A-LEVEL)
  const subjectList = targetClass
    ? await db.select().from(subjects).where(eq(subjects.level, targetClass.level))
    : await db.select().from(subjects);

  // 4. Fetch existing marks for these students
  const markList = await db
    .select()
    .from(marks)
    .where(eq(marks.termId, Number(termId)));

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

    if (score === "" || score === null) {
      await db
        .delete(marks)
        .where(
          and(
            eq(marks.studentId, Number(studentId)),
            eq(marks.subjectId, Number(subjectId)),
            eq(marks.termId, Number(termId)),
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
          eq(marks.studentId, Number(studentId)),
          eq(marks.subjectId, Number(subjectId)),
          eq(marks.termId, Number(termId)),
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
        studentId: Number(studentId),
        subjectId: Number(subjectId),
        termId: Number(termId),
        component,
        score: String(score),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save mark" }, { status: 500 });
  }
}