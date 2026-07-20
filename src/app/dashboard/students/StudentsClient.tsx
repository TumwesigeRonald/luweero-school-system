"use client";

import type { InferSelectModel } from "drizzle-orm";
import { classes, students } from "@/db/schema";

type Class = InferSelectModel<typeof classes>;
type Student = InferSelectModel<typeof students>;

interface StudentsClientProps {
  initialStudents?: Student[];
  classes?: Class[];
}

export default function StudentsClient({
  initialStudents = [],
  classes = [],
}: StudentsClientProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Roster</h1>
      <p className="text-slate-600">Student directory loaded.</p>
    </div>
  );
}