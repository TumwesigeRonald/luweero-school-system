import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { db } from "@/db";
import { classes, subjects, teachers, subjectTeachers } from "@/db/schema";
import { asc } from "drizzle-orm";
import AssignmentsClient from "./AssignmentsClient";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const me = await getCurrentTeacher();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");
  const [classRows, subjectRows, teacherRows, assignmentRows] = await Promise.all([
    db.select().from(classes).orderBy(asc(classes.name)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db
      .select({ id: teachers.id, fullName: teachers.fullName, email: teachers.email })
      .from(teachers)
      .orderBy(asc(teachers.fullName)),
    db.select().from(subjectTeachers),
  ]);
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Assign Teachers to Subjects</h1>
        <p className="text-slate-500 mt-1">
          Teachers will only be able to enter marks for subjects they&apos;re assigned to
          (admins can edit everything).
        </p>
      </div>
      <AssignmentsClient
        classes={classRows}
        subjects={subjectRows}
        teachers={teacherRows}
        assignments={assignmentRows}
      />
    </div>
  );
}
