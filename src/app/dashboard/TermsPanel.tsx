"use client";

import { useState } from "react";
import type { Term } from "@/db/schema";

export default function TermsPanel({ initial }: { initial: Term[] }) {
  const [rows, setRows] = useState<Term[]>(initial);

  async function setActive(id: number) {
    await fetch("/api/terms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, setActive: true }),
    });
    setRows(rows.map((r) => ({ ...r, isActive: r.id === id })));
  }

  async function saveDates(
    id: number,
    nextTermBeginsAt: string,
    nextTermEndsAt: string,
  ) {
    await fetch("/api/terms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nextTermBeginsAt, nextTermEndsAt }),
    });
    setRows(
      rows.map((r) =>
        r.id === id ? { ...r, nextTermBeginsAt, nextTermEndsAt } : r,
      ),
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
      <h3 className="font-semibold text-lg mb-1">📅 Manage Terms</h3>
      <p className="text-sm text-slate-500 mb-4">
        Set the active term and next-term dates (shown on report cards).
      </p>
      <div className="space-y-2">
        {rows.map((t) => (
          <TermRow
            key={t.id}
            term={t}
            onSetActive={() => setActive(t.id)}
            onSaveDates={(begin, end) => saveDates(t.id, begin, end)}
          />
        ))}
      </div>
    </div>
  );
}

function TermRow({
  term,
  onSetActive,
  onSaveDates,
}: {
  term: Term;
  onSetActive: () => void;
  onSaveDates: (begin: string, end: string) => void;
}) {
  const [begin, setBegin] = useState<string>(term.nextTermBeginsAt ?? "");
  const [end, setEnd] = useState<string>(term.nextTermEndsAt ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <div className="border border-slate-200 rounded-lg p-3 flex flex-wrap gap-3 items-center">
      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold">
          {term.name} {term.academicYear}
          {term.isActive && (
            <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
              Active
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 uppercase">
          Next term begins
        </label>
        <input
          type="date"
          value={begin}
          onChange={(e) => setBegin(e.target.value)}
          className="border rounded px-2 py-1 border-slate-300 text-sm"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 uppercase">
          Next term ends
        </label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border rounded px-2 py-1 border-slate-300 text-sm"
        />
      </div>
      <button
        onClick={() => {
          onSaveDates(begin, end);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-medium"
      >
        {saved ? "✅ Saved" : "Save dates"}
      </button>
      {!term.isActive && (
        <button
          onClick={onSetActive}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium"
        >
          Set as active
        </button>
      )}
    </div>
  );
}
