import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentStudent } from "@/lib/student-auth";
import { getSchoolSettings } from "@/lib/settings";
import Link from "next/link";
import StudentLogoutButton from "./StudentLogoutButton";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentStudent();
  if (!me) redirect("/login");
  const school = await getSchoolSettings();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {school.schoolLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={school.schoolLogoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-slate-100 p-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl">
              🎓
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm md:text-base leading-tight truncate">
              {school.schoolName}
            </div>
            <div className="text-[10px] md:text-xs text-slate-500">
              Student Portal
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="text-xs font-semibold text-slate-700">{me.fullName}</div>
            <div className="text-[10px] text-slate-500 font-mono">
              {me.admissionNo}
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/portal/change-password"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 md:px-3 py-1.5 rounded font-medium"
            >
              🔑 <span className="hidden sm:inline">Password</span>
            </Link>
            <StudentLogoutButton />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-8 py-6 text-center text-[11px] text-slate-500 no-print">
        Powered by <span className="font-semibold">LCSS School Management System</span>{" "}
        · Developed by TUMWESIGE RONALD · 📞 0702003686
      </footer>
    </div>
  );
}
