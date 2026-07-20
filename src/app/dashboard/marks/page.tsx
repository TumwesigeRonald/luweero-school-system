import { db } from "@/db";
import { classes, terms } from "@/db/schema";
import MarksClient from "./MarksClient";

export const dynamic = "force-dynamic";

export default async function MarksPage() {
  const allClasses = await db.select().from(classes);
  const allTerms = await db.select().from(terms);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Enter Marks</h1>
        <p className="text-sm text-slate-500">
          Pick class → term → subject, then enter scores. Auto-saves on blur.
        </p>
      </div>

      <MarksClient classes={allClasses} terms={allTerms} />
    </div>
  );
}