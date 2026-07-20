import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = {
    fullName: "Admin User",
    email: "admin@school.com" as string | null,
    role: "admin" as string | null,
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar me={me} />
      <main className="flex-1 bg-slate-50">{children}</main>
    </div>
  );
}