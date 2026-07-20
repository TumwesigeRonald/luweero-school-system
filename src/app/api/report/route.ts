import { db } from "@/db";
import { classes, marks, students, subjects, terms } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// Helper function expected by bulk/route.ts and student-portal/route.ts
export async function buildReport(studentId: number, termId: number) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return null;

  const klass = student.classId
    ? (
        await db
          .select()
          .from(classes)
          .where(eq(classes.id, student.classId))
          .limit(1)
      )[0]
    : null;

  const [term] = await db
    .select()
    .from(terms)
    .where(eq(terms.id, termId))
    .limit(1);

  const studentMarks = await db
    .select()
    .from(marks)
    .where(eq(marks.studentId, studentId));

  return {
    student,
    class: klass,
    term,
    marks: studentMarks,
  };
}

// Next.js GET Route Handler
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const termIdParam = searchParams.get("termId");

    if (!studentIdParam || !termIdParam) {
      return NextResponse.json(
        { error: "studentId and termId are required" },
        { status: 400 }
      );
    }

    const report = await buildReport(
      parseInt(studentIdParam, 10),
      parseInt(termIdParam, 10)
    );

    if (!report || !report.student) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}