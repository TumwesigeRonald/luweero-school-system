import { db } from "@/db";
import { subjectTeachers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function isAssigned(
  teacherId: number,
  subjectId: number,
  classId: number,
): Promise<boolean> {
  const rows = await db
    .select()
    .from(subjectTeachers)
    .where(
      and(
        eq(subjectTeachers.teacherId, teacherId),
        eq(subjectTeachers.subjectId, subjectId),
        eq(subjectTeachers.classId, classId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

// Return list of subjectIds a teacher is assigned to in a class
export async function subjectsAssignedInClass(
  teacherId: number,
  classId: number,
): Promise<number[]> {
  const rows = await db
    .select({ subjectId: subjectTeachers.subjectId })
    .from(subjectTeachers)
    .where(
      and(
        eq(subjectTeachers.teacherId, teacherId),
        eq(subjectTeachers.classId, classId),
      ),
    );
  return rows.map((r) => r.subjectId);
}
