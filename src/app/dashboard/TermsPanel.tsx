"use client";

import type { InferSelectModel } from "drizzle-orm";
import { terms } from "@/db/schema";

type Term = InferSelectModel<typeof terms>;

export default function TermsPanel({ initialTerms = [] }: { initialTerms?: Term[] }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-2">Terms Overview</h3>
      <p className="text-sm text-slate-600">Active terms panel.</p>
    </div>
  );
}