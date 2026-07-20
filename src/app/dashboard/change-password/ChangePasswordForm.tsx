"use client";

import { useState } from "react";

export default function ChangePasswordForm() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) {
      setMsg("New password and confirmation do not match");
      setOk(false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setOk(true);
      setMsg("✅ Password updated successfully");
      setOld("");
      setNew("");
      setConfirm("");
    } else {
      setOk(false);
      setMsg(data.error ?? "Failed");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Current password
        </label>
        <input
          type="password"
          required
          value={oldPassword}
          onChange={(e) => setOld(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 border-slate-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          New password (min. 6 chars)
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 border-slate-300"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Confirm new password
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 border-slate-300"
        />
      </div>
      {msg && (
        <div className={`text-sm ${ok ? "text-emerald-700" : "text-red-600"}`}>{msg}</div>
      )}
      <button
        disabled={saving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-medium disabled:opacity-50"
      >
        {saving ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
