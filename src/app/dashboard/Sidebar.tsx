"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  me: {
    fullName: string;
    email: string | null;
    role: string | null;
  };
}

export default function Sidebar({ me }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/classes", label: "Classes" },
    { href: "/dashboard/subjects", label: "Subjects" },
    { href: "/dashboard/teachers", label: "Teachers" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/dashboard/students", label: "Students" },
    { href: "/dashboard/marks", label: "Marks" },
    { href: "/dashboard/reports", label: "Reports" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="text-xl font-bold mb-6 px-2">School System</div>
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 pt-4 px-2">
        <p className="text-sm font-medium text-white">{me.fullName}</p>
        <p className="text-xs text-slate-400">{me.email || "No email"}</p>
        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-semibold rounded bg-blue-900 text-blue-200 uppercase">
          {me.role || "User"}
        </span>
      </div>
    </aside>
  );
}