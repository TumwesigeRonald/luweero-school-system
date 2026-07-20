"use client";

import { useState } from "react";
import type { SchoolSettings } from "@/lib/settings";

export default function SettingsClient({ initial }: { initial: SchoolSettings }) {
  const [form, setForm] = useState<SchoolSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg("✅ Saved! Settings updated successfully.");
    } else {
      setMsg("❌ Failed to save settings.");
    }
    setSaving(false);
  }

  const fields: { key: keyof SchoolSettings; label: string; placeholder?: string }[] = [
    { key: "schoolName", label: "School Name" },
    { key: "schoolAddress", label: "P.O Box / Address" },
    { key: "schoolPhone", label: "Phone" },
    { key: "schoolEmail", label: "Email" },
    { key: "schoolMotto", label: "Motto" },
    { key: "activeTerm", label: "Active Term", placeholder: "e.g. Term 1, Term 2, Term 3" },
    { key: "academicYear", label: "Academic Year", placeholder: "e.g. 2026" },
    { key: "schoolLogoUrl", label: "Logo URL", placeholder: "https://i.imgur.com/xyz.png" },
    { key: "signupCode", label: "Signup Code", placeholder: "e.g. LCSS2026" },
  ];

  return (
    <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4 border border-slate-200">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full border rounded-lg px-3 py-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>
      ))}

      {form.schoolLogoUrl && (
        <div>
          <div className="text-xs text-slate-500 mb-1">Logo preview</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.schoolLogoUrl}
            alt="School logo"
            className="h-24 border border-slate-200 rounded p-1 bg-white object-contain"
          />
        </div>
      )}

      {msg && <div className="text-sm font-medium">{msg}</div>}

      <button
        type="submit"
        disabled={saving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}