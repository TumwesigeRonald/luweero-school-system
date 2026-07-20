import { db } from "@/db";
import { classes } from "@/db/schema";
import { getCurrentTeacher } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_CLASSES: Array<{ name: string; level: "O-LEVEL" | "A-LEVEL" }> = [
  { name: "S1", level: "O-LEVEL" },
  { name: "S2", level: "O-LEVEL" },
  { name: "S3", level: "O-LEVEL" },
  { name: "S4", level: "O-LEVEL" },
  { name: "S5", level: "A-LEVEL" },
  { name: "S6", level: "A-LEVEL" },
];

export async function POST() {
  const me = await getCurrentTeacher();
  if (!me) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin")
    return Response.json({ error: "Admin only" }, { status: 403 });

  const existing = await db.select({ name: classes.name }).from(classes);
  const existingNames = new Set(existing.map((c) => c.name.toUpperCase().trim()));

  const toInsert = DEFAULT_CLASSES.filter(
    (c) => !existingNames.has(c.name.toUpperCase()),
  ).map((c) => ({
    name: c.name,
    level: c.level,
    stream: null,
    classTeacherId: me.id,
  }));

  let inserted = 0;
  if (toInsert.length > 0) {
    const rows = await db.insert(classes).values(toInsert).returning();
    inserted = rows.length;
  }

  const all = await db
    .select()
    .from(classes)
    .orderBy(sql`${classes.name}`);
  return Response.json({ ok: true, inserted, classes: all });
}
