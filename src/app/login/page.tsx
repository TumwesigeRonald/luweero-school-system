import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth";
import LoginForm from "./LoginForm";
import { getSchoolSettings } from "@/lib/settings";

export default async function LoginPage() {
  const me = await getCurrentTeacher();
  if (me) redirect("/dashboard");
  const school = await getSchoolSettings();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Decorative background */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-white">
          {/* LEFT — hero panel */}
          <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 text-white p-8 md:p-10 flex flex-col justify-between overflow-hidden">
            {/* Decorative pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                {school.schoolLogoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={school.schoolLogoUrl}
                    alt="School logo"
                    className="w-14 h-14 rounded-xl bg-white object-contain p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl border border-white/20">
                    🎓
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-widest text-emerald-100/80">
                    Welcome to
                  </div>
                  <div className="text-lg font-semibold">LCSS Portal</div>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold leading-tight uppercase tracking-wide">
                {school.schoolName}
              </h1>
              <div className="mt-4 space-y-1 text-emerald-50/90 text-sm">
                <p className="flex items-start gap-2">
                  <span className="text-emerald-300">📍</span>
                  <span>{school.schoolAddress}</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-300">📞</span>
                  <span>{school.schoolPhone}</span>
                </p>
              </div>
              <p className="mt-5 inline-block bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1 text-xs italic font-semibold">
                &ldquo;{school.schoolMotto}&rdquo;
              </p>
            </div>

            {/* Feature bullets */}
            <div className="relative mt-8 space-y-2 text-sm text-emerald-50/90">
              <Feature icon="👨‍🏫" text="Teachers: enter marks and manage classes" />
              <Feature icon="🧑‍🎓" text="Students: view results, grades & fees balance" />
              <Feature icon="📄" text="Generate CBC / UACE report cards instantly" />
              <Feature icon="📱" text="Works on any phone or computer" />
            </div>

            <div className="relative mt-8 pt-4 border-t border-white/15 text-[11px] text-emerald-100/70">
              <div>
                Developed by{" "}
                <span className="font-semibold text-white">TUMWESIGE RONALD</span>
              </div>
              <div className="mt-0.5">
                📞 0702003686 · ✉ tumwesigeronald4@gmail.com
              </div>
            </div>
          </div>

          {/* RIGHT — login form */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  School Management System
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Teachers, students & admins — all use this one login
                </p>
              </div>

              <LoginForm />

              <div className="mt-4 text-center text-xs text-slate-500">
                Teacher without an account?{" "}
                <a
                  href="/signup"
                  className="text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  Register
                </a>
              </div>

              <details className="mt-6 pt-5 border-t border-slate-200">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 select-none">
                  🔑 First time? Show demo credentials
                </summary>
                <div className="mt-3 text-xs text-slate-500 space-y-2">
                  <p>
                    Click <span className="font-semibold">&ldquo;Create demo accounts&rdquo;</span>{" "}
                    below the sign-in button, then log in with:
                  </p>
                  <div className="font-mono bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] space-y-1">
                    <div>
                      <span className="text-slate-400">Admin:</span>{" "}
                      admin@school.com / admin123
                    </div>
                    <div>
                      <span className="text-slate-400">Teacher:</span>{" "}
                      subject.teacher@lcss.ug / teacher123
                    </div>
                    <div>
                      <span className="text-slate-400">Student:</span> 001 / 001
                      <span className="text-slate-400">
                        {" "}(admission no. as username)
                      </span>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-6 text-center text-[11px] text-slate-400">
                © {new Date().getFullYear()} {school.schoolName}. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[13px]">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
