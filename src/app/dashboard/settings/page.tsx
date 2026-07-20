import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await getCurrentTeacher();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");
  const s = await getSchoolSettings();
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">School Settings</h1>
        <p className="text-slate-500 mt-1">
          These details appear on the login page, sidebar, and report cards.
        </p>
      </div>
      <SettingsClient initial={s} />
    </div>
  );
}
