"use client";

import { useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import { classes, marks, students, subjects, terms } from "@/db/schema";

type Class = InferSelectModel<typeof classes>;
type Mark = InferSelectModel<typeof marks>;
type Student = InferSelectModel<typeof students>;
type Subject = InferSelectModel<typeof subjects>;
type Term = InferSelectModel<typeof terms>;

interface MarksClientProps {
  initialClasses?: Class[];
  initialMarks?: Mark[];
  initialStudents?: Student[];
  initialSubjects?: Subject[];
  initialTerms?: Term[];
}

export default function MarksClient({
  initialClasses = [],
  initialMarks = [],
  initialStudents = [],
  initialSubjects = [],
  initialTerms = [],
}: MarksClientProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marks Entry</h1>
      <p className="text-slate-600">Marks management system loaded.</p>
    </div>
  );
}