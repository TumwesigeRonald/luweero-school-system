import { db } from "@/db";
import { teachers } from "@/db/schema";
import { getCurrentTeacher, hashPassword, verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentTeacher = await getCurrentTeacher();
    if (!currentTeacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPw, newPw } = await request.json();
    if (!oldPw || !newPw) {
      return NextResponse.json(
        { error: "Old and new passwords are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, currentTeacher.id))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User not found or missing password" }, { status: 404 });
    }

    const ok = await verifyPassword(oldPw, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Old password is incorrect" }, { status: 401 });
    }

    const hash = await hashPassword(newPw);
    await db
      .update(teachers)
      .set({ passwordHash: hash })
      .where(eq(teachers.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}