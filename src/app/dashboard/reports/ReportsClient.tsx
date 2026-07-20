"use client";

import type { InferSelectModel } from "drizzle-orm";
import { classes, students, terms } from "@/db/schema";

type Class = InferSelectModel<typeof classes>;
type Student = InferSelectModel<typeof students>;
type Term = InferSelectModel<typeof terms>;

interface ReportsClientProps {
  classes?: Class[];
  terms?: Term[];
  students?: Student[];
}

export default function ReportsClient({
  classes = [],
  terms = [],
  students = [],
}: ReportsClientProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Reports</h1>
      <p className="text-slate-600">Report generation system ready.</p>
    </div>
  );
}