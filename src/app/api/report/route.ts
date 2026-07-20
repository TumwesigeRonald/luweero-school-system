import { db } from "@/db";
import {
  classes,
  marks,
  students,
  subjects,
  terms,
  studentTerms,
  subjectTeachers,
  teachers,
} from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { and, eq, sql, inArray } from "drizzle-orm";
import {
  computeAS,
  computeFA,
  computeOLevelFinal,
  computeALevelFinal,
  cbcGrade,
  classIdentifier,
  uacePrincipalGrade,
  uaceSubsidiaryGrade,
  uceDivision,
  overallRemark,
  componentsFor,
} from "@/lib/grading";
import { getSchoolSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const studentId = Number(url.searchParams.get("studentId"));
  const termId = Number(url.searchParams.get("termId"));
  if (!studentId || !termId) {
    return Response.json({ error: "studentId and termId required" }, { status: 400 });
  }
  const data = await buildReport(studentId, termId);
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
}

// Helper: build teacher initials (e.g. "OKOED CHARLES" -> "OC", "NABULYA D." -> "ND")
function initialsOf(name: string): string {
  const parts = name
    .replace(/\./g, "")
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function buildReport(studentId: number, termId: number) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);
  if (!student) return null;
  const [klass] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, student.classId))
    .limit(1);
  const [term] = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);
  if (!klass || !term) return null;

  const level = klass.level as "O-LEVEL" | "A-LEVEL";
  const components = componentsFor(level);
  const settings = await getSchoolSettings();

  const subjectRows = await db
    .select()
    .from(subjects)
    .where(sql`${subjects.level} = ${level} OR ${subjects.level} = 'BOTH'`);

  // Look up which teacher teaches each subject in this class (for initials)
  const stRows = await db
    .select({
      subjectId: subjectTeachers.subjectId,
      teacherName: teachers.fullName,
    })
    .from(subjectTeachers)
    .innerJoin(teachers, eq(teachers.id, subjectTeachers.teacherId))
    .where(eq(subjectTeachers.classId, klass.id));
  const initialsBySubject: Record<number, string> = {};
  for (const r of stRows) {
    if (!initialsBySubject[r.subjectId]) {
      initialsBySubject[r.subjectId] = initialsOf(r.teacherName);
    }
  }

  const classStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.classId, student.classId));
  const classIds = classStudents.map((s) => s.id);

  const marksRows = await db
    .select()
    .from(marks)
    .where(and(eq(marks.studentId, studentId), eq(marks.termId, termId)));

  const allClassMarks =
    classIds.length > 0
      ? await db
          .select()
          .from(marks)
          .where(and(eq(marks.termId, termId), inArray(marks.studentId, classIds)))
      : [];

  function computeFinal(rows: typeof allClassMarks, subjId: number) {
    if (level === "A-LEVEL") {
      const p1 = rows.find((m) => m.subjectId === subjId && m.component === "P1");
      const p2 = rows.find((m) => m.subjectId === subjId && m.component === "P2");
      return computeALevelFinal(
        p1 ? Number(p1.score) : null,
        p2 ? Number(p2.score) : null,
      );
    }
    const aoi1 = rows.find((m) => m.subjectId === subjId && m.component === "AOI1");
    const aoi2 = rows.find((m) => m.subjectId === subjId && m.component === "AOI2");
    const eot = rows.find((m) => m.subjectId === subjId && m.component === "EOT");
    return computeOLevelFinal(
      aoi1 ? Number(aoi1.score) : null,
      aoi2 ? Number(aoi2.score) : null,
      eot ? Number(eot.score) : null,
    );
  }

  const marksByStudent: Record<number, typeof allClassMarks> = {};
  for (const m of allClassMarks) {
    (marksByStudent[m.studentId] ??= []).push(m);
  }

  const subjectResults = subjectRows.map((s) => {
    const componentScores: Record<string, number | null> = {};
    for (const c of components) {
      const m = marksRows.find((mm) => mm.subjectId === s.id && mm.component === c);
      componentScores[c] = m ? Number(m.score) : null;
    }

    let assessmentScore: number | null = null;
    let formativeAssessment: number | null = null;
    let finalScore: number | null = null;
    let grade = "-";
    let descriptor = "-";
    let points = 0;

    if (level === "O-LEVEL") {
      assessmentScore = computeAS(componentScores["AOI1"], componentScores["AOI2"]);
      formativeAssessment = computeFA(assessmentScore);
      finalScore = computeFinal(marksRows, s.id);
      if (finalScore != null) {
        const g = cbcGrade(finalScore);
        grade = g.grade;
        descriptor = g.descriptor;
      }
    } else {
      finalScore = computeFinal(marksRows, s.id);
      if (finalScore != null) {
        const g =
          s.category === "SUBSIDIARY" || s.category === "GENERAL"
            ? uaceSubsidiaryGrade(finalScore)
            : uacePrincipalGrade(finalScore);
        grade = g.grade;
        descriptor = g.remark;
        points = g.points;
      }
    }

    // Position in class for this subject
    let subjectPosition: number | null = null;
    let subjectClassCount = 0;
    if (finalScore != null) {
      const scores = classIds
        .map((sid) => ({ sid, score: computeFinal(marksByStudent[sid] ?? [], s.id) }))
        .filter((r) => r.score != null) as { sid: number; score: number }[];
      scores.sort((a, b) => b.score - a.score);
      const idx = scores.findIndex((r) => r.sid === studentId);
      if (idx >= 0) {
        subjectPosition = idx + 1;
        subjectClassCount = scores.length;
      }
    }

    return {
      subjectId: s.id,
      subjectName: s.name,
      subjectCode: s.code,
      subjectCategory: s.category,
      componentScores,
      assessmentScore,
      formativeAssessment,
      finalScore,
      grade,
      descriptor,
      points,
      teacherInitials: initialsBySubject[s.id] ?? "",
      subjectPosition,
      subjectClassCount,
    };
  });

  const taken = subjectResults.filter((r) => r.finalScore != null);
  const totalScore = taken.reduce((a, r) => a + (r.finalScore ?? 0), 0);
  const average = taken.length ? totalScore / taken.length : 0;

  // For CBC: identifier = average of assessment scores (A.S) across taken subjects
  let identifier = "-";
  let identifierValue = 0;
  if (level === "O-LEVEL" && taken.length > 0) {
    const takenWithAS = taken.filter((r) => r.assessmentScore != null);
    if (takenWithAS.length > 0) {
      identifierValue =
        takenWithAS.reduce((a, r) => a + (r.assessmentScore ?? 0), 0) /
        takenWithAS.length;
      identifier = classIdentifier(identifierValue);
    }
  }

  // Aggregate points (A-Level only in new CBC)
  let aggregatePoints = 0;
  let division = "-";
  if (level === "A-LEVEL") {
    aggregatePoints = taken.reduce((a, r) => a + r.points, 0);
    division = "—";
  } else {
    // Also keep legacy UCE aggregate for reference
    // (some schools still show it)
  }

  // Overall position in class
  let position: number | null = null;
  let classSize = classIds.length;
  if (classIds.length > 0) {
    const perStudent = await db
      .select({
        studentId: marks.studentId,
        total: sql<number>`sum(${marks.score})::float`,
      })
      .from(marks)
      .where(and(eq(marks.termId, termId), inArray(marks.studentId, classIds)))
      .groupBy(marks.studentId);
    const sorted = [...perStudent].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    const idx = sorted.findIndex((r) => r.studentId === studentId);
    if (idx >= 0) {
      position = idx + 1;
      classSize = sorted.length;
    }
  }

  const [st] = await db
    .select()
    .from(studentTerms)
    .where(and(eq(studentTerms.studentId, studentId), eq(studentTerms.termId, termId)))
    .limit(1);

  // Reference unused imports helpers
  void uceDivision;

  return {
    school: settings,
    student,
    class: klass,
    term,
    level,
    components,
    subjects: subjectResults,
    studentTerm: st ?? null,
    totals: {
      total: Number(totalScore.toFixed(2)),
      average: Number(average.toFixed(2)),
      subjectsCount: taken.length,
      aggregatePoints,
      division,
      identifier,
      identifierValue: Number(identifierValue.toFixed(4)),
      position,
      classSize,
      overallRemark: overallRemark(average),
    },
  };
}
