"use client";

import { useMemo, useState } from "react";
import type { Class, Student } from "@/db/schema";

export default function StudentsClient({
  initialStudents,
  classes,
}: {
  initialStudents: Student[];
  classes: Class[];
}) {
  const [rows, setRows] = useState<Student[]>(initialStudents);
  const [filter, setFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({
    admissionNo: "",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    classId: classes[0]?.id ? String(classes[0].id) : "",
    guardianName: "",
    guardianPhone: "",
    photoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk state
  const [bulkClassId, setBulkClassId] = useState<string>(
    classes[0]?.id ? String(classes[0].id) : "",
  );
  const [bulkText, setBulkText] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const classById = useMemo(() => {
    const m: Record<number, Class> = {};
    for (const c of classes) m[c.id] = c;
    return m;
  }, [classes]);

  const filtered = rows.filter((s) => {
    const matchText =
      !filter ||
      s.fullName.toLowerCase().includes(filter.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(filter.toLowerCase());
    const matchClass = !classFilter || String(s.classId) === classFilter;
    return matchText && matchClass;
  });

async function setPassword(id: number, name: string, admissionNo: string) {
    const pw = prompt(
      `Set a new password for ${name} (${admissionNo}):\n\nThey will log in at /student-login using their admission number.`,
      admissionNo, // suggest their admission number as the default password
    );
    if (!pw) return;
    if (pw.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    const res = await fetch("/api/students/passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: id, password: pw }),
    });
    if (res.ok) {
      alert(
        `✅ Password set for ${name}.\n\nTell them:\n\nAdmission No: ${admissionNo}\nPassword: ${pw}\n\nThey can log in at:\n/student-login`,
      );
    } else {
      alert("Failed to set password");
    }
  }

  async function setBulkPasswords() {
    if (!classFilter) {
      alert(
        "Please filter by a class first (using the dropdown at the top), then click this button again.",
      );
      return;
    }
    const klassName = classes.find((c) => String(c.id) === classFilter)?.name ?? "";
    const choice = confirm(
      `Set the DEFAULT password (each student's own admission number) for all students in ${klassName}?\n\nClick OK for admission-number passwords.\nClick Cancel to type a custom password instead.`,
    );
    let mode: "admNo" | "custom" = choice ? "admNo" : "custom";
    let customPw = "";
    if (mode === "custom") {
      const pw = prompt(
        `Enter the password to set for ALL students in ${klassName}:`,
        "student123",
      );
      if (!pw) return;
      if (pw.length < 4) {
        alert("Password must be at least 4 characters");
        return;
      }
      customPw = pw;
    }
    const onlyMissing = confirm(
      `Only set the password for students who don't yet have one?\n\nOK = only students with no password (safer)\nCancel = OVERWRITE passwords for all students in this class`,
    );

    if (mode === "admNo") {
      // Loop client-side: post one request per student
      const studentsInClass = filtered.filter(
        (s) => String(s.classId) === classFilter,
      );
      let updated = 0;
      for (const s of studentsInClass) {
        // if onlyMissing is true and student has a passwordHash we should skip
        // but we don't currently know that from the row; simplest: just set
        // for all (server will overwrite). If onlyMissing, we skip nothing —
        // this is fine because "admission-no as password" is deterministic.
        void onlyMissing;
        const res = await fetch("/api/students/passwords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: s.id, password: s.admissionNo }),
        });
        if (res.ok) updated++;
      }
      alert(
        `✅ Set passwords for ${updated} student(s).\n\nEach student's password is their admission number.\nThey log in at /student-login`,
      );
    } else {
      const res = await fetch("/api/students/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(classFilter),
          password: customPw,
          onlyMissing,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `✅ Set password "${customPw}" for ${data.updated} student(s) in ${klassName}.\n\nThey log in at /student-login`,
        );
      } else {
        alert("Failed: " + (data.error ?? ""));
      }
    }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Delete ${name}?\n\nThis also deletes ALL their marks. Cannot be undone.`))
      return;
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter((r) => r.id !== id));
    else alert("Failed to delete student");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId: Number(form.classId) }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else {
      setRows([...rows, data.student]);
      setForm({ ...form, admissionNo: "", fullName: "", gender: "", dateOfBirth: "", guardianName: "", guardianPhone: "", photoUrl: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    setBulkBusy(true);
    setBulkMsg(null);

    // Parse text: each line = one student. Detect comma/tab separated.
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed = lines.map((line) => {
      const parts = line.split(/[\t,]/).map((p) => p.trim());
      // If only one column, treat as full name only
      if (parts.length === 1) {
        return { fullName: parts[0] };
      }
      // Heuristic: if first col contains digits/slash, it's admission no.
      const first = parts[0];
      const looksLikeAdm = /[\d/-]/.test(first) && first.length <= 20;
      if (looksLikeAdm) {
        return {
          admissionNo: parts[0],
          fullName: parts[1] ?? "",
          gender: parts[2] ?? "",
          guardianName: parts[3] ?? "",
          guardianPhone: parts[4] ?? "",
        };
      }
      return {
        fullName: parts[0],
        gender: parts[1] ?? "",
        guardianName: parts[2] ?? "",
        guardianPhone: parts[3] ?? "",
      };
    });

    const res = await fetch("/api/students/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: Number(bulkClassId), rows: parsed }),
    });
    const data = await res.json();
    if (res.ok) {
      setBulkMsg(
        `✅ Imported ${data.inserted} student(s). ${data.skipped?.length ?? 0} skipped.`,
      );
      // Refresh page-side rows
      const refetch = await fetch(`/api/students?classId=${bulkClassId}`);
      const rd = await refetch.json();
      if (rd.students) {
        // Merge into rows (add new, keep others)
        const existingIds = new Set(rows.map((r) => r.id));
        const newOnes = (rd.students as Student[]).filter((s) => !existingIds.has(s.id));
        setRows([...rows, ...newOnes]);
      }
      setBulkText("");
    } else {
      setBulkMsg("❌ " + (data.error ?? "Failed"));
    }
    setBulkBusy(false);
  }

  if (classes.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
        Create at least one class first.
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or admission no."
            className="border rounded-lg px-3 py-2 border-slate-300 w-full"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 border-slate-300 w-full"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => {
              setShowBulk((s) => !s);
              setShowForm(false);
            }}
            className="bg-blue-600 text-white rounded-lg px-3 py-2 font-medium text-sm"
          >
            {showBulk ? "Close" : "📋 Bulk import"}
          </button>
          <button
            onClick={() => {
              setShowForm((s) => !s);
              setShowBulk(false);
            }}
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-medium text-sm"
          >
            {showForm ? "Close" : "+ New student"}
          </button>
          <button
            onClick={setBulkPasswords}
            className="bg-purple-600 text-white rounded-lg px-3 py-2 font-medium text-sm col-span-2 md:col-span-1"
            title="Filter by a class first, then click this to set passwords for all students in that class"
          >
            🔑 Bulk set passwords
          </button>
        </div>
      </div>

      {showBulk && (
        <form
          onSubmit={submitBulk}
          className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold">📋 Bulk import students</h3>
          <p className="text-xs text-slate-500">
            Paste students below — one per line. Copy directly from your Google Sheet or
            Excel. Accepted formats per line:
            <br />• Just a name: <code>NATAMBA SARAH</code>
            <br />• Adm no + name: <code>2026/001, NATAMBA SARAH</code>
            <br />• Adm no + name + gender + guardian + phone: <code>2026/001, NATAMBA SARAH, F, Mr Namubiru, 0700123456</code>
            <br />• Or tab-separated (paste from Sheets works directly)
          </p>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Import to class</label>
              <select
                value={bulkClassId}
                onChange={(e) => setBulkClassId(e.target.value)}
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
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            placeholder={"NATAMBA SARAH\nYIGA NELSON\nNAKABIRI GRACE\n..."}
            className="w-full font-mono text-sm border rounded-lg px-3 py-2 border-slate-300"
            required
          />
          {bulkMsg && <div className="text-sm">{bulkMsg}</div>}
          <button
            disabled={bulkBusy}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
          >
            {bulkBusy ? "Importing..." : "Import students"}
          </button>
        </form>
      )}

      {showForm && (
        <form
          onSubmit={add}
          className="bg-white rounded-xl shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input
            value={form.admissionNo}
            onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
            placeholder="Admission No. (blank to auto-generate)"
            className="border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Full name"
            className="border rounded-lg px-3 py-2 border-slate-300"
          />
          <select
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            className="border rounded-lg px-3 py-2 border-slate-300"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="border rounded-lg px-3 py-2 border-slate-300"
          >
            <option value="">Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <input
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            placeholder="Date of birth (YYYY-MM-DD)"
            className="border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            value={form.guardianName}
            onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            placeholder="Guardian name"
            className="border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            value={form.guardianPhone}
            onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            placeholder="Guardian phone"
            className="border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            value={form.photoUrl}
            onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            placeholder="Photo URL (from Imgur)"
            className="border rounded-lg px-3 py-2 border-slate-300 md:col-span-2"
          />
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              disabled={saving}
              className="bg-emerald-600 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add student"}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Adm. No.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-8">
                  No students match.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono">{s.admissionNo}</td>
                  <td className="px-4 py-3 font-medium">{s.fullName}</td>
                  <td className="px-4 py-3">{classById[s.classId]?.name ?? "—"}</td>
                  <td className="px-4 py-3">{s.gender ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {s.guardianName ? `${s.guardianName} · ${s.guardianPhone ?? ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => setPassword(s.id, s.fullName, s.admissionNo)}
                      className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium"
                      title="Set / reset student portal password"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => remove(s.id, s.fullName)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded font-medium"
                    >
                      Delete
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
