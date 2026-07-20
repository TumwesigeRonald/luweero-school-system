import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  varchar,
  boolean,
  uniqueIndex,
  index,
  numeric,
  date,
} from "drizzle-orm/pg-core";

// Teachers / users of the system
export const teachers = pgTable(
  "teachers",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 20 }).notNull().default("teacher"), // 'admin' | 'teacher'
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("teachers_email_uidx").on(t.email),
  }),
);

// Sessions
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 64 }).notNull(),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("sessions_token_uidx").on(t.token),
  }),
);

// Classes
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  level: varchar("level", { length: 10 }).notNull(),
  stream: varchar("stream", { length: 50 }),
  classTeacherId: integer("class_teacher_id").references(() => teachers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Subjects
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }),
  level: varchar("level", { length: 10 }).notNull().default("BOTH"),
  category: varchar("category", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Which teacher teaches a subject in a class
export const subjectTeachers = pgTable(
  "subject_teachers",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    teacherId: integer("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniq: uniqueIndex("subject_teacher_class_uidx").on(
      t.subjectId,
      t.teacherId,
      t.classId,
    ),
    byTeacher: index("st_teacher_idx").on(t.teacherId),
  }),
);

// Students
export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    admissionNo: varchar("admission_no", { length: 50 }).notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    gender: varchar("gender", { length: 10 }),
    dateOfBirth: varchar("date_of_birth", { length: 20 }),
    classId: integer("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    guardianName: varchar("guardian_name", { length: 150 }),
    guardianPhone: varchar("guardian_phone", { length: 30 }),
    photoUrl: text("photo_url"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    admissionIdx: uniqueIndex("students_admission_uidx").on(t.admissionNo),
    classIdx: index("students_class_idx").on(t.classId),
  }),
);

// Student sessions (separate from teacher sessions so we can enforce type)
export const studentSessions = pgTable(
  "student_sessions",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 64 }).notNull(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("student_sessions_token_uidx").on(t.token),
  }),
);

// Terms with next-term dates
export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  academicYear: integer("academic_year").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  nextTermBeginsAt: date("next_term_begins_at"),
  nextTermEndsAt: date("next_term_ends_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Marks
export const marks = pgTable(
  "marks",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    termId: integer("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    component: varchar("component", { length: 10 }).notNull(),
    score: numeric("score", { precision: 6, scale: 2 }).notNull(),
    enteredBy: integer("entered_by").references(() => teachers.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqEntry: uniqueIndex("marks_unique_entry_uidx").on(
      t.studentId,
      t.subjectId,
      t.termId,
      t.component,
    ),
    studentIdx: index("marks_student_idx").on(t.studentId),
    termIdx: index("marks_term_idx").on(t.termId),
  }),
);

// Per-student per-term attendance & fees
export const studentTerms = pgTable(
  "student_terms",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    termId: integer("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    daysPresent: integer("days_present"),
    daysAbsent: integer("days_absent"),
    feesBalance: numeric("fees_balance", { precision: 12, scale: 2 }),
    feesPaid: numeric("fees_paid", { precision: 12, scale: 2 }),
    conduct: varchar("conduct", { length: 50 }),
    classTeacherComment: text("class_teacher_comment"),
    headTeacherComment: text("head_teacher_comment"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("student_term_uidx").on(t.studentId, t.termId),
  }),
);

// Key/value school settings (singleton row style)
export const settings = pgTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Teacher = typeof teachers.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Term = typeof terms.$inferSelect;
export type Mark = typeof marks.$inferSelect;
export type SubjectTeacher = typeof subjectTeachers.$inferSelect;
export type StudentTerm = typeof studentTerms.$inferSelect;
export type Setting = typeof settings.$inferSelect;
