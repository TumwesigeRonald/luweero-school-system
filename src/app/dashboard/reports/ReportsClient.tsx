"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class, Student, Term } from "@/db/schema";
import ReportCard, { type ReportData } from "./ReportCard";

export default function ReportsClient({
  classes,
  terms,
  students,
}: {
  classes: Class[];
  terms: Term[];
  students: Student[];
}) {
  const [classId, setClassId] = useState<string>(
    classes[0]?.id ? String(classes[0].id) : "",
  );
  const activeTerm = terms.find((t) => t.isActive) ?? terms[0];
  const [termId, setTermId] = useState<string>(activeTerm ? String(activeTerm.id) : "");
  const [studentId, setStudentId] = useState<string>("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attendance / fees editor state
  const [stForm, setStForm] = useState({
    daysPresent: "",
    daysAbsent: "",
    feesPaid: "",
    feesBalance: "",
    conduct: "",
    classTeacherComment: "",
    headTeacherComment: "",
  });
  const [stSaving, setStSaving] = useState(false);
  const [stMsg, setStMsg] = useState<string | null>(null);

  // Bulk state
  const [bulk, setBulk] = useState<ReportData[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const classStudents = useMemo(
    () => students.filter((s) => String(s.classId) === classId),
    [students, classId],
  );

  useEffect(() => {
    if (classStudents.length > 0) setStudentId(String(classStudents[0].id));
    else {
      setStudentId("");
      setReport(null);
    }
  }, [classStudents]);

  useEffect(() => {
    if (!studentId || !termId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/report?studentId=${studentId}&termId=${termId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setReport(d);
          const st = d.studentTerm ?? {};
          setStForm({
            daysPresent: st.daysPresent ?? "",
            daysAbsent: st.daysAbsent ?? "",
            feesPaid: st.feesPaid ?? "",
            feesBalance: st.feesBalance ?? "",
            conduct: st.conduct ?? "",
            classTeacherComment: st.classTeacherComment ?? "",
            headTeacherComment: st.headTeacherComment ?? "",
          });
        }
      })
      .catch(() => setError("Failed"))
      .finally(() => setLoading(false));
  }, [studentId, termId]);

  async function saveStudentTerm(e: React.FormEvent) {
    e.preventDefault();
    setStSaving(true);
    setStMsg(null);
    const res = await fetch("/api/student-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: Number(studentId),
        termId: Number(termId),
        ...stForm,
      }),
    });
    if (res.ok) {
      setStMsg("✅ Saved");
      // Refresh report
      const r = await fetch(`/api/report?studentId=${studentId}&termId=${termId}`);
      const d = await r.json();
      setReport(d);
      setTimeout(() => setStMsg(null), 2000);
    } else setStMsg("❌ Failed");
    setStSaving(false);
  }

  async function loadBulk() {
    setBulkLoading(true);
    const res = await fetch(`/api/report/bulk?classId=${classId}&termId=${termId}`);
    const d = await res.json();
    setBulk(d.reports ?? []);
    setBulkLoading(false);
    // Trigger print after a short delay
    setTimeout(() => window.print(), 500);
  }

  function exportCsv() {
    window.open(`/api/marks/export?classId=${classId}&termId=${termId}`, "_blank");
  }

  return (
    <div>
      <div className="space-y-3 mb-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="border rounded-lg px-3 py-2 border-slate-300"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="border rounded-lg px-3 py-2 border-slate-300"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.academicYear}
              </option>
            ))}
          </select>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="border rounded-lg px-3 py-2 border-slate-300"
          >
            {classStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.admissionNo})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={exportCsv}
            className="bg-blue-600 text-white rounded-lg px-3 py-2 font-medium text-sm"
          >
            📊 Export Marks CSV
          </button>
          <button
            onClick={loadBulk}
            disabled={bulkLoading}
            className="bg-purple-600 text-white rounded-lg px-3 py-2 font-medium text-sm disabled:opacity-50"
          >
            {bulkLoading ? "Loading..." : "🖨️ Print All Reports"}
          </button>
          <button
            onClick={() => {
              setBulk(null);
              window.print();
            }}
            disabled={!report}
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-medium text-sm disabled:opacity-50"
          >
            🖨️ Print This
          </button>
        </div>
      </div>

      {/* Attendance / fees / comments editor */}
      {report && !bulk && (
        <details className="bg-white rounded-xl shadow-sm p-4 mb-4 no-print">
          <summary className="cursor-pointer font-semibold text-sm">
            📋 Attendance, Fees &amp; Comments for this student
          </summary>
          <form
            onSubmit={saveStudentTerm}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4"
          >
            <div>
              <label className="block text-xs text-slate-500 mb-1">Days Present</label>
              <input
                type="number"
                value={stForm.daysPresent}
                onChange={(e) => setStForm({ ...stForm, daysPresent: e.target.value })}
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Days Absent</label>
              <input
                type="number"
                value={stForm.daysAbsent}
                onChange={(e) => setStForm({ ...stForm, daysAbsent: e.target.value })}
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fees Paid (UGX)</label>
              <input
                type="number"
                value={stForm.feesPaid}
                onChange={(e) => setStForm({ ...stForm, feesPaid: e.target.value })}
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fees Balance (UGX)</label>
              <input
                type="number"
                value={stForm.feesBalance}
                onChange={(e) => setStForm({ ...stForm, feesBalance: e.target.value })}
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">
                Class Teacher&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={stForm.classTeacherComment}
                onChange={(e) =>
                  setStForm({ ...stForm, classTeacherComment: e.target.value })
                }
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">
                Head Teacher&apos;s Comment
              </label>
              <textarea
                rows={2}
                value={stForm.headTeacherComment}
                onChange={(e) =>
                  setStForm({ ...stForm, headTeacherComment: e.target.value })
                }
                className="w-full border rounded px-2 py-1 border-slate-300"
              />
            </div>
            <div className="md:col-span-4 flex items-center gap-3">
              <button
                disabled={stSaving}
                className="bg-emerald-600 text-white rounded-lg px-4 py-1.5 font-medium disabled:opacity-50 text-sm"
              >
                {stSaving ? "Saving..." : "Save"}
              </button>
              {stMsg && <span className="text-sm">{stMsg}</span>}
            </div>
          </form>
        </details>
      )}

      {loading && (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500">Loading...</div>
      )}
      {error && <div className="bg-red-50 text-red-700 rounded-xl p-4">{error}</div>}

      {/* Bulk render (for print-all) */}
      {bulk && bulk.length > 0 && (
        <div className="space-y-6">
          {bulk.map((r, idx) => (
            <div key={idx} className="break-after-page">
              <ReportCard data={r} />
            </div>
          ))}
        </div>
      )}

      {/* Single report */}
      {!bulk && !loading && !error && report && <ReportCard data={report} />}
      {!bulk && !loading && !error && !report && classStudents.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-slate-500">
          No students in this class.
        </div>
      )}
    </div>
  );
}
