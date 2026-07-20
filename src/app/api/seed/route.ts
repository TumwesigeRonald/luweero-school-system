import { db } from "@/db";
import { teachers, subjects, classes, terms, subjectTeachers } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Subject teachers from Luweero Community Sec. School template
const TEACHER_SEEDS: Array<{ fullName: string; email: string; role?: "teacher" | "admin" }> = [
  { fullName: "Subject Teacher (Demo)", email: "subject.teacher@lcss.ug" },
  { fullName: "OKOED CHARLES", email: "okoed.charles@lcss.ug" },
  { fullName: "KIKOMEKO AKIM", email: "kikomeko.akim@lcss.ug" },
  { fullName: "MUWANIKA SHARIF", email: "muwanika.sharif@lcss.ug" },
  { fullName: "ASUBU EMMA", email: "asubu.emma@lcss.ug" },
  { fullName: "OMAO MORRIS", email: "omao.morris@lcss.ug" },
  { fullName: "NABULYA DOROTHY", email: "nabulya.dorothy@lcss.ug" },
  { fullName: "KIBONGE KEITH", email: "kibonge.keith@lcss.ug" },
  { fullName: "KIRUNGI PETER", email: "kirungi.peter@lcss.ug" },
  { fullName: "CHEROTICH ELIJAH", email: "cherotich.elijah@lcss.ug" },
  { fullName: "CHESURO PETRA", email: "chesuro.petra@lcss.ug" },
  { fullName: "TUMWESIGE RONALD", email: "tumwesigeronald4@gmail.com", role: "admin" },
  { fullName: "LUBAALE ERISHA", email: "lubaale.erisha@lcss.ug" },
  { fullName: "NALUGUZA GRACE", email: "naluguza.grace@lcss.ug" },
  { fullName: "MUSAAZI ROBERT", email: "musaazi.robert@lcss.ug" },
];

// Subjects with the assigned teacher from the template
const SUBJECT_ASSIGNMENTS: Array<{
  subject: { name: string; code: string; level: "O-LEVEL" | "A-LEVEL" | "BOTH"; category?: string };
  teacher: string; // teacher fullName
}> = [
  { subject: { name: "English", code: "ENG", level: "O-LEVEL" }, teacher: "OKOED CHARLES" },
  { subject: { name: "Mathematics", code: "MTC", level: "O-LEVEL" }, teacher: "KIKOMEKO AKIM" },
  { subject: { name: "Physics", code: "PHY", level: "O-LEVEL" }, teacher: "MUWANIKA SHARIF" },
  { subject: { name: "Chemistry", code: "CHM", level: "O-LEVEL" }, teacher: "ASUBU EMMA" },
  { subject: { name: "Biology", code: "BIO", level: "O-LEVEL" }, teacher: "OMAO MORRIS" },
  { subject: { name: "Geography", code: "GEO", level: "O-LEVEL" }, teacher: "NABULYA DOROTHY" },
  { subject: { name: "Kiswahili", code: "KIS", level: "O-LEVEL" }, teacher: "KIBONGE KEITH" },
  { subject: { name: "History", code: "HIS", level: "O-LEVEL" }, teacher: "KIRUNGI PETER" },
  { subject: { name: "Agriculture", code: "AGR", level: "O-LEVEL" }, teacher: "CHEROTICH ELIJAH" },
  { subject: { name: "CRE", code: "CRE", level: "O-LEVEL" }, teacher: "CHESURO PETRA" },
  { subject: { name: "ICT", code: "ICT", level: "O-LEVEL" }, teacher: "TUMWESIGE RONALD" },
  { subject: { name: "Entrepreneurship", code: "ENT", level: "O-LEVEL" }, teacher: "LUBAALE ERISHA" },
  { subject: { name: "PE", code: "PE", level: "O-LEVEL" }, teacher: "OMAO MORRIS" },
  { subject: { name: "Luganda", code: "LUG", level: "O-LEVEL" }, teacher: "NALUGUZA GRACE" },
  { subject: { name: "Art", code: "ART", level: "O-LEVEL" }, teacher: "MUSAAZI ROBERT" },
];

