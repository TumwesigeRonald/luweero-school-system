import { db } from "@/db";
import { terms } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db
    .select()
    .from(terms)
    .orderBy(desc(terms.academicYear), desc(terms.id));
  return Response.json({ terms: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim();
  const academicYear = Number(body?.academicYear ?? body?.year);
  if (!name || !academicYear)
    return Response.json({ error: "Name and academic year required" }, { status: 400 });
  const [row] = await db.insert(terms).values({ name, academicYear }).returning();
  return Response.json({ term: row });
}

// PATCH -> update term (set active, or update next-term dates)
export async function PATCH(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = Number(body?.id);
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  if (body?.setActive) {
    await db.update(terms).set({ isActive: false });
    await db.update(terms).set({ isActive: true }).where(eq(terms.id, id));
  }
  const updates: Record<string, unknown> = {};
  if (body?.nextTermBeginsAt !== undefined) {
    updates.nextTermBeginsAt = body.nextTermBeginsAt || null;
  }
  if (body?.nextTermEndsAt !== undefined) {
    updates.nextTermEndsAt = body.nextTermEndsAt || null;
  }
  if (Object.keys(updates).length > 0) {
    await db.update(terms).set(updates).where(eq(terms.id, id));
  }
  return Response.json({ ok: true });
}
