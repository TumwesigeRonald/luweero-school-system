import { db } from "@/db";
import { teachers } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);

    if (user && user.isActive && user.passwordHash) {
      const ok = await verifyPassword(password, user.passwordHash);

      if (ok) {
        await createSession(user.id);
        return NextResponse.json({ success: true, role: user.role });
      }
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}