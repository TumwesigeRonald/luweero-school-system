"use client";

import { useMemo, useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import { classes, subjects, subjectTeachers } from "@/db/schema";

type Class = InferSelectModel<typeof classes>;
type Subject = InferSelectModel<typeof subjects>;
type SubjectTeacher = InferSelectModel<typeof subjectTeachers>;

type TeacherRow = { id: number; fullName: string; email: string | null };

interface AssignmentsClientProps {
  initialClasses: Class[];
  initialSubjects: Subject[];
  initialTeachers: TeacherRow[];
  initialAssignments: SubjectTeacher[];
}

export default function AssignmentsClient({
  initialClasses,
  initialSubjects,
  initialTeachers,
  initialAssignments,
}: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<SubjectTeacher[]>(initialAssignments);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (selectedClass && String(item.classId) !== selectedClass) return false;
      if (selectedSubject && String(item.subjectId) !== selectedSubject) return false;
      if (selectedTeacher && String(item.teacherId) !== selectedTeacher) return false;
      return true;
    });
  }, [assignments, selectedClass, selectedSubject, selectedTeacher]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject || !selectedTeacher) {
      setMessage({ type: "error", text: "Please select Class, Subject, and Teacher." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: Number(selectedClass),
          subjectId: Number(selectedSubject),
          teacherId: Number(selectedTeacher),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign teacher");
      }

      const newAssignment = await res.json();
      setAssignments((prev) => [...prev, newAssignment]);
      setMessage({ type: "success", text: "Teacher assigned successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Subject & Teacher Assignments</h1>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Class</option>
            {initialClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Subject</option>
            {initialSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teacher</label>
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Select Teacher</option>
            {initialTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Assigning..." : "Assign Teacher"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teacher</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssignments.map((a) => {
              const cls = initialClasses.find((c) => c.id === a.classId);
              const sub = initialSubjects.find((s) => s.id === a.subjectId);
              const tch = initialTeachers.find((t) => t.id === a.teacherId);
              return (
                <tr key={a.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{cls?.name || a.classId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sub?.name || a.subjectId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tch?.fullName || a.teacherId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}