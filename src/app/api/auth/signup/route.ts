import { db } from "@/db";
import { teachers } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { getSchoolSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const fullName = (body?.fullName ?? "").toString().trim();
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();
  const signupCode = (body?.signupCode ?? "").toString().trim();

  if (!fullName || !email || !password) {
    return Response.json(
      { error: "Full name, email and password are required" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const settings = await getSchoolSettings();
  const code = (settings.signupCode ?? "").trim();

  // If admin hasn't set a code yet, self-signup is disabled entirely.
  if (!code) {
    return Response.json(
      {
        error:
          "Self-signup is disabled. Please contact the school administrator to create your account.",
      },
      { status: 403 },
    );
  }

  if (signupCode !== code) {
    return Response.json(
      { error: "Invalid signup code. Ask your administrator for the correct code." },
      { status: 403 },
    );
  }

  try {
    const hash = await hashPassword(password);
    const [row] = await db
      .insert(teachers)
      .values({
        fullName,
        email,
        passwordHash: hash,
        role: "teacher",
      })
      .returning();

    // Log the user in immediately
    await createSession(row.id);
    return Response.json({
      ok: true,
      user: { id: row.id, fullName: row.fullName, role: row.role },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 400 },
      );
    }
    return Response.json({ error: msg }, { status: 400 });
  }
}

// GET -> check whether self-signup is enabled (used by the signup page)
export async function GET() {
  const settings = await getSchoolSettings();
  return Response.json({ enabled: Boolean((settings.signupCode ?? "").trim()) });
}
