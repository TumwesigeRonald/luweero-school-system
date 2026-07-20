"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore — we still want to redirect
    }
    // Use full page navigation so the browser refreshes the URL & clears state
    window.location.href = "/login";
  }
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full text-xs bg-slate-800 hover:bg-slate-700 rounded-md py-2 disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
