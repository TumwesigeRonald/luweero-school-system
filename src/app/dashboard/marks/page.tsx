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
    const termId = termIdParam ? Number(termIdParam) : null;

    // 1. Fetch Class
    const classData = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .then((res) => res[0] ?? null);

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // 2. Fetch Students in Class
    const classStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, classId));

    // 3. Fetch Subjects for Level (O-LEVEL vs A-LEVEL)
    const levelSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.level, classData.level));

    // 4. Components
    const components =
      classData.level === "O-LEVEL"
        ? ["AOI1", "AOI2", "EOT"]
        : ["P1", "P2"];

    // 5. Fetch Marks
    let existingMarks: any[] = [];
    if (termId) {
      existingMarks = await db
        .select()
        .from(marks)
        .where(eq(marks.termId, termId));
    } else {
      existingMarks = await db.select().from(marks);
    }

    return NextResponse.json({
      class: classData,
      students: classStudents,
      subjects: levelSubjects,
      components,
      marks: existingMarks,
    });
  } catch (error) {
    console.error("GET Marks Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}