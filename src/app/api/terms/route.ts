import { db } from "@/db";
import { terms } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allTerms = await db.select().from(terms);
    return NextResponse.json(allTerms);
  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, academicYear, isActive } = body;

    if (!name || !academicYear) {
      return NextResponse.json(
        { error: "Name and academic year required" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(terms)
      .values({
        name: String(name),
        academicYear: String(academicYear),
        isActive: Boolean(isActive),
      } as any)
      .returning();

    return NextResponse.json({ term: row });
  } catch (error) {
    console.error("Error creating term:", error);
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
  }
}