"use client";

import { useState } from "react";
import type { Class } from "@/db/schema";

export default function ClassesClient({
  initial,
  isAdmin,
}: {
  initial: Class[];
  isAdmin: boolean;
}) {
  const [rows, setRows] = useState<Class[]>(initial);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("O-LEVEL");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setupDefaults() {
    if (
      !confirm(
        "This will add any missing S1–S6 classes (without streams). Existing classes will NOT be duplicated. Continue?",
      )
    )
      return;
    const res = await fetch("/api/classes/setup-defaults", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setRows(data.classes ?? []);
      alert(`Added ${data.inserted} class(es). You now have ${data.classes.length} classes.`);
    } else {
      alert(data.error ?? "Failed");
    }
  }

  async function remove(id: number, name: string) {
    if (
      !confirm(
        `Delete class "${name}"?\n\nThis will also delete ALL students and marks in this class. This cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter((r) => r.id !== id));
    else alert("Failed to delete class");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, level }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else {
      setRows([...rows, data.class]);
      setName("");
      setLevel("O-LEVEL");
    }
    setSaving(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Components</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center text-slate-400 py-8">
                  No classes yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        r.level === "A-LEVEL"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {r.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {r.level === "A-LEVEL" ? "P1, P2" : "AO1, AO2, EOT"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(r.id, r.name)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-3">Add class</h3>
        {!isAdmin ? (
          <p className="text-sm text-slate-500">Only admins can add classes.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={setupDefaults}
              className="w-full mb-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-medium text-sm"
            >
              ⚡ Add all default classes (S1–S6)
            </button>
            <div className="text-center text-xs text-slate-400 mb-3">— or add one manually —</div>
          <form onSubmit={add} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. S1, S2, S3..."
              className="w-full border rounded-lg px-3 py-2 border-slate-300"
              required
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 border-slate-300"
            >
              <option value="O-LEVEL">O-LEVEL (S1–S4)</option>
              <option value="A-LEVEL">A-LEVEL (S5–S6)</option>
            </select>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <button
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add class"}
            </button>
          </form>
          </>
        )}
      </div>
    </div>
  );
}
