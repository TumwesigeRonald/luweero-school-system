import { db } from "@/db";
import { teachers } from "@/db/schema";
import { getCurrentTeacher, hashPassword, verifyPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const oldPw = (body?.oldPassword ?? "").toString();
  const newPw = (body?.newPassword ?? "").toString();
  if (!oldPw || !newPw)
    return Response.json(
      { error: "Both old and new passwords required" },
      { status: 400 },
    );
  if (newPw.length < 6)
    return Response.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 },
    );

  const [user] = await db.select().from(teachers).where(eq(teachers.id, me.id)).limit(1);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const ok = await verifyPassword(oldPw, user.passwordHash);
  if (!ok) return Response.json({ error: "Old password is incorrect" }, { status: 401 });

  const hash = await hashPassword(newPw);
  await db.update(teachers).set({ passwordHash: hash }).where(eq(teachers.id, me.id));
  return Response.json({ ok: true });
}
