"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

type NavItem = { href: string; label: string; icon: string };

export default function Sidebar({
  nav,
  adminNav,
  isAdmin,
  me,
  schoolName,
  schoolLogoUrl,
}: {
  nav: NavItem[];
  adminNav: NavItem[];
  isAdmin: boolean;
  me: { fullName: string; email: string; role: string };
  schoolName: string;
  schoolLogoUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // For a long school name, put the first 2 words on one line and the rest on
  // a second line so it fits neatly in the narrow sidebar.
  const words = schoolName.split(" ");
  const shortName = words.slice(0, 2).join(" ");
  const restName =
    words.length > 2 ? words.slice(2).join(" ") : "School Management System";

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white flex items-center gap-3 px-3 py-2 no-print">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded hover:bg-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {schoolLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={schoolLogoUrl}
              alt=""
              className="w-7 h-7 rounded object-cover bg-white flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-emerald-500 flex items-center justify-center text-sm flex-shrink-0">
              🎓
            </div>
          )}
          <div className="text-sm font-semibold truncate">{shortName}</div>
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden no-print"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col z-50 transform transition-transform duration-200 md:transform-none no-print ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {schoolLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={schoolLogoUrl}
                alt=""
                className="w-9 h-9 rounded-lg object-cover bg-white flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-lg flex-shrink-0">
                🎓
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight truncate">
                {shortName}
              </div>
              <div className="text-xs text-slate-400 truncate">{restName}</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                pathname === n.href
                  ? "bg-emerald-700 text-white"
                  : "hover:bg-slate-800"
              }`}
            >
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="px-3 pt-4 pb-1 text-[10px] uppercase text-slate-500 tracking-wider">
                Admin
              </div>
              {adminNav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    pathname === n.href
                      ? "bg-emerald-700 text-white"
                      : "hover:bg-slate-800"
                  }`}
                >
                  <span>{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              ))}
            </>
          )}
          <div className="px-3 pt-4 pb-1 text-[10px] uppercase text-slate-500 tracking-wider">
            Account
          </div>
          <Link
            href="/dashboard/change-password"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              pathname === "/dashboard/change-password"
                ? "bg-emerald-700 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            <span>🔑</span>
            <span>Change Password</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-sm font-medium truncate">{me.fullName}</div>
          <div className="text-xs text-slate-400 mb-3 truncate">
            {me.email} · <span className="uppercase">{me.role}</span>
          </div>
          <LogoutButton />
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed text-center">
            <div>
              Developed by{" "}
              <span className="font-semibold text-slate-300">TUMWESIGE RONALD</span>
            </div>
            <div className="text-slate-600 mt-0.5">📞 0702003686</div>
          </div>
        </div>
      </aside>
    </>
  );
}
