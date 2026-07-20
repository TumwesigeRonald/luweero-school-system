import { db } from "@/db";
import { settings } from "@/db/schema";
import { inArray } from "drizzle-orm";

export const SETTING_KEYS = [
  "schoolName",
  "schoolAddress",
  "schoolPhone",
  "schoolEmail",
  "schoolMotto",
  "schoolLogoUrl",
  "signupCode",
] as const;

export type SchoolSettings = {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolMotto: string;
  schoolLogoUrl: string;
  signupCode: string;
};

const DEFAULTS: SchoolSettings = {
  schoolName: "LUWEERO COMMUNITY SECONDARY SCHOOL",
  schoolAddress:
    "Kiryanyonza Nakikoota Parish, Luwero District · P.O Box 29540, Kampala-Uganda",
  schoolPhone: "0740773771 / 0704222939 / 0772620552",
  schoolEmail: "",
  schoolMotto: "BE KNOWN BY DEEDS",
  schoolLogoUrl: "https://i.imgur.com/No15rUh.jpeg",
  signupCode: "",
};

export async function getSchoolSettings(): Promise<SchoolSettings> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, [...SETTING_KEYS]));
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value ?? "";
  return {
    ...DEFAULTS,
    ...(Object.fromEntries(
      SETTING_KEYS.map((k) => [k, map[k] ?? DEFAULTS[k]]),
    ) as SchoolSettings),
  };
}
