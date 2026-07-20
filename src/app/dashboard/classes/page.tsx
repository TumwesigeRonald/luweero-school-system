import { db } from "@/db";
import { classes } from "@/db/schema";
import ClassesClient from "./ClassesClient";

export default async function ClassesPage() {
  const rows = await db.select().from(classes);
  const me = { role: "admin" }; 

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Classes</h1>
      <p className="text-slate-500 mt-1">Manage school classes / streams.</p>
      <ClassesClient initialClasses={rows} isAdmin={me?.role === "admin"} />
    </div>
  );
}