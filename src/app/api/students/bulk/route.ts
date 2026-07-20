import { db } from "@/db";
import { students } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// POST body: { classId, rows: [{ admissionNo?, fullName, gender?, guardianName?, guardianPhone? }] }
// If admissionNo is empty we auto-generate one (YEAR/CLASSID/SEQ)
export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const classId = Number(body?.classId);
  const rows: Array<Record<string, string>> = Array.isArray(body?.rows) ? body.rows : [];
  if (!classId) return Response.json({ error: "classId required" }, { status: 400 });
  if (rows.length === 0)
    return Response.json({ error: "No rows to import" }, { status: 400 });

  // Get the current largest sequence for auto-gen admission numbers
  const countRes = await db.execute(
    sql`select coalesce(count(*),0)::int as c from students where class_id = ${classId}`,
  );
  let nextSeq = ((countRes.rows[0] as { c?: number })?.c ?? 0) + 1;
  const year = new Date().getFullYear();

  const inserted: string[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const raw of rows) {
    const fullName = (raw.fullName ?? "").toString().trim();
    if (!fullName) continue;
    let admissionNo = (raw.admissionNo ?? "").toString().trim();
    if (!admissionNo) {
      admissionNo = `${year}/${classId}/${String(nextSeq).padStart(3, "0")}`;
      nextSeq++;
    }
    try {
      await db.insert(students).values({
        classId,
        admissionNo,
        fullName,
        gender: raw.gender?.toString().trim() || null,
        guardianName: raw.guardianName?.toString().trim() || null,
        guardianPhone: raw.guardianPhone?.toString().trim() || null,
      });
      inserted.push(fullName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "failed";
      skipped.push({ name: fullName, reason: msg.includes("unique") ? "Duplicate admission no." : msg });
    }
  }

  return Response.json({ ok: true, inserted: inserted.length, skipped });
}
