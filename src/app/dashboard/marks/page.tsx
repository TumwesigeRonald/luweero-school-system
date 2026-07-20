import { db } from "@/db";
import { classes, marks, students, subjects, terms } from "@/db/schema";
import MarksClient from "./MarksClient";

export default async function MarksPage() {
  const classRows = await db.select().from(classes);
  const markRows = await db.select().from(marks);
  const studentRows = await db.select().from(students);
  const subjectRows = await db.select().from(subjects);
  const termRows = await db.select().from(terms);

  return (
    <MarksClient
      initialClasses={classRows}
      initialMarks={markRows}
      initialStudents={studentRows}
      initialSubjects={subjectRows}
      initialTerms={termRows}
    />
  );
}