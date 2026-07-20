"use client";

export type TeacherRow = {
  id: number;
  fullName: string;
  email: string | null;
  role: string | null;
  isActive: boolean | null;
};

export default function TeachersClient({ initial }: { initial: TeacherRow[] }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Directory</h1>
      <p className="text-slate-600">Teacher listing loaded ({initial.length} record(s)).</p>
    </div>
  );
}