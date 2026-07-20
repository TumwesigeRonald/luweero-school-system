import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// Classes Table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level").notNull(),
  stream: text("stream"),
  classTeacherId: integer("class_teacher_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Terms Table
export const terms = pgTable("terms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(false),
});

// Teachers Table
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  role: text("role"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students Table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  admissionNo: text("admission_no").notNull(),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  guardianName: text("guardian_name"),
  guardianPhone: text("guardian_phone"),
  photoUrl: text("photo_url"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subjects Table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  level: text("level").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subject Teachers Join Table
export const subjectTeachers = pgTable("subject_teachers", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "cascade" }),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }),
});

// Marks Table
export const marks = pgTable("marks", {
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
  component: text("component").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  enteredBy: integer("entered_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings Table
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions Table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  teacherId: integer("teacher_id"),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});