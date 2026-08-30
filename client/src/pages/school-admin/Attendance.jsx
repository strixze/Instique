import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCheck, BarChart3, Users, Send, RefreshCw, Calendar, Search, Filter, RotateCcw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { attendanceApi } from '../../api/attendance.api';
import { academicApi } from '../../api/academic.api';
import { studentApi } from '../../api/student.api';
import UserAvatar from '../../components/ui/UserAvatar';

const STATUS_OPTIONS = [
  { key: 'present', label: 'P', color: 'bg-emerald-600 text-white', hoverColor: 'hover:bg-emerald-700' },
  { key: 'absent', label: 'A', color: 'bg-rose-600 text-white', hoverColor: 'hover:bg-rose-700' },
  { key: 'late', label: 'L', color: 'bg-amber-600 text-white', hoverColor: 'hover:bg-amber-700' },
  { key: 'leave', label: 'V', color: 'bg-blue-600 text-white', hoverColor: 'hover:bg-blue-700' },
];

export default function Attendance() {
  // History tab state
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Entities
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Filters
  const [date, setDate] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  // Active tab: 'history' | 'mark'
  const [activeTab, setActiveTab] = useState('mark');

  // Mark Attendance state
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markClass, setMarkClass] = useState('');
  const [markSection, setMarkSection] = useState('');
  const [studentList, setStudentList] = useState([]);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportForm, setReportForm] = useState({ classId: '', startDate: '', endDate: '' });
  const [report, setReport] = useState(null);

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
    academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
  }, []);

  // Load attendance history
  useEffect(() => {
    if (activeTab !== 'history') return;
    let active = true;
    const load = async () => {
      try {
        const res = await attendanceApi.getAll({
          page,
          limit: 10,
          search: search || undefined,
          filter: {
            ...(filterActive && date ? { date } : {}),
            ...(filterActive && classFilter ? { schoolClass: classFilter } : {}),
          },
        });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load attendance');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, filterActive, date, classFilter, activeTab]);

  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));
  const filteredSections = sections.filter((s) => !markClass || s.schoolClass === markClass);

  // Load students when class + section are selected
  const loadStudents = useCallback(async () => {
    if (!markClass || !markSection || !markDate) return;
    setLoadingStudents(true);
    setStudentList([]);
    setStudentStatuses({});
    setExistingRecord(null);

    try {
      const [studentsRes, existingRes] = await Promise.all([
        attendanceApi.getStudentsByClassSection({ classId: markClass, sectionId: markSection }),
        attendanceApi.getAttendanceForDate({ classId: markClass, sectionId: markSection, date: markDate }),
      ]);

      const students = studentsRes.data || [];
      setStudentList(students);

      if (existingRes.data && existingRes.data.students) {
        setExistingRecord(existingRes.data);
        const statusMap = {};
        for (const entry of existingRes.data.students) {
          statusMap[entry.student?.toString() || entry.student] = entry.status;
        }
        for (const s of students) {
          if (!statusMap[s._id]) statusMap[s._id] = 'present';
        }
        setStudentStatuses(statusMap);
      } else {
        const defaultStatuses = {};
        for (const s of students) {
          defaultStatuses[s._id] = 'present';
        }
        setStudentStatuses(defaultStatuses);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  }, [markClass, markSection, markDate]);

  useEffect(() => {
    if (markClass && markSection && markDate) {
      loadStudents();
    }
  }, [markClass, markSection, markDate, loadStudents]);

  const setStudentStatus = (studentId, status) => {
    setStudentStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllAs = (status) => {
    const updated = {};
    for (const s of studentList) {
      updated[s._id] = status;
    }
    setStudentStatuses(updated);
  };

  const handleSubmitAttendance = async () => {
    if (studentList.length === 0) {
      toast.error('No students to mark attendance for');
      return;
    }
    setSubmitting(true);
    try {
      const students = studentList.map((s) => ({
        student: s._id,
        status: studentStatuses[s._id] || 'present',
      }));

      await attendanceApi.mark({
        date: markDate,
        schoolClass: markClass,
        section: markSection,
        students,
      });

      toast.success(existingRecord ? 'Attendance updated successfully' : 'Attendance submitted successfully');
      setReload((r) => r + 1);
      loadStudents();
    } catch (e) {
      toast.error(e?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportForm.classId || !reportForm.startDate || !reportForm.endDate) {
      toast.error('Please fill all report fields');
      return;
    }
    setReportLoading(true);
    try {
      const res = await attendanceApi.getReport({
        classId: reportForm.classId,
        startDate: reportForm.startDate,
        endDate: reportForm.endDate,
      });
      setReport(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  // Summary counts
  const summaryPresent = Object.values(studentStatuses).filter((s) => s === 'present').length;
  const summaryAbsent = Object.values(studentStatuses).filter((s) => s === 'absent').length;
  const summaryLate = Object.values(studentStatuses).filter((s) => s === 'late').length;
  const summaryLeave = Object.values(studentStatuses).filter((s) => s === 'leave').length;

  const reportStats = [
    { label: 'Total Days', value: report?.totalDays ?? '-' },
    { label: 'Present', value: report?.present ?? '-' },
    { label: 'Absent', value: report?.absent ?? '-' },
    { label: 'Late', value: report?.late ?? '-' },
    { label: 'Leave', value: report?.leave ?? '-' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep tracking-tight">Attendance</h1>
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            Mark, view, and track daily student attendance class-wise and section-wise.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="gap-1.5 text-xs shrink-0">
          <BarChart3 size={14} /> View Attendance Report
        </Button>
      </div>

      {/* Tab Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-border rounded-xl w-fit shadow-2xs">
        <button
          onClick={() => setActiveTab('mark')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'mark'
              ? 'bg-forest text-white shadow-2xs'
              : 'text-secondary hover:bg-surface hover:text-deep font-medium'
          }`}
        >
          <Users size={13} className="inline mr-1.5 -mt-0.5" /> Mark Attendance
        </button>
        <button
          onClick={() => { setActiveTab('history'); setLoading(true); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-forest text-white shadow-2xs'
              : 'text-secondary hover:bg-surface hover:text-deep font-medium'
          }`}
        >
          Attendance History
        </button>
      </div>

      {activeTab === 'mark' ? (
        <div className="space-y-4 animate-scale-in">
          {/* Class / Section / Date selector Toolbar */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="w-40">
              <span className="font-semibold text-secondary text-xs block mb-1">Date</span>
              <input
                type="date"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div className="w-44">
              <span className="font-semibold text-secondary text-xs block mb-1">Class</span>
              <select
                value={markClass}
                onChange={(e) => { setMarkClass(e.target.value); setMarkSection(''); setStudentList([]); }}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">Select class...</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <span className="font-semibold text-secondary text-xs block mb-1">Section</span>
              <select
                value={markSection}
                onChange={(e) => { setMarkSection(e.target.value); setStudentList([]); }}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">Select section...</option>
                {filteredSections.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={loadStudents} disabled={!markClass || !markSection} className="text-xs gap-1.5">
                <RefreshCw size={13} /> Refresh
              </Button>
            </div>
          </div>

          {/* Student Grid Container */}
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted bg-white border border-border rounded-xl">
              <RefreshCw size={18} className="animate-spin mr-2" /> Loading student roster...
            </div>
          ) : studentList.length > 0 ? (
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
              {/* Summary Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface/60">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-secondary font-medium">Total: <strong className="text-deep">{studentList.length}</strong></span>
                  <span className="text-emerald-700 font-medium">Present: <strong>{summaryPresent}</strong></span>
                  <span className="text-rose-700 font-medium">Absent: <strong>{summaryAbsent}</strong></span>
                  <span className="text-amber-700 font-medium">Late: <strong>{summaryLate}</strong></span>
                  <span className="text-blue-700 font-medium">Leave: <strong>{summaryLeave}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  {existingRecord && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Editing existing record
                    </span>
                  )}
                  <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-0.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => markAllAs(opt.key)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-colors hover:bg-surface text-secondary`}
                      >
                        All {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student Rows Table */}
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-surface/90 backdrop-blur-sm border-b border-border">
                    <tr className="text-secondary uppercase font-semibold">
                      <th className="px-4 py-2.5 w-10">#</th>
                      <th className="px-4 py-2.5">Student Name</th>
                      <th className="px-4 py-2.5 w-36">Admission No</th>
                      <th className="px-4 py-2.5 text-center w-60">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {studentList.map((student, idx) => {
                      const currentStatus = studentStatuses[student._id] || 'present';
                      return (
                        <tr key={student._id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-4 py-2.5 text-muted font-mono">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar
                                type="student"
                                gender={student.gender}
                                id={student._id}
                                admissionNo={student.admissionNo}
                                name={`${student.firstName} ${student.lastName}`}
                                size="sm"
                                className="shrink-0 ring-1 ring-border/50"
                              />
                              <span className="font-bold text-deep">{student.firstName} {student.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-muted font-mono">{student.admissionNo || student.rollNo || '—'}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => setStudentStatus(student._id, opt.key)}
                                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                                    currentStatus === opt.key
                                      ? `${opt.color} border-transparent shadow-2xs scale-105`
                                      : 'bg-white text-secondary border-border hover:border-forest/40'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submit footer */}
              <div className="px-4 py-3 border-t border-border bg-surface/30 flex items-center justify-between">
                <p className="text-xs text-muted">
                  {existingRecord
                    ? `Last recorded on ${new Date(existingRecord.updatedAt || existingRecord.createdAt).toLocaleString()}`
                    : 'No attendance saved for this date yet'}
                </p>
                <Button onClick={handleSubmitAttendance} loading={submitting} className="text-xs gap-1.5">
                  <Send size={13} /> {existingRecord ? 'Update Attendance' : 'Submit Attendance'}
                </Button>
              </div>
            </div>
          ) : markClass && markSection ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted bg-white border border-border rounded-xl">
              <Users size={36} className="text-muted mb-2" />
              <p className="font-semibold text-secondary text-sm">No students found</p>
              <p className="text-xs mt-0.5">No active students enrolled in this class and section.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted bg-white border border-border rounded-xl">
              <CheckCheck size={36} className="text-muted mb-2" />
              <p className="font-semibold text-secondary text-sm">Select class & section to begin</p>
              <p className="text-xs mt-0.5">Pick a date, class, and section above to load the student roster.</p>
            </div>
          )}
        </div>
      ) : (
        /* History Tab (Admissions pattern) */
        <div className="space-y-4 animate-scale-in">
          <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="w-40">
              <span className="font-semibold text-secondary text-xs block mb-1">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => { setLoading(true); setDate(e.target.value); }}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>
            <div className="w-44">
              <span className="font-semibold text-secondary text-xs block mb-1">Class</span>
              <select
                value={classFilter}
                onChange={(e) => { setLoading(true); setClassFilter(e.target.value); }}
                className="w-full px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-5">
              <Button onClick={() => { setLoading(true); setPage(1); setFilterActive((v) => !v); }} className="text-xs gap-1.5">
                <Filter size={13} /> Apply Filter
              </Button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/70 text-secondary uppercase font-semibold">
                    <th className="px-3.5 py-2.5">DATE</th>
                    <th className="px-3.5 py-2.5">CLASS</th>
                    <th className="px-3.5 py-2.5">SECTION</th>
                    <th className="px-3.5 py-2.5">SOURCE</th>
                    <th className="px-3.5 py-2.5">PRESENT / TOTAL</th>
                    <th className="px-3.5 py-2.5">ABSENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i}><td colSpan={6} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                    ))
                  ) : data.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No attendance logs found.</td></tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row._id} className="hover:bg-surface/30">
                        <td className="px-3.5 py-2.5 font-bold text-deep">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="px-3.5 py-2.5 text-secondary">{row.schoolClass?.name || classMap[row.schoolClass] || '—'}</td>
                        <td className="px-3.5 py-2.5 text-secondary">{row.section?.name || sectionMap[row.section] || '—'}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 capitalize">
                            {row.source || 'manual'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-deep">{row.summary?.present ?? 0} / {row.summary?.total ?? 0}</td>
                        <td className="px-3.5 py-2.5 font-semibold text-rose-600">{row.summary?.absent ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-surface/30">
                <span className="text-xs text-muted">Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={loading || !meta.hasPrevPage} onClick={() => setPage(meta.page - 1)} className="p-1 px-2 text-xs"><ChevronLeft size={14} /></Button>
                  <Button variant="outline" size="sm" disabled={loading || !meta.hasNextPage} onClick={() => setPage(meta.page + 1)} className="p-1 px-2 text-xs"><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Modal isOpen={reportOpen} onClose={() => { setReportOpen(false); setReport(null); }} title="Attendance Summary Report">
        <div className="space-y-4">
          <Select
            label="Class *"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={reportForm.classId}
            onChange={(e) => setReportForm((f) => ({ ...f, classId: e.target.value }))}
            placeholder="Select class"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date *" type="date" value={reportForm.startDate} onChange={(e) => setReportForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="End date *" type="date" value={reportForm.endDate} onChange={(e) => setReportForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <Button onClick={handleReport} loading={reportLoading} className="w-full">Generate Report</Button>

          {report && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {reportStats.map((s) => (
                <div key={s.label} className="p-3 bg-surface/60 border border-border rounded-xl text-center">
                  <p className="text-xl font-bold text-deep">{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
