import { db } from "@/db";
import { classes, students, terms } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const classRows = await db.select().from(classes).orderBy(asc(classes.name));
  const termRows = await db.select().from(terms).orderBy(desc(terms.academicYear), desc(terms.id));
  const studentRows = await db.select().from(students).orderBy(asc(students.fullName));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Report Cards</h1>
        <p className="text-slate-500 mt-1">Generate and print student report cards.</p>
      </div>
      <ReportsClient classes={classRows} terms={termRows} students={studentRows} />
    </div>
  );
}
