import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { getSchoolSettings, SETTING_KEYS } from "@/lib/settings";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const s = await getSchoolSettings();
  return Response.json({ settings: s });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const updates: { key: string; value: string }[] = [];
  for (const k of SETTING_KEYS) {
    if (typeof body[k] === "string") {
      updates.push({ key: k, value: body[k] });
    }
  }
  for (const u of updates) {
    await db
      .insert(settings)
      .values({ key: u.key, value: u.value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: u.value, updatedAt: sql`now()` },
      });
  }
  const fresh = await getSchoolSettings();
  return Response.json({ ok: true, settings: fresh });
}
