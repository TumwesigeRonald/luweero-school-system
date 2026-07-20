import ChangePasswordForm from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Change Password</h1>
        <p className="text-slate-500 mt-1">Update your login password.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
