import { db } from "@/db";
import { classes } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(classes).orderBy(asc(classes.name));
  return Response.json({ classes: rows });
}

export async function POST(req: Request) {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim();
  const level = (body?.level ?? "O-LEVEL").toString().trim();
  const stream = body?.stream ? body.stream.toString().trim() : null;
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (level !== "O-LEVEL" && level !== "A-LEVEL") {
    return Response.json({ error: "Level must be O-LEVEL or A-LEVEL" }, { status: 400 });
  }
  const [row] = await db
    .insert(classes)
    .values({ name, level, stream, classTeacherId: me.id })
    .returning();
  return Response.json({ class: row });
}
