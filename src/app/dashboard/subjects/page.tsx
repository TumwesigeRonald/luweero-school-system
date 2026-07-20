import { db } from "@/db";
import { subjects } from "@/db/schema";
import { asc } from "drizzle-orm";
import SubjectsClient from "./SubjectsClient";
import { getCurrentTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const me = await getCurrentTeacher();
  const rows = await db.select().from(subjects).orderBy(asc(subjects.name));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Subjects</h1>
        <p className="text-slate-500 mt-1">Subjects offered.</p>
      </div>
      <SubjectsClient initial={rows} isAdmin={me?.role === "admin"} />
    </div>
  );
}
