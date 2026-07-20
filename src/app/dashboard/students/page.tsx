import { db } from "@/db";
import { classes, students } from "@/db/schema";
import { asc } from "drizzle-orm";
import StudentsClient from "./StudentsClient";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const classRows = await db.select().from(classes).orderBy(asc(classes.name));
  const studentRows = await db.select().from(students).orderBy(asc(students.fullName));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Students</h1>
        <p className="text-slate-500 mt-1">Enroll and manage students.</p>
      </div>
      <StudentsClient initialStudents={studentRows} classes={classRows} />
    </div>
  );
}
