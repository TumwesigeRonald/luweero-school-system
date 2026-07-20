"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
      } else {
        // Redirect to teacher dashboard OR student portal based on account type
        router.push(data.redirectTo ?? "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setInfo(null);
    setError(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.seeded) {
        setInfo("Demo accounts created. Use the credentials below to sign in.");
        setEmail("admin@school.com");
        setPassword("admin123");
      } else {
        setInfo("Accounts already exist. Use the credentials below.");
      }
    } catch {
      setError("Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Email or Admission Number
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            placeholder="Teacher email OR student admission no."
            autoComplete="username"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Teachers: use your <strong>email</strong> · Students: use your{" "}
            <strong>admission number</strong>
          </p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
          Password
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2.5 text-base md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1 rounded"
            tabIndex={-1}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">
          <span className="text-red-500">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="flex items-start gap-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2">
          <span>✅</span>
          <span>{info}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-md shadow-emerald-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In →"}
      </button>
      <button
        type="button"
        onClick={handleSeed}
        disabled={seeding}
        className="w-full text-sm text-emerald-700 hover:text-emerald-900 font-semibold disabled:opacity-50 py-1"
      >
        {seeding ? "Creating..." : "Create demo accounts"}
      </button>
    </form>
  );
}
