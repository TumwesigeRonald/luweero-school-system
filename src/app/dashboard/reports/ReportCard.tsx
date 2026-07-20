"use client";

export type ReportData = {
  school: {
    schoolName: string;
    schoolAddress: string;
    schoolPhone: string;
    schoolEmail: string;
    schoolMotto: string;
    schoolLogoUrl: string;
  };
  student: {
    id: number;
    admissionNo: string;
    fullName: string;
    gender: string | null;
    dateOfBirth: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    photoUrl: string | null;
  };
  class: { id: number; name: string; level: string; stream: string | null } | null;
  term: {
    id: number;
    name: string;
    academicYear: number;
    nextTermBeginsAt: string | null;
    nextTermEndsAt: string | null;
  } | null;
  level: "O-LEVEL" | "A-LEVEL";
  components: string[];
  subjects: {
    subjectId: number;
    subjectName: string;
    subjectCode: string | null;
    subjectCategory: string | null;
    componentScores: Record<string, number | null>;
    assessmentScore: number | null;
    formativeAssessment: number | null;
    finalScore: number | null;
    grade: string;
    descriptor: string;
    points: number;
    teacherInitials: string;
    subjectPosition: number | null;
    subjectClassCount: number;
  }[];
  studentTerm: {
    daysPresent: number | null;
    daysAbsent: number | null;
    feesBalance: string | null;
    feesPaid: string | null;
    conduct: string | null;
    classTeacherComment: string | null;
    headTeacherComment: string | null;
  } | null;
  totals: {
    total: number;
    average: number;
    subjectsCount: number;
    aggregatePoints: number;
    division: string;
    identifier: string;
    identifierValue: number;
    position: number | null;
    classSize: number;
    overallRemark: string;
  };
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ReportCard({ data }: { data: ReportData }) {
  const {
    school,
    student,
    class: klass,
    term,
    level,
    subjects,
    studentTerm,
    totals,
  } = data;
  const takenSubjects = subjects.filter((s) => s.finalScore != null);
  const isCbc = level === "O-LEVEL";
  const isALevel = level === "A-LEVEL";

  return (
    <div className="print-page bg-white rounded-xl shadow-sm p-5 max-w-5xl mx-auto text-[11.5px]">
      {/* Header */}
      <div className="border-b-4 border-emerald-700 pb-2 mb-3">
        <div className="flex items-center gap-4">
          {school.schoolLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={school.schoolLogoUrl}
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center text-3xl">
              🎓
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-wide leading-tight">
              {school.schoolName}
            </h1>
            <p className="text-slate-600 text-[10px] leading-snug">
              {school.schoolAddress}
            </p>
            <p className="text-slate-600 text-[10px] leading-snug">
              Tel: {school.schoolPhone}
              {school.schoolEmail ? ` · ${school.schoolEmail}` : ""}
            </p>
            <p className="text-slate-500 text-[10px] italic font-semibold mt-0.5">
              &ldquo;{school.schoolMotto}&rdquo;
            </p>
          </div>
          {student.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={student.photoUrl}
              alt="Student"
              className="w-16 h-20 object-cover border border-slate-300 rounded"
            />
          ) : (
            <div className="w-16 h-20 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px] text-slate-400 text-center">
              STUDENT<br />PHOTO
            </div>
          )}
        </div>
        <h2 className="text-center text-xs font-bold mt-2 uppercase tracking-wide bg-emerald-100 py-1 rounded">
          {isCbc ? "LOWER SECONDARY (CBC)" : "UACE"} Termly Progress Report — {term?.name}{" "}
          {term?.academicYear}
        </h2>
      </div>

      {/* Student info */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-0.5 mb-3 border border-slate-200 rounded p-2 bg-slate-50 text-[11px]">
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Student Name</span>
          <div className="font-semibold">{student.fullName}</div>
        </div>
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Roll / Adm No</span>
          <div className="font-semibold">{student.admissionNo}</div>
        </div>
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Class</span>
          <div className="font-semibold">
            {klass?.name} {klass?.stream ?? ""}
          </div>
        </div>
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Sex</span>
          <div className="font-semibold">{student.gender ?? "—"}</div>
        </div>
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Date of Birth</span>
          <div className="font-semibold">{student.dateOfBirth ?? "—"}</div>
        </div>
        <div>
          <span className="text-slate-500 text-[9px] uppercase">Academic Year</span>
          <div className="font-semibold">{term?.academicYear}</div>
        </div>
      </div>

      {/* Marks table — matches LCSS Entry format exactly */}
      <table className="w-full border-collapse mb-3 text-[10px]">
        <thead className="bg-slate-800 text-white">
          <tr>
            <th className="border border-slate-400 px-1 py-1 text-left">SUBJECT</th>
            {isCbc ? (
              <>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  AOI1<div className="text-[8px] font-normal">/3</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  AOI2<div className="text-[8px] font-normal">/3</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  A.S<div className="text-[8px] font-normal">/3</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  F.A<div className="text-[8px] font-normal">/20</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  EOT<div className="text-[8px] font-normal">/80</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-12">
                  FINAL<div className="text-[8px] font-normal">/100</div>
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-8">
                  GRADE
                </th>
                <th className="border border-slate-400 px-1 py-1 text-left">
                  GRADE DESCRIPTOR
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  INITIAL
                </th>
              </>
            ) : (
              <>
                {isALevel && (
                  <th className="border border-slate-400 px-1 py-1 text-center">Cat</th>
                )}
                <th className="border border-slate-400 px-1 py-1 text-center w-10">P1</th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">P2</th>
                <th className="border border-slate-400 px-1 py-1 text-center w-12">
                  FINAL
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-8">
                  GRADE
                </th>
                <th className="border border-slate-400 px-1 py-1 text-center w-8">Pts</th>
                <th className="border border-slate-400 px-1 py-1 text-left">Remark</th>
                <th className="border border-slate-400 px-1 py-1 text-center w-10">
                  INITIAL
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {takenSubjects.length === 0 ? (
            <tr>
              <td
                colSpan={isCbc ? 10 : 8}
                className="border border-slate-300 text-center py-4 text-slate-400"
              >
                No marks recorded yet for this student in this term.
              </td>
            </tr>
          ) : (
            takenSubjects.map((s) => (
              <tr key={s.subjectId} className="odd:bg-white even:bg-slate-50">
                <td className="border border-slate-300 px-1 py-0.5 font-medium">
                  {s.subjectName.toUpperCase()}
                </td>
                {isCbc ? (
                  <>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.componentScores["AOI1"] != null
                        ? Number(s.componentScores["AOI1"]).toFixed(1)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.componentScores["AOI2"] != null
                        ? Number(s.componentScores["AOI2"]).toFixed(1)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.assessmentScore != null ? s.assessmentScore.toFixed(2) : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.formativeAssessment != null
                        ? s.formativeAssessment.toFixed(1)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.componentScores["EOT"] != null
                        ? Number(s.componentScores["EOT"]).toFixed(0)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-semibold">
                      {s.finalScore != null ? s.finalScore.toFixed(0) : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-bold text-emerald-700">
                      {s.grade}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-[10px]">
                      {s.descriptor}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-mono text-[10px]">
                      {s.teacherInitials || "—"}
                    </td>
                  </>
                ) : (
                  <>
                    {isALevel && (
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-[9px]">
                        {s.subjectCategory ?? "—"}
                      </td>
                    )}
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.componentScores["P1"] != null
                        ? Number(s.componentScores["P1"]).toFixed(0)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.componentScores["P2"] != null
                        ? Number(s.componentScores["P2"]).toFixed(0)
                        : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-semibold">
                      {s.finalScore != null ? s.finalScore.toFixed(0) : "—"}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-bold text-emerald-700">
                      {s.grade}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center">
                      {s.points}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-[10px]">
                      {s.descriptor}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center font-mono text-[10px]">
                      {s.teacherInitials || "—"}
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
          {/* Totals row */}
          {takenSubjects.length > 0 && (
            <tr className="bg-slate-100 font-bold">
              <td className="border border-slate-400 px-1 py-1">TOTAL</td>
              {isCbc ? (
                <>
                  <td colSpan={5} className="border border-slate-400"></td>
                  <td className="border border-slate-400 px-1 py-1 text-center">
                    {totals.total.toFixed(0)}
                  </td>
                  <td colSpan={3} className="border border-slate-400 px-1 py-1 text-left">
                    IDENTIFIER: <span className="text-emerald-700">{totals.identifier}</span>
                    <span className="ml-2 text-slate-500 font-normal text-[10px]">
                      ({totals.identifierValue.toFixed(3)})
                    </span>
                  </td>
                </>
              ) : (
                <>
                  <td
                    colSpan={isALevel ? 3 : 2}
                    className="border border-slate-400"
                  ></td>
                  <td className="border border-slate-400 px-1 py-1 text-center">
                    {totals.total.toFixed(0)}
                  </td>
                  <td colSpan={4} className="border border-slate-400 px-1 py-1 text-left">
                    AVG: {totals.average.toFixed(1)}% · AGG: {totals.aggregatePoints}
                  </td>
                </>
              )}
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary panels */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5 text-center">
          <div className="text-[9px] uppercase text-emerald-600 font-semibold">Average</div>
          <div className="text-base font-bold text-emerald-900">
            {totals.average.toFixed(1)}%
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-1.5 text-center">
          <div className="text-[9px] uppercase text-blue-600 font-semibold">Total</div>
          <div className="text-base font-bold text-blue-900">
            {totals.total.toFixed(0)}
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-center">
          <div className="text-[9px] uppercase text-amber-600 font-semibold">
            {isCbc ? "Identifier" : isALevel ? "Points" : "Division"}
          </div>
          <div className="text-base font-bold text-amber-900">
            {isCbc ? totals.identifier : totals.division}
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded p-1.5 text-center">
          <div className="text-[9px] uppercase text-purple-600 font-semibold">
            Subjects
          </div>
          <div className="text-base font-bold text-purple-900">
            {totals.subjectsCount}
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded p-1.5 text-center">
          <div className="text-[9px] uppercase text-rose-600 font-semibold">Position</div>
          <div className="text-base font-bold text-rose-900">
            {totals.position ? ordinal(totals.position) : "—"}
            <span className="text-[10px] font-normal text-rose-700">
              {" "}
              / {totals.classSize}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance + Fees */}
      {(studentTerm || term?.nextTermBeginsAt) && (
        <div className="grid grid-cols-4 gap-2 mb-3 text-[10px]">
          <div className="border border-slate-200 rounded p-1.5">
            <div className="text-slate-500 uppercase text-[9px]">Days Present</div>
            <div className="font-semibold">{studentTerm?.daysPresent ?? "—"}</div>
          </div>
          <div className="border border-slate-200 rounded p-1.5">
            <div className="text-slate-500 uppercase text-[9px]">Days Absent</div>
            <div className="font-semibold">{studentTerm?.daysAbsent ?? "—"}</div>
          </div>
          <div className="border border-slate-200 rounded p-1.5">
            <div className="text-slate-500 uppercase text-[9px]">Fees Paid</div>
            <div className="font-semibold">
              {studentTerm?.feesPaid
                ? `UGX ${Number(studentTerm.feesPaid).toLocaleString()}`
                : "—"}
            </div>
          </div>
          <div className="border border-slate-200 rounded p-1.5">
            <div className="text-slate-500 uppercase text-[9px]">Fees Balance</div>
            <div
              className={`font-semibold ${Number(studentTerm?.feesBalance ?? 0) > 0 ? "text-red-600" : "text-emerald-700"}`}
            >
              {studentTerm?.feesBalance
                ? `UGX ${Number(studentTerm.feesBalance).toLocaleString()}`
                : "—"}
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-2 mb-3 text-[11px]">
        <div className="border border-slate-200 rounded p-2">
          <div className="font-semibold text-slate-700 mb-1 text-[10px] uppercase">
            Class Teacher&apos;s Comment
          </div>
          <p className="min-h-[16px]">
            {studentTerm?.classTeacherComment || totals.overallRemark}
          </p>
          <div className="mt-2 flex justify-between text-[9px] text-slate-500">
            <span>Signature: __________________</span>
            <span>Date: _________</span>
          </div>
        </div>
        <div className="border border-slate-200 rounded p-2">
          <div className="font-semibold text-slate-700 mb-1 text-[10px] uppercase">
            Head Teacher&apos;s Comment
          </div>
          <p className="min-h-[16px]">
            {studentTerm?.headTeacherComment ||
              (totals.average >= 60
                ? "Commendable performance. Keep it up."
                : "More effort is needed next term.")}
          </p>
          <div className="mt-2 flex justify-between text-[9px] text-slate-500">
            <span>Signature: __________________</span>
            <span>Date: _________</span>
          </div>
        </div>
      </div>

      {/* Next term */}
      {(term?.nextTermBeginsAt || term?.nextTermEndsAt) && (
        <div className="border border-emerald-300 bg-emerald-50 rounded p-1.5 mb-3 text-[10px] text-center font-semibold text-emerald-900">
          NEXT TERM BEGINS: {term.nextTermBeginsAt ?? "—"} · ENDS:{" "}
          {term.nextTermEndsAt ?? "—"}
        </div>
      )}

      {/* Grading scale */}
      <div className="text-[9px] text-slate-600 border-t pt-2">
        <div className="font-semibold mb-1">
          {isCbc
            ? "CBC Grading Scale (Lower Secondary):"
            : "UACE Grading Scale (Principal):"}
        </div>
        {isCbc ? (
          <div className="grid grid-cols-5 gap-1">
            <span>
              <strong>A</strong> (80-100): Extraordinary competency
            </span>
            <span>
              <strong>B</strong> (65-79): High competency
            </span>
            <span>
              <strong>C</strong> (55-64): Adequate competency
            </span>
            <span>
              <strong>D</strong> (45-54): Minimum competency
            </span>
            <span>
              <strong>E</strong> (0-44): Below basic
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-3">
            <span>A: 80-100 (6)</span>
            <span>B: 70-79 (5)</span>
            <span>C: 60-69 (4)</span>
            <span>D: 55-59 (3)</span>
            <span>E: 50-54 (2)</span>
            <span>O: 40-49 (1)</span>
            <span>F: 0-39 (0)</span>
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-slate-200 text-center text-slate-500">
          Powered by <span className="font-semibold">LCSS School Management System</span> ·
          Developed by{" "}
          <span className="font-semibold text-slate-700">TUMWESIGE RONALD</span> · 📞
          0702003686
        </div>
      </div>
    </div>
  );
}
