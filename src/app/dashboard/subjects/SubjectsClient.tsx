"use client";

import type { InferSelectModel } from "drizzle-orm";
import { subjects } from "@/db/schema";

type Subject = InferSelectModel<typeof subjects>;

interface SubjectsClientProps {
  initial?: Subject[];
  isAdmin?: boolean;
}

export default function SubjectsClient({
  initial = [],
  isAdmin = false,
}: SubjectsClientProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Subject Management</h1>
      <p className="text-slate-600">Subjects loaded ({initial.length} record(s)).</p>
    </div>
  );
}