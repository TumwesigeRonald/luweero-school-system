"use client";

import { useState } from "react";

type Row = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function TeachersClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "teacher" as "teacher" | "admin",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk
  const [bulkText, setBulkText] = useState("");
  const [bulkDefaultPw, setBulkDefaultPw] = useState("teacher123");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    inserted: { fullName: string; email: string; password: string }[];
    skipped: { name: string; reason: string }[];
  } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setRows([...rows, data.teacher]);
      setMsg(
        `✅ ${form.fullName} created. They can sign in with: ${form.email} / ${form.password}`,
      );
      setForm({ fullName: "", email: "", password: "", role: "teacher" });
    } else {
      setError(data.error ?? "Failed");
    }
    setSaving(false);
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    setBulkBusy(true);
    setBulkResult(null);
    const lines = bulkText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const parsed = lines.map((line) => {
      const parts = line.split(/[\t,]/).map((p) => p.trim());
      // Formats: "Name" OR "Name, email" OR "Name, email, password"
      return {
        fullName: parts[0] ?? "",
        email: parts[1] ?? "",
        password: parts[2] ?? "",
      };
    });
    const res = await fetch("/api/teachers/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: parsed, defaultPassword: bulkDefaultPw }),
    });
    const data = await res.json();
    if (res.ok) {
      setBulkResult({ inserted: data.inserted ?? [], skipped: data.skipped ?? [] });
      setRows([
        ...rows,
        ...(data.inserted ?? []).map(
          (t: { fullName: string; email: string }, i: number) => ({
            id: Date.now() + i,
            fullName: t.fullName,
            email: t.email,
            role: "teacher",
            isActive: true,
          }),
        ),
      ]);
      setBulkText("");
    } else {
      alert(data.error ?? "Failed");
    }
    setBulkBusy(false);
  }

  async function resetPassword(t: Row) {
    const newPw = prompt(`New password for ${t.fullName}?\n(min 6 characters)`);
    if (!newPw) return;
    if (newPw.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPw }),
    });
    if (res.ok) {
      alert(`✅ Password reset. Tell ${t.fullName} their new password is: ${newPw}`);
    } else {
      const d = await res.json();
      alert("Failed: " + (d.error ?? ""));
    }
  }

  async function toggleActive(t: Row) {
    const res = await fetch(`/api/teachers/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if (res.ok) {
      setRows(rows.map((r) => (r.id === t.id ? { ...r, isActive: !t.isActive } : r)));
    }
  }

  async function remove(t: Row) {
    if (!confirm(`Delete teacher ${t.fullName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/teachers/${t.id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter((r) => r.id !== t.id));
    else {
      const d = await res.json();
      alert("Failed: " + (d.error ?? ""));
    }
  }

  function copyResult() {
    if (!bulkResult) return;
    const text = bulkResult.inserted
      .map((t) => `${t.fullName}\t${t.email}\t${t.password}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard. Paste into a WhatsApp / SMS / email to share with teachers.");
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => {
            setShowBulk((s) => !s);
            setShowAdd(false);
          }}
          className="bg-blue-600 text-white rounded-lg px-3 py-2 font-medium text-sm"
        >
          {showBulk ? "Close" : "📋 Bulk create teachers"}
        </button>
        <button
          onClick={() => {
            setShowAdd((s) => !s);
            setShowBulk(false);
          }}
          className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-medium text-sm"
        >
          {showAdd ? "Close" : "+ Add one teacher"}
        </button>
      </div>

      {/* Bulk form */}
      {showBulk && (
        <form
          onSubmit={submitBulk}
          className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold">📋 Bulk create teacher accounts</h3>
          <p className="text-xs text-slate-500">
            Paste teachers below — one per line. Formats accepted:
            <br />• <code>Full Name</code> (email auto-generated as
            firstname.lastname@lcss.ug)
            <br />• <code>Full Name, email</code>
            <br />• <code>Full Name, email, password</code> (custom password)
          </p>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Default password (used when password column is blank)
            </label>
            <input
              value={bulkDefaultPw}
              onChange={(e) => setBulkDefaultPw(e.target.value)}
              className="border rounded-lg px-3 py-2 border-slate-300 w-full sm:w-64"
              placeholder="teacher123"
              required
            />
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            required
            placeholder={
              "OKOED CHARLES\nKIKOMEKO AKIM\nMUWANIKA SHARIF\nASUBU EMMA\nNABULYA DOROTHY, dorothy@lcss.ug\nCHESURO PETRA, petra@lcss.ug, mySecure123"
            }
            className="w-full font-mono text-sm border rounded-lg px-3 py-2 border-slate-300"
          />
          <button
            disabled={bulkBusy}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
          >
            {bulkBusy ? "Creating..." : "Create all accounts"}
          </button>
          {bulkResult && (
            <div className="mt-4 space-y-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
                <div className="font-semibold text-emerald-900 mb-2">
                  ✅ Created {bulkResult.inserted.length} account(s).{" "}
                  {bulkResult.skipped.length > 0 && (
                    <span className="text-amber-800">
                      Skipped {bulkResult.skipped.length}.
                    </span>
                  )}
                </div>
                {bulkResult.inserted.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={copyResult}
                      className="mb-2 text-xs bg-white border border-emerald-300 rounded px-2 py-1 hover:bg-emerald-100"
                    >
                      📋 Copy credentials to clipboard
                    </button>
                    <div className="max-h-48 overflow-auto bg-white border border-emerald-200 rounded p-2 font-mono text-xs">
                      {bulkResult.inserted.map((t, i) => (
                        <div key={i}>
                          {t.fullName} · {t.email} · <strong>{t.password}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {bulkResult.skipped.length > 0 && (
                  <div className="mt-2 text-xs text-amber-800">
                    <div className="font-semibold">Skipped:</div>
                    {bulkResult.skipped.map((s, i) => (
                      <div key={i}>
                        • {s.name} — {s.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      )}

      {/* Single add form */}
      {showAdd && (
        <form
          onSubmit={add}
          className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-3"
        >
          <h3 className="font-semibold">+ Add a single teacher</h3>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Full name"
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          />
          <input
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Initial password (min 6)"
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          />
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as "teacher" | "admin" })
            }
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
          >
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          {error && <div className="text-xs text-red-600">{error}</div>}
          {msg && <div className="text-xs text-emerald-700">{msg}</div>}
          <button
            disabled={saving}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create teacher"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{r.fullName}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${r.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {r.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(r)}
                    className="text-xs"
                    title="Click to toggle"
                  >
                    {r.isActive ? "🟢 Active" : "⚫ Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                  <button
                    onClick={() => resetPassword(r)}
                    className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium"
                  >
                    🔑 Reset PW
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
