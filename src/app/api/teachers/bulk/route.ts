import { db } from "@/db";
import { teachers } from "@/db/schema";
import { getCurrentTeacher, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST body: { rows: [{ fullName, email?, password?, role? }], defaultPassword? }
// If email is blank, we derive one from the full name (firstname.lastname@lcss.ug).
// If password is blank, we use defaultPassword or "teacher123".
export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin")
    return Response.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const rows: Array<Record<string, string>> = Array.isArray(body?.rows)
    ? body.rows
    : [];
  const defaultPassword = (body?.defaultPassword ?? "teacher123").toString();
  if (rows.length === 0)
    return Response.json({ error: "No teachers to import" }, { status: 400 });

  const inserted: { fullName: string; email: string; password: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const raw of rows) {
    const fullName = (raw.fullName ?? "").toString().trim();
    if (!fullName) continue;

    let email = (raw.email ?? "").toString().trim().toLowerCase();
    if (!email) {
      // Derive email from name: first & last word, lowercased
      const words = fullName.split(/\s+/).filter((w) => w);
      const first = words[0]?.toLowerCase() ?? "teacher";
      const last = words[words.length - 1]?.toLowerCase() ?? "";
      email = last && last !== first ? `${first}.${last}@lcss.ug` : `${first}@lcss.ug`;
    }
    const password = (raw.password ?? "").toString().trim() || defaultPassword;
    const role = raw.role?.toString().trim() === "admin" ? "admin" : "teacher";

    try {
      const hash = await hashPassword(password);
      await db.insert(teachers).values({
        fullName,
        email,
        passwordHash: hash,
        role,
      });
      inserted.push({ fullName, email, password });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "failed";
      skipped.push({
        name: fullName,
        reason: msg.includes("unique") ? `Email ${email} already exists` : msg,
      });
    }
  }

  return Response.json({ ok: true, inserted, skipped });
}
