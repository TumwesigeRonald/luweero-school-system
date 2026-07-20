"use client";

import { useState } from "react";

export default function StudentLogoutButton() {
  const [loading, setLoading] = useState(false);
  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/student-auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.href = "/login";
  }
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-2 md:px-3 py-1.5 rounded font-medium disabled:opacity-50"
    >
      {loading ? "..." : "Sign out"}
    </button>
  );
}
