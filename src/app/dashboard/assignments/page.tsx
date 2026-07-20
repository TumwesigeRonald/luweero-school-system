import { db } from "@/db";
import { classes, subjects, teachers, subjectTeachers } from "@/db/schema";
import AssignmentsClient from "./AssignmentsClient";

export default async function AssignmentsPage() {
  const classRows = await db.select().from(classes);
  const subjectRows = await db.select().from(subjects);
  const teacherRows = await db
    .select({
      id: teachers.id,
      fullName: teachers.fullName,
      email: teachers.email,
    })
    .from(teachers);
  const assignmentRows = await db.select().from(subjectTeachers);

  return (
    <div>
      <AssignmentsClient
        initialClasses={classRows}
        initialSubjects={subjectRows}
        initialTeachers={teacherRows}
        initialAssignments={assignmentRows}
      />
    </div>
  );
}