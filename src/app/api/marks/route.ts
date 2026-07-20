import { NextResponse } from "next/server";
import { db } from "@/db";
import { marks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const studentId = Number(body.studentId);
    const subjectId = Number(body.subjectId);
    const termId = Number(body.termId);
    const { component, score } = body;

    if (!studentId || !subjectId || !termId || !component) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (score === "" || score === null || score === undefined) {
      await db
        .delete(marks)
        .where(
          and(
            eq(marks.studentId, studentId),
            eq(marks.subjectId, subjectId),
            eq(marks.termId, termId),
            eq(marks.component, component)
          )
        );
      return NextResponse.json({ success: true });
    }

    const numericScore = parseFloat(String(score));
    if (isNaN(numericScore)) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const formattedScore = numericScore.toFixed(2);

    const existing = await db
      .select()
      .from(marks)
      .where(
        and(
          eq(marks.studentId, studentId),
          eq(marks.subjectId, subjectId),
          eq(marks.termId, termId),
          eq(marks.component, component)
        )
      );

    if (existing.length > 0) {
      await db
        .update(marks)
        .set({ score: formattedScore, updatedAt: new Date() })
        .where(eq(marks.id, existing[0].id));
    } else {
      await db.insert(marks).values({
        studentId,
        subjectId,
        termId,
        component,
        score: formattedScore,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Mark Error:", error);
    return NextResponse.json({ error: "Failed to save mark" }, { status: 500 });
  }
}