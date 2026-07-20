import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, students, subjects, marks, terms } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get("classId");
    const termIdParam = searchParams.get("termId");

    if (!classIdParam) {
      return NextResponse.json({ error: "classId required" }, { status: 400 });
    }

    const classId = Number(classIdParam);

    const classData = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .then((res) => res[0] ?? null);

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId));

    const levelSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.level, classData.level));

    const components =
      classData.level?.toUpperCase() === "O-LEVEL"
        ? ["AOI1", "AOI2", "EOT"]
        : ["P1", "P2"];

    const existingMarks = await db.select().from(marks);

    return NextResponse.json({
      class: classData,
      students: classStudents,
      subjects: levelSubjects,
      components,
      marks: existingMarks,
    });
  } catch (error: any) {
    console.error("GET Marks Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const studentId = Number(body.studentId);
    const subjectId = Number(body.subjectId);
    const component = String(body.component);
    const scoreVal = body.score;

    if (!studentId || !subjectId || !component) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dbTerms = await db.select().from(terms);
    const activeTerm = dbTerms.find((t) => t.isActive) || dbTerms[0];
    const validTermId = activeTerm ? activeTerm.id : 1;

    // Handle deletion if score is blank
    if (scoreVal === "" || scoreVal === null || scoreVal === undefined) {
      await db
        .delete(marks)
        .where(
          and(
            eq(marks.studentId, studentId),
            eq(marks.subjectId, subjectId),
            eq(marks.component, component)
          )
        );
      return NextResponse.json({ success: true });
    }

    const numericScore = parseFloat(String(scoreVal));
    if (isNaN(numericScore)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    // Format to 2 decimal places as standard string
    const formattedScore = numericScore.toFixed(2);

    const existing = await db
      .select()
      .from(marks)
      .where(
        and(
          eq(marks.studentId, studentId),
          eq(marks.subjectId, subjectId),
          eq(marks.component, component)
        )
      );

    if (existing.length > 0) {
      await db
        .update(marks)
        .set({ 
          score: formattedScore as any, 
          updatedAt: new Date() 
        })
        .where(eq(marks.id, existing[0].id));
    } else {
      await db.insert(marks).values({
        studentId,
        subjectId,
        termId: validTermId,
        component,
        score: formattedScore as any,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Mark Error Details:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save mark" }, 
      { status: 500 }
    );
  }
}