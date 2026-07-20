"use client";

import { useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import { classes } from "@/db/schema";

type Class = InferSelectModel<typeof classes>;

interface ClassesClientProps {
  initialClasses?: Class[];
  isAdmin?: boolean;
}

export default function ClassesClient({
  initialClasses = [],
  isAdmin = false,
}: ClassesClientProps) {
  const [classList, setClassList] = useState<Class[]>(initialClasses);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Class Management</h1>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stream</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classList.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap">{c.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.level || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.stream || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}