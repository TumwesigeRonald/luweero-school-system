import { db } from "@/db";
import { classes, marks, students, subjects, terms } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { and, asc, eq, sql, inArray } from "drizzle-orm";
import { componentsFor, computeALevelFinal, computeOLevelFinal, cbcGrade, uacePrincipalGrade, uaceSubsidiaryGrade } from "@/lib/grading";

export const dynamic = "force-dynamic";

// GET /api/marks/export?classId=..&termId=..  -> CSV file
export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const classId = Number(url.searchParams.get("classId"));
  const termId = Number(url.searchParams.get("termId"));
  if (!classId || !termId) return new Response("classId and termId required", { status: 400 });

  const [klass] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!klass) return new Response("Class not found", { status: 404 });
  const [term] = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);
  if (!term) return new Response("Term not found", { status: 404 });

  const components = componentsFor(klass.level);
  const studs = await db
    .select()
    .from(students)
    .where(eq(students.classId, classId))
    .orderBy(asc(students.fullName));
  const subs = await db
    .select()
    .from(subjects)
    .where(sql`${subjects.level} = ${klass.level} OR ${subjects.level} = 'BOTH'`)
    .orderBy(asc(subjects.name));

  const marksRows =
    studs.length > 0
      ? await db
          .select()
          .from(marks)
          .where(and(eq(marks.termId, termId), inArray(marks.studentId, studs.map((s) => s.id))))
      : [];

  // Build header
  const header: string[] = ["Admission No", "Student Name"];
  for (const s of subs) {
    for (const c of components) header.push(`${s.code ?? s.name}-${c}`);
    header.push(`${s.code ?? s.name}-Final`);
    header.push(`${s.code ?? s.name}-Grade`);
  }
  header.push("Total", "Average");

  const rows: string[][] = [];
  for (const st of studs) {
    const row: string[] = [st.admissionNo, st.fullName];
    let total = 0;
    let count = 0;
    for (const s of subs) {
      const compScores: (number | null)[] = [];
      for (const c of components) {
        const m = marksRows.find(
          (mm) => mm.studentId === st.id && mm.subjectId === s.id && mm.component === c,
        );
        const val = m ? Number(m.score) : null;
        compScores.push(val);
        row.push(val != null ? String(val) : "");
      }
      const final =
        klass.level === "A-LEVEL"
          ? computeALevelFinal(compScores[0], compScores[1])
          : computeOLevelFinal(compScores[0], compScores[1], compScores[2]);
      if (final != null) {
        total += final;
        count++;
        const g =
          klass.level === "A-LEVEL"
            ? s.category === "SUBSIDIARY" || s.category === "GENERAL"
              ? uaceSubsidiaryGrade(final)
              : uacePrincipalGrade(final)
            : cbcGrade(final);
        row.push(final.toFixed(1), g.grade);
      } else {
        row.push("", "");
      }
    }
    row.push(total.toFixed(1), count > 0 ? (total / count).toFixed(1) : "");
    rows.push(row);
  }

  const esc = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const csv =
    [header, ...rows].map((r) => r.map((cell) => esc(cell)).join(",")).join("\n") + "\n";

  const filename = `marks_${klass.name}_${term.name}_${term.academicYear}.csv`.replace(
    /\s+/g,
    "_",
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
