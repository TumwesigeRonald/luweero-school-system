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
      setMsg("✅ Saved! Refresh the page to see changes across the app.");
    } else {
      setMsg("❌ Failed to save");
    }
    setSaving(false);
  }

  const fields: [keyof SchoolSettings, string, string?][] = [
    ["schoolName", "School Name"],
    ["schoolAddress", "P.O Box / Address"],
    ["schoolPhone", "Phone"],
    ["schoolEmail", "Email"],
    ["schoolMotto", "Motto"],
    [
      "activeTerm",
      "Active Term (e.g. Term 1, Term 2, Term 3)",
      "Term 1",
    ],
    [
      "academicYear",
      "Academic Year",
      "2026",
    ],
    [
      "schoolLogoUrl",
      "Logo URL (paste an image link, e.g. from Imgur)",
      "https://i.imgur.com/xyz.png",
    ],
    [
      "signupCode",
      "Signup Code (share with teachers so they can self-register — leave blank to disable)",
      "e.g. LCSS2026",
    ],
  ];

  return (
    <form onSubmit={save} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">
      {fields.map(([key, label, placeholder]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className="w-full border rounded-lg px-3 py-2 border-slate-300"
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
            className="h-24 border border-slate-200 rounded p-1 bg-white"
          />
        </div>
      )}
      {msg && <div className="text-sm">{msg}</div>}
      <button
        disabled={saving}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-medium disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
      <p className="text-xs text-slate-500 pt-3 border-t">
        💡 To use your own school logo: upload the image to{" "}
        <a
          href="https://imgur.com"
          target="_blank"
          rel="noreferrer"
          className="text-emerald-700 underline"
        >
          imgur.com
        </a>
        , right-click the uploaded image → &ldquo;Copy image address&rdquo;, then paste
        the link above.
      </p>
    </form>
  );
}