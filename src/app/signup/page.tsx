import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/settings";
import SignupForm from "./SignupForm";
import Link from "next/link";

export default async function SignupPage() {
  const me = await getCurrentTeacher();
  if (me) redirect("/dashboard");
  const school = await getSchoolSettings();
  const enabled = Boolean((school.signupCode ?? "").trim());

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-amber-400/10 blur-3xl" />
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            {school.schoolLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={school.schoolLogoUrl}
                alt=""
                className="w-14 h-14 rounded-xl mx-auto mb-3 object-contain bg-slate-100 p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-3">
                🎓
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900 uppercase leading-tight">
              {school.schoolName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Teacher Registration</p>
          </div>

          {!enabled ? (
            <div className="text-center space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
                🔒 Self-registration is currently <strong>disabled</strong>.
                <br />
                Please ask the school administrator to create your account, or to enable
                self-signup by setting a signup code in the School Settings.
              </div>
              <Link
                href="/login"
                className="inline-block text-emerald-700 hover:text-emerald-900 font-semibold text-sm"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <SignupForm />
              <div className="mt-5 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} {school.schoolName}
          </div>
        </div>
      </div>
    </div>
  );
}
