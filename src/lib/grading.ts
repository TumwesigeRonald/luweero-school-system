// ================= NEW LOWER SECONDARY CURRICULUM (CBC) =================
// This matches the LCSS template exactly.
//
// Per-subject workflow:
//   AOI1  (Assessment Opportunity 1, out of 3)
//   AOI2  (Assessment Opportunity 2, out of 3)
//   A.S   = average of AOI1 & AOI2 (out of 3)
//   F.A   = A.S * 20 / 3   (Formative Assessment, out of 20)
//   EOT   (End of Term exam, out of 80)
//   FINAL = F.A + EOT      (out of 100)
//
// Grade descriptors:
//   A (80-100)  Extraordinary competency
//   B (65-79)   High competency
//   C (55-64)   Adequate competency
//   D (45-54)   Minimum competency
//   E (0-44)    Below basic competency
//
// A-Level still uses UACE (P1 + P2 avg).

export type Level = "O-LEVEL" | "A-LEVEL";
export type OLevelComponent = "AOI1" | "AOI2" | "EOT";
export type ALevelComponent = "P1" | "P2";

// ---------- O-LEVEL (CBC) ----------
export function computeAS(aoi1: number | null, aoi2: number | null): number | null {
  const scores = [aoi1, aoi2].filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}

export function computeFA(as: number | null): number | null {
  if (as == null) return null;
  const fa = (as * 20) / 3;
  return Math.round(fa * 100) / 100;
}

export function computeOLevelFinal(
  aoi1: number | null,
  aoi2: number | null,
  eot: number | null,
): number | null {
  if (aoi1 == null && aoi2 == null && eot == null) return null;
  const as = computeAS(aoi1, aoi2);
  const fa = computeFA(as) ?? 0;
  const eotVal = eot ?? 0;
  const final = fa + eotVal;
  return Math.round(final * 100) / 100;
}

// CBC grading
export type CbcGrade = {
  grade: "A" | "B" | "C" | "D" | "E";
  descriptor: string;
};

export function cbcGrade(finalScore: number): CbcGrade {
  if (finalScore >= 80)
    return { grade: "A", descriptor: "Demonstrates an extraordinary level of competency" };
  if (finalScore >= 65)
    return { grade: "B", descriptor: "Demonstrates a high level of competency" };
  if (finalScore >= 55)
    return { grade: "C", descriptor: "Demonstrates an adequate level of competency" };
  if (finalScore >= 45)
    return { grade: "D", descriptor: "Demonstrates a minimum level of competency" };
  return { grade: "E", descriptor: "Demonstrates below the basic level of competency" };
}

// Class identifier from average of all subjects' A.S values (as seen in the template)
export function classIdentifier(averageAS: number): string {
  // From your template: 1.969 → MODERATE, 0.442 → BASIC, 2.335 → MODERATE
  // We use these thresholds:
  if (averageAS >= 2.4) return "OUTSTANDING";
  if (averageAS >= 1.5) return "MODERATE";
  if (averageAS >= 0.75) return "BASIC";
  return "BELOW BASIC";
}

// ---------- A-LEVEL (UACE, unchanged) ----------
export function computeALevelFinal(
  p1: number | null,
  p2: number | null,
): number | null {
  if (p1 == null && p2 == null) return null;
  const scores = [p1, p2].filter((s): s is number => s != null);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}

export type UaceGrade = { grade: string; points: number; remark: string };

export function uacePrincipalGrade(score: number): UaceGrade {
  if (score >= 80) return { grade: "A", points: 6, remark: "Excellent" };
  if (score >= 70) return { grade: "B", points: 5, remark: "Very Good" };
  if (score >= 60) return { grade: "C", points: 4, remark: "Good" };
  if (score >= 55) return { grade: "D", points: 3, remark: "Satisfactory" };
  if (score >= 50) return { grade: "E", points: 2, remark: "Pass" };
  if (score >= 40) return { grade: "O", points: 1, remark: "Subsidiary Pass" };
  return { grade: "F", points: 0, remark: "Fail" };
}

export function uaceSubsidiaryGrade(score: number): UaceGrade {
  if (score >= 80) return { grade: "1", points: 2, remark: "Distinction" };
  if (score >= 60) return { grade: "2", points: 1, remark: "Credit" };
  if (score >= 40) return { grade: "3", points: 0, remark: "Pass" };
  return { grade: "F", points: 0, remark: "Fail" };
}

// ---------- Legacy UCE (kept for backward compat but no longer default) ----------
export type UceGrade = { grade: string; points: number; remark: string };

export function uceGrade(score: number): UceGrade {
  if (score >= 80) return { grade: "D1", points: 1, remark: "Distinction" };
  if (score >= 75) return { grade: "D2", points: 2, remark: "Distinction" };
  if (score >= 70) return { grade: "C3", points: 3, remark: "Credit" };
  if (score >= 65) return { grade: "C4", points: 4, remark: "Credit" };
  if (score >= 60) return { grade: "C5", points: 5, remark: "Credit" };
  if (score >= 55) return { grade: "C6", points: 6, remark: "Credit" };
  if (score >= 50) return { grade: "P7", points: 7, remark: "Pass" };
  if (score >= 45) return { grade: "P8", points: 8, remark: "Pass" };
  return { grade: "F9", points: 9, remark: "Fail" };
}

export function uceDivision(aggregatePoints: number): string {
  if (aggregatePoints >= 4 && aggregatePoints <= 32) return "I";
  if (aggregatePoints >= 33 && aggregatePoints <= 44) return "II";
  if (aggregatePoints >= 45 && aggregatePoints <= 58) return "III";
  if (aggregatePoints >= 59 && aggregatePoints <= 67) return "IV";
  if (aggregatePoints >= 68 && aggregatePoints <= 71) return "U";
  return "X";
}

// ---------- Shared ----------
export function overallRemark(pct: number): string {
  if (pct >= 80) return "Outstanding performance. Keep it up!";
  if (pct >= 70) return "Very good performance. Aim higher.";
  if (pct >= 60) return "Good performance. More effort needed.";
  if (pct >= 50) return "Fair performance. Work harder.";
  if (pct >= 40) return "Below average. Needs improvement.";
  return "Poor performance. Serious effort required.";
}

export function componentsFor(level: string): string[] {
  return level === "A-LEVEL" ? ["P1", "P2"] : ["AOI1", "AOI2", "EOT"];
}
