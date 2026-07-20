"use client";

import { useState } from "react";
import type { Subject } from "@/db/schema";

export default function SubjectsClient({
  initial,
  isAdmin,
}: {
  initial: Subject[];
  isAdmin: boolean;
}) {
  const [rows, setRows] = useState<Subject[]>(initial);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [level, setLevel] = useState<"O-LEVEL" | "A-LEVEL" | "BOTH">("O-LEVEL");
  const [category, setCategory] = useState<"" | "PRINCIPAL" | "SUBSIDIARY" | "GENERAL">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  async function remove(id: number, name: string) {
    if (
      !confirm(
        `Delete subject "${name}"?\n\nThis will also delete ALL marks recorded for this subject. This cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter((r) => r.id !== id));
    else alert("Failed to delete subject");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, level, category: category || null }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else {
      setRows([...rows, data.subject]);
      setName("");
      setCode("");
      setCategory("");
    }
    setSaving(false);
  }

  const filtered = filter ? rows.filter((r) => r.level === filter || r.level === "BOTH") : rows;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1 rounded text-xs font-medium ${filter === "" ? "bg-slate-800 text-white" : "bg-slate-100"}`}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setFilter("O-LEVEL")}
            className={`px-3 py-1 rounded text-xs font-medium ${filter === "O-LEVEL" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"}`}
          >
            O-Level
          </button>
          <button
            onClick={() => setFilter("A-LEVEL")}
            className={`px-3 py-1 rounded text-xs font-medium ${filter === "A-LEVEL" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-800"}`}
          >
            A-Level
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Category</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center text-slate-400 py-8">
                    No subjects.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {r.code ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          r.level === "A-LEVEL"
                            ? "bg-purple-100 text-purple-800"
                            : r.level === "BOTH"
                              ? "bg-slate-200 text-slate-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {r.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {r.category ?? "—"}
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
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-3">Add subject</h3>
        {!isAdmin ? (
          <p className="text-sm text-slate-500">Only admins can add subjects.</p>
        ) : (
          <form onSubmit={add} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Subject name"
              className="w-full border rounded-lg px-3 py-2 border-slate-300"
              required
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Short code"
              className="w-full border rounded-lg px-3 py-2 border-slate-300"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as typeof level)}
              className="w-full border rounded-lg px-3 py-2 border-slate-300"
            >
              <option value="O-LEVEL">O-LEVEL</option>
              <option value="A-LEVEL">A-LEVEL</option>
              <option value="BOTH">BOTH</option>
            </select>
            {level === "A-LEVEL" && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full border rounded-lg px-3 py-2 border-slate-300"
              >
                <option value="">— Select category —</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="SUBSIDIARY">Subsidiary</option>
                <option value="GENERAL">General Paper</option>
              </select>
            )}
            {error && <div className="text-xs text-red-600">{error}</div>}
            <button
              disabled={saving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add subject"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
