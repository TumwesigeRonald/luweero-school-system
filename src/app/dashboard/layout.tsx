import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentTeacher } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/settings";
import Sidebar from "./Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentTeacher();
  if (!me) redirect("/login");
  const settings = await getSchoolSettings();

  const nav = [
    { href: "/dashboard", label: "Overview", icon: "🏠" },
    { href: "/dashboard/classes", label: "Classes", icon: "🏫" },
    { href: "/dashboard/students", label: "Students", icon: "🎒" },
    { href: "/dashboard/subjects", label: "Subjects", icon: "📚" },
    { href: "/dashboard/marks", label: "Enter Marks", icon: "✏️" },
    { href: "/dashboard/reports", label: "Report Cards", icon: "📄" },
  ];
  const adminNav = [
    { href: "/dashboard/teachers", label: "Teachers", icon: "👨‍🏫" },
    { href: "/dashboard/assignments", label: "Assign Subjects", icon: "🔗" },
    { href: "/dashboard/settings", label: "School Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        nav={nav}
        adminNav={adminNav}
        isAdmin={me.role === "admin"}
        me={{ fullName: me.fullName, email: me.email, role: me.role }}
        schoolName={settings.schoolName}
        schoolLogoUrl={settings.schoolLogoUrl}
      />
      <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
    </div>
  );
}
