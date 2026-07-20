"use client";

import { useEffect, useMemo, useState } from "react";
import type { Class, Mark, Student, Subject, Term } from "@/db/schema";
import {
  cbcGrade,
  computeAS,
  computeALevelFinal,
  computeFA,
  computeOLevelFinal,
  uacePrincipalGrade,
  uaceSubsidiaryGrade,
} from "@/lib/grading";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function MarksClient({
  classes,
  terms,
}: {
  classes: Class[];
  terms: Term[];
}) {
  const [classId, setClassId] = useState<string>(classes[0]?.id ? String(classes[0].id) : "");
  const activeTerm = terms.find((t) => t.isActive) ?? terms[0];
  const [termId, setTermId] = useState<string>(activeTerm ? String(activeTerm.id) : "");
  const [subjectId, setSubjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  useEffect(() => {
    if (!classId || !termId) return;
    setLoading(true);
    fetch(`/api/marks?classId=${classId}&termId=${termId}`)
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        setSubjects(d.subjects ?? []);
        setComponents(d.components ?? []);
        setMarks(d.marks ?? []);
        setSelectedClass(d.class ?? null);
        if (d.subjects?.[0] && !subjectId) {
          setSubjectId(String(d.subjects[0].id));
        } else if (
          d.subjects?.length > 0 &&
          !d.subjects.some((s: Subject) => String(s.id) === subjectId)
        ) {
          setSubjectId(String(d.subjects[0].id));
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, termId]);

  const currentSubject = useMemo(
    () => subjects.find((s) => String(s.id) === subjectId) ?? null,
    [subjects, subjectId],
  );

  const marksBySubjectStudentComp = useMemo(() => {
    const m: Record<string, Mark> = {};
    for (const mk of marks) m[`${mk.subjectId}-${mk.studentId}-${mk.component}`] = mk;
    return m;
  }, [marks]);

  async function updateScore(
    studentId: number,
    subjId: number,
    component: string,
    value: string,
  ) {
    const key = `${subjId}-${studentId}-${component}`;
    setSaveStates((s) => ({ ...s, [key]: "saving" }));
    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          subjectId: subjId,
          termId: Number(termId),
          component,
          score: value,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setMarks((prev) => {
        const filtered = prev.filter(
          (m) =>
            !(
              m.studentId === studentId &&
              m.subjectId === subjId &&
              m.component === component
            ),
        );
        if (value === "") return filtered;
        return [
          ...filtered,
          {
            id: -Math.floor(Math.random() * 1e6),
            studentId,
            subjectId: subjId,
            termId: Number(termId),
            component,
            score: Number(value).toFixed(2),
            enteredBy: null,
            updatedAt: new Date(),
          },
        ];
      });
      setSaveStates((s) => ({ ...s, [key]: "saved" }));
      setTimeout(
        () =>
          setSaveStates((s) => {
            const n = { ...s };
            delete n[key];
            return n;
          }),
        1000,
      );
    } catch {
      setSaveStates((s) => ({ ...s, [key]: "error" }));
    }
  }

  function computeStats(studentId: number, subj: Subject) {
    const isALevel = selectedClass?.level === "A-LEVEL";
    if (isALevel) {
      const p1 = marksBySubjectStudentComp[`${subj.id}-${studentId}-P1`];
      const p2 = marksBySubjectStudentComp[`${subj.id}-${studentId}-P2`];
      const final = computeALevelFinal(
        p1 ? Number(p1.score) : null,
        p2 ? Number(p2.score) : null,
      );
      if (final == null) return { as: null, fa: null, final: null, grade: "-" };
      const g =
        subj.category === "SUBSIDIARY" || subj.category === "GENERAL"
          ? uaceSubsidiaryGrade(final)
          : uacePrincipalGrade(final);
      return { as: null, fa: null, final, grade: g.grade };
    }
    const aoi1 = marksBySubjectStudentComp[`${subj.id}-${studentId}-AOI1`];
    const aoi2 = marksBySubjectStudentComp[`${subj.id}-${studentId}-AOI2`];
    const eot = marksBySubjectStudentComp[`${subj.id}-${studentId}-EOT`];
    const as = computeAS(
      aoi1 ? Number(aoi1.score) : null,
      aoi2 ? Number(aoi2.score) : null,
    );
    const fa = computeFA(as);
    const final = computeOLevelFinal(
      aoi1 ? Number(aoi1.score) : null,
      aoi2 ? Number(aoi2.score) : null,
      eot ? Number(eot.score) : null,
    );
    const grade = final != null ? cbcGrade(final).grade : "-";
    return { as, fa, final, grade };
  }

  function componentInputConfig(component: string) {
    if (component === "AOI1" || component === "AOI2") {
      return { max: 3, step: "0.1", hint: "/ 3" };
    }
    if (component === "EOT") {
      return { max: 80, step: "1", hint: "/ 80" };
    }
    return { max: 100, step: "1", hint: "/ 100" };
  }

  const isCbc = selectedClass?.level === "O-LEVEL";

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSubjectId("");
          }}
          className="border rounded-lg px-3 py-2 border-slate-300"
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.level})
            </option>
          ))}
        </select>
        <select
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
          className="border rounded-lg px-3 py-2 border-slate-300"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.academicYear} {t.isActive ? "(active)" : ""}
            </option>
          ))}
        </select>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="border rounded-lg px-3 py-2 border-slate-300"
          disabled={subjects.length === 0}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.category ? `(${s.category})` : ""}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-slate-500 p-8 text-center bg-white rounded-xl shadow-sm">
          Loading...
        </div>
      ) : students.length === 0 ? (
        <div className="text-slate-500 p-8 text-center bg-white rounded-xl shadow-sm">
          No students in this class. Add students first.
        </div>
      ) : !currentSubject ? (
        <div className="text-slate-500 p-8 text-center bg-white rounded-xl shadow-sm">
          No subjects available for this class level, or you have not been assigned any
          subjects for this class.
        </div>
      ) : (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 text-sm">
            <span className="font-semibold text-emerald-900">
              {currentSubject.name}
            </span>
            {currentSubject.category && (
              <span className="ml-2 text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                {currentSubject.category}
              </span>
            )}
            <span className="ml-3 text-emerald-700">
              Components: {components.join(" · ")}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-3 sticky left-0 bg-slate-50">Student</th>
                  {components.map((c) => {
                    const cfg = componentInputConfig(c);
                    return (
                      <th key={c} className="px-3 py-3 text-center">
                        {c}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {cfg.hint}
                        </div>
                      </th>
                    );
                  })}
                  {isCbc && (
                    <>
                      <th className="px-3 py-3 text-center bg-slate-100">
                        A.S <div className="text-[10px] font-normal">/ 3</div>
                      </th>
                      <th className="px-3 py-3 text-center bg-slate-100">
                        F.A <div className="text-[10px] font-normal">/ 20</div>
                      </th>
                    </>
                  )}
                  <th className="px-3 py-3 text-center bg-slate-100">
                    FINAL{" "}
                    <div className="text-[10px] font-normal">/ 100</div>
                  </th>
                  <th className="px-3 py-3 text-center bg-slate-100">Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => {
                  const stats = computeStats(st.id, currentSubject);
                  return (
                    <tr key={st.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 sticky left-0 bg-white font-medium whitespace-nowrap">
                        {st.fullName}
                        <div className="text-xs text-slate-400 font-normal">
                          {st.admissionNo}
                        </div>
                      </td>
                      {components.map((c) => {
                        const cfg = componentInputConfig(c);
                        const key = `${currentSubject.id}-${st.id}-${c}`;
                        const m = marksBySubjectStudentComp[key];
                        const state = saveStates[key];
                        const val = m ? Number(m.score) : "";
                        return (
                          <td key={c} className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min={0}
                              max={cfg.max}
                              step={cfg.step}
                              defaultValue={val === "" ? "" : String(val)}
                              key={`${key}-${val}`}
                              onBlur={(e) =>
                                updateScore(st.id, currentSubject.id, c, e.target.value)
                              }
                              className={`w-16 md:w-20 text-center rounded border px-1 py-2 md:py-1 text-base md:text-sm outline-none ${
                                state === "saving"
                                  ? "border-amber-400"
                                  : state === "saved"
                                    ? "border-green-500"
                                    : state === "error"
                                      ? "border-red-500"
                                      : "border-slate-300"
                              }`}
                            />
                          </td>
                        );
                      })}
                      {isCbc && (
                        <>
                          <td className="px-3 py-2 text-center bg-slate-50 text-xs">
                            {stats.as != null ? stats.as.toFixed(2) : "—"}
                          </td>
                          <td className="px-3 py-2 text-center bg-slate-50 text-xs">
                            {stats.fa != null ? stats.fa.toFixed(2) : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2 text-center font-semibold bg-slate-50">
                        {stats.final != null ? stats.final.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center bg-slate-50 font-bold text-emerald-700">
                        {stats.grade}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-500 mt-3 space-y-1">
            <p>
              💡 <strong>CBC (S1–S4):</strong> Enter AOI1 &amp; AOI2 out of 3, EOT out of
              80. System auto-calculates A.S (avg), F.A (A.S×20/3), and FINAL (F.A+EOT).
            </p>
            <p>
              💡 <strong>UACE (S5–S6):</strong> Enter Paper 1 &amp; Paper 2 out of 100.
              Auto-averages to Final.
            </p>
            <p>💡 Grades update live as you type. Auto-saves on blur.</p>
          </div>
        </>
      )}
    </div>
  );
}