// A-Level subjects (for S5, S6)
const A_LEVEL_SUBJECTS: Array<{ name: string; code: string; category: "PRINCIPAL" | "SUBSIDIARY" | "GENERAL" }> = [
  { name: "Mathematics", code: "MTC-A", category: "PRINCIPAL" },
  { name: "Physics", code: "PHY-A", category: "PRINCIPAL" },
  { name: "Chemistry", code: "CHM-A", category: "PRINCIPAL" },
  { name: "Biology", code: "BIO-A", category: "PRINCIPAL" },
  { name: "Economics", code: "ECO", category: "PRINCIPAL" },
  { name: "Entrepreneurship", code: "ENT-A", category: "PRINCIPAL" },
  { name: "Geography", code: "GEO-A", category: "PRINCIPAL" },
  { name: "History", code: "HIS-A", category: "PRINCIPAL" },
  { name: "Literature", code: "LIT-A", category: "PRINCIPAL" },
  { name: "Divinity", code: "DIV", category: "PRINCIPAL" },
  { name: "Fine Art", code: "FA", category: "PRINCIPAL" },
  { name: "Agriculture", code: "AGR-A", category: "PRINCIPAL" },
  { name: "Sub ICT", code: "SUB-ICT", category: "SUBSIDIARY" },
  { name: "Sub Math", code: "SUB-MTC", category: "SUBSIDIARY" },
  { name: "General Paper", code: "GP", category: "GENERAL" },
];

export async function POST() {
  const existing = await db.execute(sql`select count(*)::int as c from teachers`);
  const count = (existing.rows[0] as { c: number } | undefined)?.c ?? 0;
  if (count > 0) {
    return Response.json({ ok: true, seeded: false, message: "Already seeded. Delete existing data first if you want to re-seed." });
  }

  const adminPw = await hashPassword("admin123");
  const teacherPw = await hashPassword("teacher123");

  // Create admin
  const [admin] = await db
    .insert(teachers)
    .values({
      fullName: "System Administrator",
      email: "admin@school.com",
      passwordHash: adminPw,
      role: "admin",
    })
    .returning();

  // Create teachers from the template
  const teacherRows = await db
    .insert(teachers)
    .values(
      TEACHER_SEEDS.map((t) => ({
        fullName: t.fullName,
        email: t.email,
        passwordHash: teacherPw,
        role: t.role ?? ("teacher" as const),
      })),
    )
    .returning();
  const teacherByName = new Map<string, number>();
  for (const t of teacherRows) teacherByName.set(t.fullName, t.id);

  // Create O-Level subjects
  const oLevelSubs = await db
    .insert(subjects)
    .values(
      SUBJECT_ASSIGNMENTS.map((sa) => ({
        name: sa.subject.name,
        code: sa.subject.code,
        level: sa.subject.level,
        category: sa.subject.category ?? null,
      })),
    )
    .returning();

  // Create A-Level subjects
  await db.insert(subjects).values(
    A_LEVEL_SUBJECTS.map((s) => ({
      name: s.name,
      code: s.code,
      level: "A-LEVEL" as const,
      category: s.category,
    })),
  );

  // Create classes; assign CHESURO PETRA as S1 class teacher
  const chesuroId = teacherByName.get("CHESURO PETRA") ?? admin.id;
  const [s1, s2, s3, s4, s5, s6] = await db
    .insert(classes)
    .values([
      { name: "S1", level: "O-LEVEL", classTeacherId: chesuroId },
      { name: "S2", level: "O-LEVEL", classTeacherId: admin.id },
      { name: "S3", level: "O-LEVEL", classTeacherId: admin.id },
      { name: "S4", level: "O-LEVEL", classTeacherId: admin.id },
      { name: "S5", level: "A-LEVEL", classTeacherId: admin.id },
      { name: "S6", level: "A-LEVEL", classTeacherId: admin.id },
    ])
    .returning();

  // Assign subject teachers for S1 based on the template
  const assignments: Array<{ subjectId: number; teacherId: number; classId: number }> = [];
  for (const sa of SUBJECT_ASSIGNMENTS) {
    const subj = oLevelSubs.find((s) => s.name === sa.subject.name && s.code === sa.subject.code);
    const teacherId = teacherByName.get(sa.teacher);
    if (subj && teacherId) {
      // Assign this teacher to this subject across all O-Level classes
      for (const klass of [s1, s2, s3, s4]) {
        assignments.push({ subjectId: subj.id, teacherId, classId: klass.id });
      }
    }
  }
  if (assignments.length > 0) {
    await db.insert(subjectTeachers).values(assignments).onConflictDoNothing();
  }

  // Terms — 2025 & 2026 covered
  await db.insert(terms).values([
    { name: "Term 1", academicYear: 2025, isActive: false },
    { name: "Term 2", academicYear: 2025, isActive: false },
    { name: "Term 3", academicYear: 2025, isActive: false },
    { name: "Term 1", academicYear: 2026, isActive: true },
    { name: "Term 2", academicYear: 2026, isActive: false },
    { name: "Term 3", academicYear: 2026, isActive: false },
  ]);

  // Reference s6 to avoid unused warning
  void s6;

  return Response.json({
    ok: true,
    seeded: true,
    credentials: {
      admin: { email: "admin@school.com", password: "admin123" },
      teacher_example: { email: "chesuro.petra@lcss.ug", password: "teacher123" },
    },
    note:
      "All 14 subject teachers from the LCSS template were created. Each teaches their assigned subject across S1–S4.",
  });
}
