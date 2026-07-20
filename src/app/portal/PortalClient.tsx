"use client";

import { useEffect, useState } from "react";
import type { ReportData } from "@/app/dashboard/reports/ReportCard";
import ReportCard from "@/app/dashboard/reports/ReportCard";

type Term = {
  id: number;
  name: string;
  academicYear: number;
  isActive: boolean;
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function PortalClient() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "report">("overview");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = termId ? `/api/student-portal?termId=${termId}` : `/api/student-portal`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setReport(d.report);
          setTerms(d.terms ?? []);
          if (!termId && d.report?.term?.id) {
            setTermId(String(d.report.term.id));
          }
        }
      })
      .catch(() => setError("Failed to load your results"))
      .finally(() => setLoading(false));
  }, [termId]);

  if (loading && !report) {
    return (
      <div className="bg-white rounded-xl p-8 text-center text-slate-500 shadow-sm">
        Loading your results...
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        {error}
      </div>
    );
  }
  if (!report) return null;

  const { student, class: klass, term, subjects, studentTerm, totals } = report;
  const feesBalance = studentTerm?.feesBalance ? Number(studentTerm.feesBalance) : 0;
  const feesPaid = studentTerm?.feesPaid ? Number(studentTerm.feesPaid) : 0;
  const takenSubjects = subjects.filter((s) => s.finalScore != null);

  return (
    <div className="space-y-4">
      {/* Term selector */}
      <div className="bg-white rounded-xl shadow-sm p-3 flex flex-wrap items-center gap-3 no-print">
        <label className="text-xs font-semibold text-slate-500 uppercase">Term</label>
        <select
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="border rounded-lg px-3 py-2 border-slate-300 text-sm flex-1 max-w-xs"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.academicYear} {t.isActive ? "(current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 no-print">
        <button
          onClick={() => setTab("overview")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            tab === "overview"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setTab("report")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            tab === "report"
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          📄 Full Report Card
        </button>
      </div>

      {tab === "overview" ? (
        <>
          {/* Welcome banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 md:p-6 shadow-md">
            <div className="flex items-start gap-4">
              {student.photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={student.photoUrl}
                  alt="You"
                  className="w-16 h-20 object-cover rounded border-2 border-white/40"
                />
              ) : (
                <div className="w-16 h-20 rounded bg-white/15 flex items-center justify-center text-3xl border-2 border-white/40 flex-shrink-0">
                  🎓
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-blue-100 uppercase tracking-wide">
                  Welcome
                </div>
                <div className="text-lg md:text-2xl font-bold uppercase truncate">
                  {student.fullName}
                </div>
                <div className="text-sm text-blue-100 mt-1 space-y-0.5">
                  <div>📌 Adm No: {student.admissionNo}</div>
                  <div>
                    🏫 {klass?.name ?? "—"} · {term?.name} {term?.academicYear}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Big fees card */}
          <div
            className={`rounded-xl p-4 md:p-5 shadow-md border-2 ${
              feesBalance > 0
                ? "bg-red-50 border-red-300"
                : "bg-emerald-50 border-emerald-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className={`text-xs uppercase font-bold tracking-wide ${
                    feesBalance > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  💰 School Fees Status
                </div>
                <div
                  className={`text-3xl md:text-4xl font-bold mt-2 ${
                    feesBalance > 0 ? "text-red-900" : "text-emerald-900"
                  }`}
                >
                  {feesBalance > 0
                    ? `UGX ${feesBalance.toLocaleString()}`
                    : "Fully paid ✅"}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    feesBalance > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {feesBalance > 0
                    ? "Balance owed"
                    : "You have no outstanding fees for this term."}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div>Paid this term:</div>
                <div className="font-semibold text-slate-800">
                  {feesPaid > 0 ? `UGX ${feesPaid.toLocaleString()}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance + performance summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Days Present
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {studentTerm?.daysPresent ?? "—"}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Days Absent
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {studentTerm?.daysAbsent ?? "—"}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Average
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {totals.average > 0 ? `${totals.average.toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">
                Position
              </div>
              <div className="text-2xl font-bold text-amber-700">
                {totals.position
                  ? `${ordinal(totals.position)}`
                  : "—"}
                {totals.classSize > 0 && (
                  <span className="text-xs font-normal text-slate-500">
                    {" "}/{totals.classSize}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subjects summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm">📚 My Subjects & Grades</h3>
              <span className="text-xs text-slate-500">
                {takenSubjects.length} subject{takenSubjects.length === 1 ? "" : "s"}
              </span>
            </div>
            {takenSubjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No marks have been recorded yet for this term.
                <br />
                <span className="text-xs">Please check back later.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-left">
                    <tr>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2 text-center">Score</th>
                      <th className="px-3 py-2 text-center">Grade</th>
                      <th className="px-3 py-2 text-center hidden sm:table-cell">
                        Position
                      </th>
                      <th className="px-3 py-2 hidden md:table-cell">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {takenSubjects.map((s) => (
                      <tr key={s.subjectId} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">
                          {s.subjectName}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {s.finalScore?.toFixed(0)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${gradeColor(
                              s.grade,
                            )}`}
                          >
                            {s.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-slate-600 hidden sm:table-cell">
                          {s.subjectPosition
                            ? `${ordinal(s.subjectPosition)} / ${s.subjectClassCount}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 hidden md:table-cell">
                          {s.descriptor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Comments */}
          {(studentTerm?.classTeacherComment ||
            studentTerm?.headTeacherComment ||
            totals.overallRemark) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">
                  Class Teacher&apos;s Comment
                </div>
                <p className="text-sm text-slate-800">
                  {studentTerm?.classTeacherComment || totals.overallRemark}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-xs uppercase text-slate-500 font-semibold mb-1">
                  Head Teacher&apos;s Comment
                </div>
                <p className="text-sm text-slate-800">
                  {studentTerm?.headTeacherComment ||
                    (totals.average >= 60
                      ? "Commendable performance. Keep it up."
                      : "More effort is needed next term.")}
                </p>
              </div>
            </div>
          )}

          {/* Next term dates */}
          {(term?.nextTermBeginsAt || term?.nextTermEndsAt) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center text-sm font-semibold text-blue-900">
              📅 Next term begins: {term.nextTermBeginsAt ?? "—"} · ends:{" "}
              {term.nextTermEndsAt ?? "—"}
            </div>
          )}

          <div className="flex justify-center pt-2 no-print">
            <button
              onClick={() => setTab("report")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow"
            >
              View Full Report Card →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end no-print">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              🖨️ Print / Save as PDF
            </button>
          </div>
          <ReportCard data={report} />
        </>
      )}
    </div>
  );
}

function gradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-800";
    case "B":
      return "bg-blue-100 text-blue-800";
    case "C":
      return "bg-amber-100 text-amber-800";
    case "D":
      return "bg-orange-100 text-orange-800";
    case "E":
    case "F":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
