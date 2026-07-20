import { db } from "@/db";
import { terms } from "@/db/schema";
import { getCurrentStudent } from "@/lib/student-auth";
import { desc } from "drizzle-orm";
import { buildReport } from "@/app/api/report/route";

export const dynamic = "force-dynamic";

// GET /api/student-portal?termId=..  -> the student's own report for that term
// If termId omitted, uses the active term.
export async function GET(req: Request) {
  const me = await getCurrentStudent();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  let termId = Number(url.searchParams.get("termId"));

  const allTerms = await db
    .select()
    .from(terms)
    .orderBy(desc(terms.academicYear), desc(terms.id));

  if (!termId) {
    const active = allTerms.find((t) => t.isActive);
    termId = active?.id ?? allTerms[0]?.id;
  }
  if (!termId) return Response.json({ error: "No term available" }, { status: 400 });

  const report = await buildReport(me.id, termId);
  if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
  return Response.json({ report, terms: allTerms });
}
