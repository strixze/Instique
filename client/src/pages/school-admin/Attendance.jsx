import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckCheck, BarChart3, Users, Send, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { attendanceApi } from '../../api/attendance.api';
import { academicApi } from '../../api/academic.api';

const STATUS_OPTIONS = [
 { key: 'present', label: 'P', color: 'bg-emerald-600 text-white', hoverColor: 'hover:bg-emerald-700' },
 { key: 'absent', label: 'A', color: 'bg-red-600 text-white', hoverColor: 'hover:bg-red-700' },
 { key: 'late', label: 'L', color: 'bg-amber-600 text-white', hoverColor: 'hover:bg-amber-700' },
 { key: 'leave', label: 'V', color: 'bg-info text-white', hoverColor: 'hover:bg-blue-700' },
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
 setData(res.data);
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

 // If attendance already marked, pre-fill statuses
 if (existingRes.data && existingRes.data.students) {
 setExistingRecord(existingRes.data);
 const statusMap = {};
 for (const entry of existingRes.data.students) {
 statusMap[entry.student?.toString() || entry.student] = entry.status;
 }
 // Fill in students not in the saved record as present
 for (const s of students) {
 if (!statusMap[s._id]) statusMap[s._id] = 'present';
 }
 setStudentStatuses(statusMap);
 } else {
 // Default all students to present
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
 // Refresh to show updated state
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

 const historyColumns = [
 { key: 'date', label: 'Date', sortable: true, render: (r) => new Date(r.date).toLocaleDateString() },
 { key: 'schoolClass', label: 'Class', render: (r) => r.schoolClass?.name || classMap[r.schoolClass] || '—' },
 { key: 'section', label: 'Section', render: (r) => r.section?.name || sectionMap[r.section] || '—' },
 { key: 'source', label: 'Source', render: (r) => <Badge color={r.source === 'bulk' ? 'info' : 'gray'}>{r.source || 'manual'}</Badge> },
 { key: 'summary', label: 'Present / Total', render: (r) => `${r.summary?.present ?? 0} / ${r.summary?.total ?? 0}` },
 { key: 'summary2', label: 'Absent', render: (r) => <span className="text-red-400">{r.summary?.absent ?? 0}</span> },
 ];

 const reportStats = [
 { label: 'Total Days', value: report?.totalDays ?? '-' },
 { label: 'Present', value: report?.present ?? '-' },
 { label: 'Absent', value: report?.absent ?? '-' },
 { label: 'Late', value: report?.late ?? '-' },
 { label: 'Leave', value: report?.leave ?? '-' },
 ];

 return (
 <div className="space-y-6">
 <PageHeader
 title="Attendance"
 description="Mark, view, and manage student attendance class-wise and section-wise"
 action={
 <Button variant="outline"onClick={() => setReportOpen(true)}>
 <BarChart3 size={16} className="mr-2"/>View Report
 </Button>
 }
 />

 {/* Tab Switcher */}
 <div className="flex gap-1 p-1 bg-white border border-border rounded-xl w-fit">
 <button
 onClick={() => setActiveTab('mark')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'mark' ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
 >
 <Users size={14} className="inline mr-1.5 -mt-0.5"/>Mark Attendance
 </button>
 <button
 onClick={() => { setActiveTab('history'); setLoading(true); }}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
 >
 History
 </button>
 </div>

 {activeTab === 'mark' ? (
 <div className="space-y-5 animate-scale-in">
 {/* Class / Section / Date selector */}
 <div className="flex flex-wrap items-end gap-3 p-5 bg-white border border-border rounded-2xl">
 <div className="w-44">
 <Input label="Date"type="date"value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
 </div>
 <div className="w-48">
 <Select
 label="Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={markClass}
 onChange={(e) => { setMarkClass(e.target.value); setMarkSection(''); setStudentList([]); }}
 placeholder="Select class..."
 />
 </div>
 <div className="w-48">
 <Select
 label="Section"
 options={filteredSections.map((s) => ({ value: s._id, label: s.name }))}
 value={markSection}
 onChange={(e) => { setMarkSection(e.target.value); setStudentList([]); }}
 placeholder="Select section..."
 />
 </div>
 <Button variant="outline"onClick={loadStudents} disabled={!markClass || !markSection}>
 <RefreshCw size={14} className="mr-1.5"/>Refresh
 </Button>
 </div>

 {/* Student Grid */}
 {loadingStudents ? (
 <div className="flex items-center justify-center py-16 text-muted">
 <RefreshCw size={20} className="animate-spin mr-2"/> Loading students...
 </div>
 ) : studentList.length > 0 ? (
 <div className="bg-white border border-border rounded-2xl overflow-hidden">
 {/* Summary Bar */}
 <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border/60 bg-white/80">
 <div className="flex items-center gap-4 text-sm">
 <span className="text-muted">Total: <strong className="text-deep">{studentList.length}</strong></span>
 <span className="text-emerald-400">Present: <strong>{summaryPresent}</strong></span>
 <span className="text-red-400">Absent: <strong>{summaryAbsent}</strong></span>
 <span className="text-amber-400">Late: <strong>{summaryLate}</strong></span>
 <span className="text-blue-400">Leave: <strong>{summaryLeave}</strong></span>
 </div>
 <div className="flex items-center gap-2">
 {existingRecord && (
 <Badge color="warning">Editing existing record</Badge>
 )}
 <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
 {STATUS_OPTIONS.map((opt) => (
 <button
 key={opt.key}
 onClick={() => markAllAs(opt.key)}
 className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors bg-surface text-secondary ${opt.hoverColor}`}
 title={`Mark all as ${opt.key}`}
 >
 All {opt.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Student Rows */}
 <div className="max-h-[500px] overflow-y-auto">
 <table className="w-full">
 <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
 <tr className="text-xs text-muted uppercase tracking-wider">
 <th className="text-left px-5 py-3 w-10">#</th>
 <th className="text-left px-3 py-3">Student Name</th>
 <th className="text-left px-3 py-3 w-32">Admission No</th>
 <th className="text-center px-3 py-3 w-56">Status</th>
 </tr>
 </thead>
 <tbody>
 {studentList.map((student, idx) => {
 const currentStatus = studentStatuses[student._id] || 'present';
 return (
 <tr
 key={student._id}
 className="border-t border-border/40 hover:bg-surface/20 transition-colors"
 >
 <td className="px-5 py-3 text-muted text-sm">{idx + 1}</td>
 <td className="px-3 py-3 font-medium text-deep">{student.firstName} {student.lastName}</td>
 <td className="px-3 py-3 text-muted text-sm">{student.admissionNo || student.rollNo || '—'}</td>
 <td className="px-3 py-3">
 <div className="flex items-center justify-center gap-1.5">
 {STATUS_OPTIONS.map((opt) => (
 <button
 key={opt.key}
 onClick={() => setStudentStatus(student._id, opt.key)}
 className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150 border ${
 currentStatus === opt.key
 ? `${opt.color} border-transparent shadow-lg scale-110`
 : 'bg-white text-muted border-border hover:border-forest/40'
 }`}
 title={opt.key.charAt(0).toUpperCase() + opt.key.slice(1)}
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

 {/* Submit bar */}
 <div className="px-5 py-4 border-t border-border/60 bg-white/80 flex items-center justify-between">
 <p className="text-xs text-muted">
 {existingRecord
 ? `Last marked on ${new Date(existingRecord.updatedAt || existingRecord.createdAt).toLocaleString()}`
 : 'No attendance record exists for this date yet'}
 </p>
 <Button onClick={handleSubmitAttendance} loading={submitting}>
 <Send size={14} className="mr-2"/>
 {existingRecord ? 'Update Attendance' : 'Submit Attendance'}
 </Button>
 </div>
 </div>
 ) : markClass && markSection ? (
 <div className="flex flex-col items-center justify-center py-16 text-muted bg-white border border-border rounded-2xl">
 <Users size={40} className="text-muted mb-3"/>
 <p className="font-medium text-secondary">No students found</p>
 <p className="text-sm mt-1">No active students are assigned to this class and section.</p>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-16 text-muted bg-white border border-border rounded-2xl">
 <CheckCheck size={40} className="text-muted mb-3"/>
 <p className="font-medium text-secondary">Select class & section to begin</p>
 <p className="text-sm mt-1">Choose a date, class, and section above to load the student list.</p>
 </div>
 )}
 </div>
 ) : (
 /* History Tab */
 <div className="space-y-4 animate-scale-in">
 <div className="flex flex-wrap items-end gap-3 p-4 bg-white border border-border rounded-xl">
 <div className="w-44">
 <Input label="Date"type="date"value={date} onChange={(e) => { setLoading(true); setDate(e.target.value); }} />
 </div>
 <div className="w-44">
 <Select
 label="Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={classFilter}
 onChange={(e) => { setLoading(true); setClassFilter(e.target.value); }}
 />
 </div>
 <Button onClick={() => { setLoading(true); setPage(1); setFilterActive((v) => !v); }}>Apply Filter</Button>
 </div>
 <DataTable
 columns={historyColumns}
 data={data}
 loading={loading}
 meta={meta}
 onPageChange={(p) => { setLoading(true); setPage(p); }}
 onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
 searchPlaceholder="Search attendance..."
 />
 </div>
 )}

 {/* Report Modal */}
 <Modal isOpen={reportOpen} onClose={() => { setReportOpen(false); setReport(null); }} title="Attendance Report">
 <div className="space-y-4">
 <Select
 label="Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={reportForm.classId}
 onChange={(e) => setReportForm((f) => ({ ...f, classId: e.target.value }))}
 />
 <div className="grid grid-cols-2 gap-4">
 <Input label="Start date"type="date"value={reportForm.startDate} onChange={(e) => setReportForm((f) => ({ ...f, startDate: e.target.value }))} />
 <Input label="End date"type="date"value={reportForm.endDate} onChange={(e) => setReportForm((f) => ({ ...f, endDate: e.target.value }))} />
 </div>
 <Button onClick={handleReport} loading={reportLoading} className="w-full">Generate Report</Button>

 {report && (
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
 {reportStats.map((s) => (
 <div key={s.label} className="p-3 bg-sage-soft rounded-lg text-center">
 <p className="text-xl font-bold text-deep">{s.value}</p>
 <p className="text-xs text-muted">{s.label}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </Modal>
 </div>
 );
}
