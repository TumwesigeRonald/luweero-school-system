import { db } from "@/db";
import { classes } from "@/db/schema";
import { asc } from "drizzle-orm";
import ClassesClient from "./ClassesClient";
import { getCurrentTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const me = await getCurrentTeacher();
  const rows = await db.select().from(classes).orderBy(asc(classes.name));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Classes</h1>
        <p className="text-slate-500 mt-1">Manage school classes / streams.</p>
      </div>
      <ClassesClient initial={rows} isAdmin={me?.role === "admin"} />
    </div>
  );
}
