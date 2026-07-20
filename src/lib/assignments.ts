import { db } from "@/db";
import { subjectTeachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAssignedSubjectIds(teacherId: number, classId: number): Promise<number[]> {
  const rows = await db
    .select({ subjectId: subjectTeachers.subjectId })
    .from(subjectTeachers)
    .where(and(eq(subjectTeachers.teacherId, teacherId), eq(subjectTeachers.classId, classId)));

  return rows
    .map((r) => r.subjectId)
    .filter((id): id is number => id !== null);
}