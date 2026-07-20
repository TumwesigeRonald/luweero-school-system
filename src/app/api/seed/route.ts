import { db } from "@/db";
import {
  classes,
  students,
  subjects,
  teachers,
  terms,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 1. Seed Teachers
    const defaultPassword = await hashPassword("Teacher123!");
    
    const [adminTeacher] = await db
      .insert(teachers)
      .values({
        fullName: "Admin User",
        email: "admin@school.com",
        passwordHash: defaultPassword,
        role: "admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    // 2. Seed Classes
    const insertedClasses = await db
      .insert(classes)
      .values([
        { name: "Senior 1", level: "S1" },
        { name: "Senior 2", level: "S2" },
        { name: "Senior 3", level: "S3" },
        { name: "Senior 4", level: "S4" },
      ])
      .onConflictDoNothing()
      .returning();

    // 3. Seed Subjects (category AND level included)
    const insertedSubjects = await db
      .insert(subjects)
      .values([
        { name: "Mathematics", code: "MTH", category: "Core", level: "O-Level" },
        { name: "English Language", code: "ENG", category: "Core", level: "O-Level" },
        { name: "Physics", code: "PHY", category: "Sciences", level: "O-Level" },
        { name: "Chemistry", code: "CHE", category: "Sciences", level: "O-Level" },
        { name: "Biology", code: "BIO", category: "Sciences", level: "O-Level" },
        { name: "Computer Studies", code: "ICT", category: "Vocational", level: "O-Level" },
      ])
      .onConflictDoNothing()
      .returning();

    // 4. Seed Terms
    const insertedTerms = await db
      .insert(terms)
      .values([
        { name: "Term 1", academicYear: "2025", isActive: false },
        { name: "Term 2", academicYear: "2025", isActive: false },
        { name: "Term 3", academicYear: "2025", isActive: false },
        { name: "Term 1", academicYear: "2026", isActive: true },
        { name: "Term 2", academicYear: "2026", isActive: false },
        { name: "Term 3", academicYear: "2026", isActive: false },
      ])
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({
      message: "Database seeded successfully",
      teachers: adminTeacher ? 1 : 0,
      classes: insertedClasses.length,
      subjects: insertedSubjects.length,
      terms: insertedTerms.length,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}