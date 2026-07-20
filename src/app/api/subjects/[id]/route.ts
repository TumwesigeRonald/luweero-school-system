import { db } from "@/db";
import { subjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/subjects/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id, 10);

    const data = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));

    if (!data.length) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subject" }, { status: 500 });
  }
}

// PATCH /api/subjects/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id, 10);
    const body = await request.json();

    const updated = await db
      .update(subjects)
      .set(body)
      .where(eq(subjects.id, subjectId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

// DELETE /api/subjects/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectId = parseInt(id, 10);

    await db.delete(subjects).where(eq(subjects.id, subjectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}