"use client";

import { useMemo, useState } from "react";
import type { Class, Subject, SubjectTeacher } from "@/db/schema";

type TeacherRow = { id: number; fullName: string; email: string };

export default function AssignmentsClient({
  classes,
  subjects,
  teachers,
  assignments: initial,
}: {
  classes: Class[];
  subjects: Subject[];
  teachers: TeacherRow[];
  assignments: SubjectTeacher[];
}) {
  const [rows, setRows] = useState<SubjectTeacher[]>(initial);
  const [classId, setClassId] = useState<string>(classes[0]?.id ? String(classes[0].id) : "");
  const [subjectId, setSubjectId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentClass = classes.find((c) => String(c.id) === classId);
  const availableSubjects = subjects.filter(
    (s) => !currentClass || s.level === currentClass.level || s.level === "BOTH",
  );

  const teacherById = useMemo(() => {
    const m: Record<number, TeacherRow> = {};
    for (const t of teachers) m[t.id] = t;
    return m;
  }, [teachers]);
  const subjectById = useMemo(() => {
    const m: Record<number, Subject> = {};
    for (const s of subjects) m[s.id] = s;
    return m;
  }, [subjects]);

  const forClass = rows.filter((r) => String(r.classId) === classId);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        classId: Number(classId),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setRows([...rows, data.assignment]);
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm("Remove this assignment?")) return;
    const res = await fetch(`/api/assignments?id=${id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter((r) => r.id !== id));
    else alert("Failed to remove");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Class</label>
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
        </div>
      </div>

      <form
        onSubmit={add}
        className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end mb-4"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-500 mb-1">Subject</label>
          <select
            required
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          >
            <option value="">— Choose subject —</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.category ? `(${s.category})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-500 mb-1">Teacher</label>
          <select
            required
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          >
            <option value="">— Choose teacher —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>
        <button
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium"
        >
          {saving ? "Adding..." : "+ Assign"}
        </button>
        {error && <div className="text-xs text-red-600 w-full">{error}</div>}
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forClass.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 py-8">
                  No assignments for this class yet.
                </td>
              </tr>
            ) : (
              forClass.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {subjectById[r.subjectId]?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{teacherById[r.teacherId]?.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
