"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    signupCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(data.error ?? "Signup failed");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Full Name
        </label>
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="e.g. Nabulya Dorothy"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="you@lcss.ug"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Password (min 6 chars)
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Choose a strong password"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          School Signup Code
        </label>
        <input
          type="text"
          required
          value={form.signupCode}
          onChange={(e) => setForm({ ...form, signupCode: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Ask the admin for this code"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          The administrator will share this code with staff to allow self-registration.
        </p>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account →"}
      </button>
    </form>
  );
}
