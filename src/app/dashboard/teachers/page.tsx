import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { asc } from "drizzle-orm";
import TeachersClient from "./TeachersClient";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const me = await getCurrentTeacher();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");
  const rows = await db
    .select({
      id: teachers.id,
      fullName: teachers.fullName,
      email: teachers.email,
      role: teachers.role,
      isActive: teachers.isActive,
    })
    .from(teachers)
    .orderBy(asc(teachers.fullName));
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Teachers</h1>
        <p className="text-slate-500 mt-1">
          Create teacher login accounts. New teachers can sign in and change their
          password.
        </p>
      </div>
      <TeachersClient initial={rows} />
    </div>
  );
}
