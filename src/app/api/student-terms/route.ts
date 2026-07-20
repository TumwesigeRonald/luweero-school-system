import { db } from "@/db";
import { studentTerms } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, termId, daysPresent, daysAbsent, feesBalance, feesPaid } = body;

    if (!studentId || !termId) {
      return NextResponse.json(
        { error: "studentId and termId are required" },
        { status: 400 }
      );
    }

    const insertedOrUpdated = await db
      .insert(studentTerms)
      .values({
        studentId: Number(studentId),
        termId: Number(termId),
        daysPresent: daysPresent !== undefined ? Number(daysPresent) : null,
        daysAbsent: daysAbsent !== undefined ? Number(daysAbsent) : null,
        feesBalance: feesBalance !== undefined ? String(feesBalance) : null,
        feesPaid: feesPaid !== undefined ? String(feesPaid) : null,
      } as any)
      .onConflictDoUpdate({
        target: [studentTerms.studentId, studentTerms.termId],
        set: {
          daysPresent: daysPresent !== undefined ? Number(daysPresent) : undefined,
          daysAbsent: daysAbsent !== undefined ? Number(daysAbsent) : undefined,
          feesBalance: feesBalance !== undefined ? String(feesBalance) : undefined,
          feesPaid: feesPaid !== undefined ? String(feesPaid) : undefined,
        } as any,
      })
      .returning();

    return NextResponse.json(insertedOrUpdated[0]);
  } catch (error) {
    console.error("Error updating student term:", error);
    return NextResponse.json(
      { error: "Failed to update student term record" },
      { status: 500 }
    );
  }
}