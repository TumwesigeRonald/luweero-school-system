import StudentChangePasswordForm from "./StudentChangePasswordForm";
import Link from "next/link";

export default function StudentChangePasswordPage() {
  return (
    <div className="max-w-md mx-auto p-4 md:p-6">
      <div className="mb-4">
        <Link
          href="/portal"
          className="text-sm text-blue-700 hover:text-blue-900 font-semibold"
        >
          ← Back to Portal
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-xl font-bold mb-1">🔑 Change Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Update your password so no one else can see your results.
        </p>
        <StudentChangePasswordForm />
      </div>
    </div>
  );
}
