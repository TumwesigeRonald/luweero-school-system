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
  classes = [],
  terms = [],
}: {
  classes: Class[];
  terms: Term[];
}) {
  const [classId, setClassId] = useState<string>(
    classes[0]?.id ? String(classes[0].id) : "1"
  );
  
  const activeTerm = terms.find((t) => t.isActive) ?? terms[0];
  const [termId, setTermId] = useState<string>(
    activeTerm?.id ? String(activeTerm.id) : "1"
  );

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
        const fetchedStudents = d.students ?? [];
        const fetchedSubjects = d.subjects ?? [];
        
        setStudents(fetchedStudents);
        setSubjects(fetchedSubjects);
        setComponents(d.components ?? []);
        setMarks(d.marks ?? []);
        setSelectedClass(d.class ?? null);

        if (fetchedSubjects.length > 0) {
          setSubjectId((prev) => {
            if (prev && fetchedSubjects.some((s: Subject) => String(s.id) === prev)) {
              return prev;
            }
            return String(fetchedSubjects[0].id);
          });
        } else {
          setSubjectId("");
        }
      })
      .catch((err) => console.error("Error fetching marks:", err))
      .finally(() => setLoading(false));
  }, [classId, termId]);

  const currentSubject = useMemo(
    () => subjects.find((s) => String(s.id) === subjectId) ?? subjects[0] ?? null,
    [subjects, subjectId]
  );

  const marksBySubjectStudentComp = useMemo(() => {
    const m: Record<string, Mark> = {};
    for (const mk of marks) {
      m[`${mk.subjectId}-${mk.studentId}-${mk.component}`] = mk;
    }
    return m;
  }, [marks]);

  async function updateScore(
    studentId: number,
    subjId: number,
    component: string,
    value: string
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

      if (!res.ok) throw new Error("Save failed");

      const numVal = parseFloat(value);

      setMarks((prev) => {
        const filtered = prev.filter(
          (m) =>
            !(
              m.studentId === studentId &&
              m.subjectId === subjId &&
              m.component === component
            )
        );
        if (value === "" || isNaN(numVal)) return filtered;
        return [
          ...filtered,
          {
            id: -Math.floor(Math.random() * 1e6),
            studentId,
            subjectId: subjId,
            termId: Number(termId),
            component,
            score: numVal.toFixed(2),
            enteredBy: null,
            updatedAt: new Date(),
          },
        ];
      });

      setSaveStates((s) => ({ ...s, [key]: "saved" }));
      setTimeout(() => {
        setSaveStates((s) => {
          const n = { ...s };
          delete n[key];
          return n;
        });
      }, 1000);
    } catch {
      setSaveStates((s) => ({ ...s, [key]: "error" }));
    }
  }

  function parseVal(m?: Mark): number | null {
    if (!m || m.score == null || m.score === "") return null;
    const n = parseFloat(String(m.score));
    return isNaN(n) ? null : n;
  }

  function computeStats(studentId: number, subj: Subject) {
    const isALevel = selectedClass?.level === "A-LEVEL";

    if (isALevel) {
      const p1 = parseVal(marksBySubjectStudentComp[`${subj.id}-${studentId}-P1`]);
      const p2 = parseVal(marksBySubjectStudentComp[`${subj.id}-${studentId}-P2`]);
      const final = computeALevelFinal(p1, p2);
      if (final == null) return { as: null, fa: null, final: null, grade: "-" };
      const g =
        subj.category === "SUBSIDIARY" || subj.category === "GENERAL"
          ? uaceSubsidiaryGrade(final)
          : uacePrincipalGrade(final);
      return { as: null, fa: null, final, grade: g.grade };
    }

    const aoi1 = parseVal(marksBySubjectStudentComp[`${subj.id}-${studentId}-AOI1`]);
    const aoi2 = parseVal(marksBySubjectStudentComp[`${subj.id}-${studentId}-AOI2`]);
    const eot = parseVal(marksBySubjectStudentComp[`${subj.id}-${studentId}-EOT`]);

    const as = computeAS(aoi1, aoi2);
    const fa = computeFA(as);
    const final = computeOLevelFinal(aoi1, aoi2, eot);
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
          }}
          className="border rounded-lg px-3 py-2 border-slate-300 bg-white"
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
          className="border rounded-lg px-3 py-2 border-slate-300 bg-white"
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
          className="border rounded-lg px-3 py-2 border-slate-300 bg-white"
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
          No subjects available for this class level.
        </div>
      ) : (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold text-emerald-900">
                {currentSubject.name}
              </span>
              {currentSubject.category && (
                <span className="ml-2 text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                  {currentSubject.category}
                </span>
              )}
            </div>
            <span className="text-emerald-700 text-xs font-mono">
              Components: {components.join(" · ")}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-auto border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 sticky left-0 bg-slate-50 font-semibold">
                    Student
                  </th>
                  {components.map((c) => {
                    const cfg = componentInputConfig(c);
                    return (
                      <th key={c} className="px-3 py-3 text-center font-semibold">
                        {c}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {cfg.hint}
                        </div>
                      </th>
                    );
                  })}
                  {isCbc && (
                    <>
                      <th className="px-3 py-3 text-center bg-slate-100 font-semibold">
                        A.S <div className="text-[10px] font-normal">/ 3</div>
                      </th>
                      <th className="px-3 py-3 text-center bg-slate-100 font-semibold">
                        F.A <div className="text-[10px] font-normal">/ 20</div>
                      </th>
                    </>
                  )}
                  <th className="px-3 py-3 text-center bg-slate-100 font-semibold">
                    FINAL <div className="text-[10px] font-normal">/ 100</div>
                  </th>
                  <th className="px-3 py-3 text-center bg-slate-100 font-semibold">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => {
                  const stats = computeStats(st.id, currentSubject);
                  return (
                    <tr key={st.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 sticky left-0 bg-white font-medium whitespace-nowrap">
                        {st.fullName}
                        <div className="text-xs text-slate-400 font-normal font-mono">
                          {st.admissionNo}
                        </div>
                      </td>
                      {components.map((c) => {
                        const cfg = componentInputConfig(c);
                        const key = `${currentSubject.id}-${st.id}-${c}`;
                        const m = marksBySubjectStudentComp[key];
                        const state = saveStates[key];
                        const val = m ? String(m.score) : "";
                        return (
                          <td key={c} className="px-2 py-1 text-center">
                            <input
                              type="number"
                              min={0}
                              max={cfg.max}
                              step={cfg.step}
                              defaultValue={val}
                              key={`${key}-${val}`}
                              onBlur={(e) =>
                                updateScore(
                                  st.id,
                                  currentSubject.id,
                                  c,
                                  e.target.value
                                )
                              }
                              className={`w-16 md:w-20 text-center rounded border px-1 py-2 md:py-1 text-base md:text-sm outline-none transition-all ${
                                state === "saving"
                                  ? "border-amber-400 bg-amber-50"
                                  : state === "saved"
                                  ? "border-green-500 bg-green-50"
                                  : state === "error"
                                  ? "border-red-500 bg-red-50"
                                  : "border-slate-300"
                              }`}
                            />
                          </td>
                        );
                      })}
                      {isCbc && (
                        <>
                          <td className="px-3 py-2 text-center bg-slate-50 text-xs font-mono font-medium">
                            {stats.as != null ? stats.as.toFixed(2) : "—"}
                          </td>
                          <td className="px-3 py-2 text-center bg-slate-50 text-xs font-mono font-medium">
                            {stats.fa != null ? stats.fa.toFixed(2) : "—"}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2 text-center font-semibold bg-slate-50 font-mono">
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
        </>
      )}
    </div>
  );
}