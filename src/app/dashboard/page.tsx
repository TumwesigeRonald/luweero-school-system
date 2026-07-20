import { db } from "@/db";
import { classes, students, subjects, marks, terms } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { getCurrentTeacher } from "@/lib/auth";
import TermsPanel from "./TermsPanel";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const me = await getCurrentTeacher();
  const [classCount] = await db.select({ c: sql<number>`count(*)::int` }).from(classes);
  const [studentCount] = await db.select({ c: sql<number>`count(*)::int` }).from(students);
  const [subjectCount] = await db.select({ c: sql<number>`count(*)::int` }).from(subjects);
  const [markCount] = await db.select({ c: sql<number>`count(*)::int` }).from(marks);
  const termRows = await db
    .select()
    .from(terms)
    .orderBy(desc(terms.academicYear), desc(terms.id));

  const stats = [
    { label: "Classes", value: classCount?.c ?? 0, color: "bg-blue-500", icon: "🏫" },
    { label: "Students", value: studentCount?.c ?? 0, color: "bg-emerald-500", icon: "🎒" },
    { label: "Subjects", value: subjectCount?.c ?? 0, color: "bg-amber-500", icon: "📚" },
    { label: "Marks Recorded", value: markCount?.c ?? 0, color: "bg-indigo-500", icon: "📝" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome, {me?.fullName} 👋</h1>
        <p className="text-slate-500 mt-1">
          Active term:{" "}
          <span className="font-medium text-slate-700">
            {termRows.find((t) => t.isActive)?.name ?? "None"}{" "}
            {termRows.find((t) => t.isActive)?.academicYear ?? ""}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div
              className={`${s.color} text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/marks"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div className="text-2xl mb-2">✏️</div>
          <h3 className="font-semibold text-lg">Enter Marks</h3>
          <p className="text-sm text-slate-500">Record scores by subject and term.</p>
        </Link>
        <Link
          href="/dashboard/reports"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
        >
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-semibold text-lg">Generate Report Cards</h3>
          <p className="text-sm text-slate-500">
            Print-ready reports with grades, positions, attendance & fees.
          </p>
        </Link>
      </div>

      {me?.role === "admin" && <TermsPanel initial={termRows} />}

      <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <div>
          Luweero Community Secondary School · Developed by{" "}
          <span className="font-semibold text-slate-700">TUMWESIGE RONALD</span>
        </div>
        <div className="mt-1 text-slate-400">
          📞 0702003686 · ✉ tumwesigeronald4@gmail.com
        </div>
      </div>
    </div>
  );
}
