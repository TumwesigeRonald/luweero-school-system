import { db } from "@/db";
import { classes, terms } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import MarksClient from "./MarksClient";

export const dynamic = "force-dynamic";

export default async function MarksPage() {
  const classRows = await db.select().from(classes).orderBy(asc(classes.name));
  const termRows = await db
    .select()
    .from(terms)
    .orderBy(desc(terms.academicYear), desc(terms.id));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Enter Marks</h1>
        <p className="text-slate-500 mt-1">
          Pick class → term → subject, then enter scores. Auto-saves on blur.
        </p>
      </div>
      <MarksClient classes={classRows} terms={termRows} />
    </div>
  );
}
