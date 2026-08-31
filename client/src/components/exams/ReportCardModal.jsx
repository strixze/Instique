import { useEffect, useState, useRef } from 'react';
import {
  Printer, X, Award, GraduationCap, CheckCircle2, AlertCircle,
  BookOpen, ChevronLeft, ChevronRight, Download, User
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { examApi } from '../../api/exam.api';
import { useUserStore } from '../../store/userStore';

function getGradeColor(grade) {
  switch (grade) {
    case 'A+': case 'A': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'B+': case 'B': return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'C': case 'D': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'F': return 'text-rose-700 bg-rose-50 border-rose-200';
    default: return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

function getResultBadge(result) {
  if (result === 'pass') return <Badge color="success">PASSED</Badge>;
  if (result === 'fail') return <Badge color="danger">FAILED</Badge>;
  return <Badge color="warning">INCOMPLETE</Badge>;
}

export default function ReportCardModal({ isOpen, onClose, exam, studentId }) {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [examInfo, setExamInfo] = useState(null);
  const [studentsResults, setStudentsResults] = useState([]);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  const reportCardRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !exam?._id) return;
    let active = true;
    setLoading(true);

    examApi.getExamResults(exam._id)
      .then((res) => {
        if (!active) return;
        const data = res.data;
        setExamInfo(data.exam);
        const resultsList = data.results || [];
        setStudentsResults(resultsList);

        if (studentId) {
          const idx = resultsList.findIndex((r) => r.student?._id?.toString() === studentId.toString());
          if (idx !== -1) setSelectedStudentIndex(idx);
          else setSelectedStudentIndex(0);
        } else {
          setSelectedStudentIndex(0);
        }
      })
      .catch(() => {
        if (active) {
          setExamInfo(null);
          setStudentsResults([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isOpen, exam, studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const currentResult = studentsResults[selectedStudentIndex] || null;
  const currentStudent = currentResult?.student || null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" title="">
      {/* Top Toolbar (Hidden during browser print) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-4 border-b border-border print:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-forest" size={22} />
          <div>
            <h2 className="text-base font-bold text-deep">Student Report Card Generator</h2>
            <p className="text-xs text-muted">{exam?.name} — {examInfo?.schoolClass?.name || 'Class'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Student Selector */}
          {studentsResults.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                disabled={selectedStudentIndex <= 0}
                onClick={() => setSelectedStudentIndex((i) => Math.max(0, i - 1))}
                className="p-1.5 rounded-lg border border-border bg-white hover:bg-surface disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <select
                value={selectedStudentIndex}
                onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 font-medium text-deep focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {studentsResults.map((r, idx) => (
                  <option key={r.student?._id || idx} value={idx}>
                    {r.student?.rollNo ? `#${r.student.rollNo} ` : ''}{r.student?.firstName} {r.student?.lastName}
                  </option>
                ))}
              </select>
              <button
                disabled={selectedStudentIndex >= studentsResults.length - 1}
                onClick={() => setSelectedStudentIndex((i) => Math.min(studentsResults.length - 1, i + 1))}
                className="p-1.5 rounded-lg border border-border bg-white hover:bg-surface disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5 text-xs py-1.5">
            <Printer size={14} /> Print Report Card
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-xs text-muted">
          Loading report card data...
        </div>
      ) : !currentResult ? (
        <div className="py-12 text-center text-xs text-muted">
          No result data found for this exam.
        </div>
      ) : (
        /* ── Report Card Printable Area ── */
        <div
          ref={reportCardRef}
          className="print-container bg-white p-6 sm:p-8 rounded-xl border border-border text-deep font-sans relative overflow-hidden shadow-2xs"
        >
          {/* Header Watermark / Pattern */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-forest via-emerald-600 to-forest" />

          {/* School Header */}
          <div className="text-center pb-5 mb-6 border-b border-border/80 relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center font-bold text-lg shadow-sm">
                I
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-deep uppercase tracking-wider">
                {user?.school?.name || 'INSTIQUE ACADEMY OF EXCELLENCE'}
              </h1>
            </div>
            <p className="text-xs uppercase font-semibold tracking-widest text-forest">
              OFFICIAL ACADEMIC PERFORMANCE REPORT
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Academic Session: {examInfo?.academicYear?.name || new Date().getFullYear()}
            </p>
          </div>

          {/* Student Info Card */}
          <div className="bg-surface/60 border border-border rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-muted block font-medium">Student Name</span>
              <span className="font-bold text-deep text-sm">{currentStudent?.firstName} {currentStudent?.lastName}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Admission No</span>
              <span className="font-semibold text-deep">{currentStudent?.admissionNo || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Class & Section</span>
              <span className="font-semibold text-deep">
                {examInfo?.schoolClass?.name || '—'}
                {currentStudent?.section?.name ? ` - ${currentStudent.section.name}` : ''}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Roll Number</span>
              <span className="font-semibold text-deep">{currentStudent?.rollNo || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Examination Name</span>
              <span className="font-semibold text-deep">{examInfo?.name || exam?.name}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Exam Type</span>
              <span className="font-semibold text-deep capitalize">{(examInfo?.type || exam?.type || '').replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Issue Date</span>
              <span className="font-semibold text-deep">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Class Rank</span>
              <span className="font-bold text-forest">
                {currentResult.rank ? `#${currentResult.rank} of ${studentsResults.length}` : '—'}
              </span>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-border text-muted font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3 text-center">Max Marks</th>
                  <th className="py-2.5 px-3 text-center">Pass Marks</th>
                  <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {currentResult.subjects?.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-surface/30">
                    <td className="py-2.5 px-3 text-muted font-mono">{sub.code || `SUB-${idx + 1}`}</td>
                    <td className="py-2.5 px-3 font-semibold text-deep">{sub.name}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-muted">{sub.maxMarks}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-muted">{sub.passMarks}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-deep">
                      {sub.marksObtained !== null ? sub.marksObtained : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {sub.grade ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getGradeColor(sub.grade)}`}>
                          {sub.grade}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {sub.passed === true ? (
                        <span className="text-emerald-600 font-bold">PASS</span>
                      ) : sub.passed === false ? (
                        <span className="text-rose-600 font-bold">FAIL</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface/80 font-bold border-t-2 border-border text-deep">
                  <td colSpan={2} className="py-3 px-3 uppercase text-right tracking-wider text-xs">Total Aggregate</td>
                  <td className="py-3 px-3 text-center">{currentResult.maxTotal}</td>
                  <td className="py-3 px-3 text-center">—</td>
                  <td className="py-3 px-3 text-center text-sm font-black text-forest">
                    {currentResult.totalObtained !== null ? currentResult.totalObtained : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {currentResult.percentage !== null ? `${currentResult.percentage}%` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {getResultBadge(currentResult.result)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Performance Summary & Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Progress Bar & Performance */}
            <div className="bg-surface/40 border border-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-deep">Overall Percentage Score</span>
                <span className="font-extrabold text-forest">{currentResult.percentage !== null ? `${currentResult.percentage}%` : 'N/A'}</span>
              </div>
              <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-border/50">
                <div
                  className={`h-full rounded-full transition-all ${
                    (currentResult.percentage || 0) >= 75
                      ? 'bg-forest'
                      : (currentResult.percentage || 0) >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(currentResult.percentage || 0, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted leading-tight">
                {currentResult.result === 'pass'
                  ? 'Student has successfully cleared all minimum subject standard benchmarks.'
                  : 'Requires additional academic support and targeted re-evaluation in key subjects.'}
              </p>
            </div>

            {/* Grading Scale Legend */}
            <div className="bg-surface/40 border border-border rounded-xl p-3.5 text-[11px]">
              <span className="font-bold text-deep block mb-1">Grading Scale Reference</span>
              <div className="grid grid-cols-4 gap-1 text-muted">
                <span><strong>A+</strong>: ≥90%</span>
                <span><strong>A</strong>: 80-89%</span>
                <span><strong>B+</strong>: 70-79%</span>
                <span><strong>B</strong>: 60-69%</span>
                <span><strong>C</strong>: 50-59%</span>
                <span><strong>D</strong>: 40-49%</span>
                <span><strong>F</strong>: &lt;40%</span>
              </div>
            </div>
          </div>

          {/* Remarks & Signatures Footer */}
          <div className="border-t border-border/80 pt-4 mt-6">
            <div className="mb-6">
              <span className="text-[11px] font-bold text-deep uppercase tracking-wider block mb-1">Class Teacher Remarks:</span>
              <div className="p-2.5 bg-surface/30 border border-border rounded-lg text-xs italic text-secondary">
                {currentResult.percentage >= 85
                  ? 'Exceptional academic performance! Keeps up great discipline and consistency across all subjects.'
                  : currentResult.percentage >= 70
                  ? 'Good effort shown. Possesses high potential for top honors with sustained focus.'
                  : 'Demonstrates steady progress; recommended for focused revision in weak areas.'}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 text-center pt-6 mt-4">
              <div>
                <div className="h-10 border-b border-dashed border-border" />
                <span className="text-[11px] font-bold text-deep block mt-1">Class Teacher</span>
                <span className="text-[10px] text-muted">Signature</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-forest/50 flex items-center justify-center text-[9px] font-bold text-forest uppercase tracking-tighter opacity-80">
                  SEAL STAMP
                </div>
                <span className="text-[10px] text-muted mt-1">Official School Stamp</span>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-border" />
                <span className="text-[11px] font-bold text-deep block mt-1">Principal</span>
                <span className="text-[10px] text-muted">Signature & Date</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Stylesheet CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .modal-overlay, .modal-close {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
}
