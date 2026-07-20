import { db } from "@/db";
import { subjects } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(subjects).orderBy(asc(subjects.name));
  return Response.json({ subjects: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim();
  const code = body?.code ? body.code.toString().trim() : null;
  const level = (body?.level ?? "BOTH").toString().trim();
  const category = body?.category ? body.category.toString().trim() : null;
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!["O-LEVEL", "A-LEVEL", "BOTH"].includes(level)) {
    return Response.json({ error: "Invalid level" }, { status: 400 });
  }
  const [row] = await db
    .insert(subjects)
    .values({ name, code, level, category })
    .returning();
  return Response.json({ subject: row });
}
