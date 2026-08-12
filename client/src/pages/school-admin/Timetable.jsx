import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
 Plus, Trash2, Eye, Send, Lock, Unlock, Download, RotateCcw,
 BarChart3, RefreshCw, Layers, Edit2, AlertCircle, FileText, CheckCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { timetableApi } from '../../api/timetable.api';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DAYS = [
 { value: 1, label: 'Monday' },
 { value: 2, label: 'Tuesday' },
 { value: 3, label: 'Wednesday' },
 { value: 4, label: 'Thursday' },
 { value: 5, label: 'Friday' },
 { value: 6, label: 'Saturday' },
 { value: 0, label: 'Sunday' },
];

export default function Timetable() {
 // Navigation & Lists
 const [timetables, setTimetables] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);

 // Entities
 const [classes, setClasses] = useState([]);
 const [sections, setSections] = useState([]);
 const [years, setYears] = useState([]);
 const [teachers, setTeachers] = useState([]);
 const [subjects, setSubjects] = useState([]);

 // Generate / Config Modal
 const [openGen, setOpenGen] = useState(false);
 const [generating, setGenerating] = useState(false);
 const [form, setForm] = useState({ schoolClass: '', section: '', academicYear: '' });

 // Grid Editor State
 const [activeTimetable, setActiveTimetable] = useState(null);
 const [gridPeriods, setGridPeriods] = useState([]);
 const [configSnapshot, setConfigSnapshot] = useState(null);
 const [conflicts, setConflicts] = useState([]);
 const [history, setHistory] = useState([]);
 const [historyIndex, setHistoryIndex] = useState(-1);
 const [saving, setSaving] = useState(false);
 const [activeView, setActiveView] = useState('class'); // class | teacher | subject | daily
 const [viewEntityId, setViewEntityId] = useState(''); // Selected teacher or subject id for respective views

 // Edit Cell Modal
 const [editCell, setEditCell] = useState(null); // { day, periodNo, subject, teacher, room }
 const [cellForm, setCellForm] = useState({ subject: '', teacher: '', room: '' });

 // Reports
 const [workloadReport, setWorkloadReport] = useState([]);
 const [distributionReport, setDistributionReport] = useState([]);
 const [showReports, setShowReports] = useState(false);

 // Bulk generation results
 const [bulkResults, setBulkResults] = useState(null);
 const [showBulkResults, setShowBulkResults] = useState(false);

 // Drag and drop state
 const [draggedPeriod, setDraggedPeriod] = useState(null); // { day, periodNo }

 useEffect(() => {
 academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
 academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
 academicApi.getAcademicYears({ limit: 100 }).then((res) => setYears(res.data)).catch(() => {});
 teacherApi.getAll({ limit: 100 }).then((res) => setTeachers(res.data)).catch(() => {});
 academicApi.getSubjects({ limit: 100 }).then((res) => setSubjects(res.data)).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await timetableApi.getAll({ page, limit: 10 });
 if (!active) return;
 setTimetables(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load timetables');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 // Maps for display
 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
 const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));
 const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));

 // History tracking
 const pushToHistory = (periods) => {
 const nextHistory = history.slice(0, historyIndex + 1);
 nextHistory.push(JSON.parse(JSON.stringify(periods)));
 setHistory(nextHistory);
 setHistoryIndex(nextHistory.length - 1);
 };

 const undo = () => {
 if (historyIndex > 0) {
 const idx = historyIndex - 1;
 setHistoryIndex(idx);
 setGridPeriods(JSON.parse(JSON.stringify(history[idx])));
 }
 };

 const redo = () => {
 if (historyIndex < history.length - 1) {
 const idx = historyIndex + 1;
 setHistoryIndex(idx);
 setGridPeriods(JSON.parse(JSON.stringify(history[idx])));
 }
 };

 // APIs
 const handleGenerate = async () => {
   if (!form.schoolClass || !form.section || !form.academicYear) {
     toast.error('Please select class, section, and academic year');
     return;
   }
   setGenerating(true);
   try {
     const res = await timetableApi.generate({
       schoolClass: form.schoolClass,
       section: form.section,
       academicYear: form.academicYear,
     });
     const timetable = res.data.timetable;
     const hasErrors = timetable?.generationLog?.some(l => l.severity === 'error');
     
     if (hasErrors) {
       toast.error('Timetable generated with conflicts. Review Conflict Logs in the sidebar.');
     } else {
       toast.success('Timetable generated successfully');
     }
     setOpenGen(false);
     setReload((r) => r + 1);
     openEditor(timetable);
   } catch (e) {
     toast.error(e?.message || 'Generation failed');
   } finally {
     setGenerating(false);
   }
 };

 const handleBulkGenerate = async () => {
 if (!form.academicYear) {
 toast.error('Please select an Academic Year');
 return;
 }
 setGenerating(true);
 const loadToast = toast.loading('Generating timetables for all classes... This may take a moment.');
 try {
 const res = await timetableApi.generateBulk({ academicYear: form.academicYear });
 toast.dismiss(loadToast);
 const data = res.data;

 setBulkResults(data);
 setOpenGen(false);
 setShowBulkResults(true);
 setLoading(true);
 setReload((r) => r + 1);

 if (data.phase === 'pre-validation') {
 toast.error(`Pre-validation failed: ${data.preValidationErrors?.length || 0} issue(s) found. Fix them before generating.`);
 } else if (data.summary?.failed > 0) {
 toast.error(`Generation completed with ${data.summary.failed} failure(s).`);
 } else {
 toast.success(`Successfully generated ${data.summary?.generated || 0} timetable(s)!`);
 }
 } catch (e) {
 toast.dismiss(loadToast);
 toast.error(e?.message || 'Bulk generation failed');
 } finally {
 setGenerating(false);
 }
 };

 const openEditor = async (timetable) => {
 setActiveTimetable(timetable);
 setGridPeriods(timetable.periods || []);
 setConfigSnapshot(timetable.configSnapshot || {});
 setConflicts(timetable.generationLog || []);
 setHistory([JSON.parse(JSON.stringify(timetable.periods || []))]);
 setHistoryIndex(0);
 setActiveView('class');
 setViewEntityId('');
 };

 const saveDraft = async () => {
 if (!activeTimetable) return;
 setSaving(true);
 try {
 const res = await timetableApi.updatePeriods(activeTimetable._id, gridPeriods);
 setConflicts(res.data.conflicts || []);
 toast.success('Timetable draft saved');
 } catch (e) {
 toast.error(e?.message || 'Failed to save draft');
 if (e?.errors) {
 setConflicts(e.errors);
 }
 } finally {
 setSaving(false);
 }
 };

 const handlePublish = async (timetable) => {
 const nextStatus = timetable.status === 'published' ? 'draft' : 'published';
 try {
 await timetableApi.publish(timetable._id, nextStatus);
 toast.success(`Timetable status updated to ${nextStatus}`);
 if (activeTimetable && activeTimetable._id === timetable._id) {
 setActiveTimetable((prev) => ({ ...prev, status: nextStatus }));
 }
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to update timetable');
 }
 };

 const handleDelete = (timetable) => {
 Swal.fire({
 title: 'Delete timetable?',
 text: 'This timetable will be permanently removed.',
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await timetableApi.delete(timetable._id);
 toast.success('Timetable deleted');
 if (activeTimetable && activeTimetable._id === timetable._id) {
 setActiveTimetable(null);
 }
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete timetable');
 }
 });
 };

 const handlePartialRegenerate = async () => {
 if (!activeTimetable) return;
 setGenerating(true);
 try {
 // Save current locked state first
 const lockedPeriods = gridPeriods
 .filter((p) => p.isLocked)
 .map((p) => ({ day: p.day, periodNo: p.periodNo }));
 await timetableApi.lockPeriods(activeTimetable._id, { lockedPeriods });

 const res = await timetableApi.regeneratePartial(activeTimetable._id);
 setGridPeriods(res.data.timetable.periods);
 setConflicts(res.data.conflicts || []);
 pushToHistory(res.data.timetable.periods);
 toast.success('Regenerated unlocked slots');
 } catch (e) {
 toast.error(e?.message || 'Regeneration failed');
 } finally {
 setGenerating(false);
 }
 };

 // Drag and drop event handlers
 const handleDragStart = (e, period) => {
 if (period.isLocked || period.isLunch || period.isBreak || period.isAssembly || period.isFixed) {
 e.preventDefault();
 return;
 }
 setDraggedPeriod(period);
 };

 const handleDragOver = (e) => {
 e.preventDefault();
 };

 const handleDrop = async (e, targetPeriod) => {
 e.preventDefault();
 if (!draggedPeriod || !activeTimetable) return;
 if (targetPeriod.isLocked || targetPeriod.isLunch || targetPeriod.isBreak || targetPeriod.isAssembly || targetPeriod.isFixed) {
 return;
 }

 try {
 // API call to swap
 const res = await timetableApi.swapPeriods(activeTimetable._id, {
 sourceDay: draggedPeriod.day,
 sourcePeriodNo: draggedPeriod.periodNo,
 targetDay: targetPeriod.day,
 targetPeriodNo: targetPeriod.periodNo,
 });

 setGridPeriods(res.data.timetable.periods);
 setConflicts(res.data.conflicts || []);
 pushToHistory(res.data.timetable.periods);
 toast.success('Periods swapped successfully');
 } catch (err) {
 toast.error(err?.message || 'Cannot swap: hard constraint violation');
 if (err?.errors) setConflicts(err.errors);
 } finally {
 setDraggedPeriod(null);
 }
 };

 // Lock toggle
 const toggleLock = async (period) => {
 if (period.isLunch || period.isBreak || period.isAssembly || period.isFixed) return;
 
 const updated = gridPeriods.map((p) => {
 if (p.day === period.day && p.periodNo === period.periodNo) {
 return { ...p, isLocked: !p.isLocked };
 }
 return p;
 });

 setGridPeriods(updated);
 pushToHistory(updated);

 try {
 const lockedPeriods = updated
 .filter((p) => p.isLocked)
 .map((p) => ({ day: p.day, periodNo: p.periodNo }));
 await timetableApi.lockPeriods(activeTimetable._id, { lockedPeriods });
 } catch (e) {
 toast.error('Failed to update lock state on server');
 }
 };

 // Edit Single Cell Modal actions
 const openEditCell = (period) => {
 if (period.isLunch || period.isBreak || period.isAssembly || period.isFixed) return;
 setEditCell(period);
 setCellForm({
 subject: period.subject?._id || period.subject || '',
 teacher: period.teacher?._id || period.teacher || '',
 room: period.room || '',
 });
 };

 const handleCellSave = async () => {
 if (!activeTimetable || !editCell) return;
 try {
 const res = await timetableApi.manualEdit(activeTimetable._id, {
 day: editCell.day,
 periodNo: editCell.periodNo,
 subject: cellForm.subject || null,
 teacher: cellForm.teacher || null,
 room: cellForm.room,
 });

 setGridPeriods(res.data.timetable.periods);
 setConflicts(res.data.conflicts || []);
 pushToHistory(res.data.timetable.periods);
 setEditCell(null);
 toast.success('Cell updated successfully');
 } catch (err) {
 toast.error(err?.message || 'Edit failed: constraint violation');
 if (err?.errors) setConflicts(err.errors);
 }
 };

 // Reports fetching
 const loadReports = async () => {
 if (!activeTimetable) return;
 try {
 const resW = await timetableApi.getTeacherWorkloadReport(activeTimetable.academicYear._id || activeTimetable.academicYear);
 const resD = await timetableApi.getSubjectDistributionReport(activeTimetable.academicYear._id || activeTimetable.academicYear);
 setWorkloadReport(resW.data || []);
 setDistributionReport(resD.data || []);
 setShowReports(true);
 } catch (e) {
 toast.error('Failed to load reports');
 }
 };

 // Export functions
 const downloadPdf = () => {
 if (!activeTimetable) return;
 window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/timetables/${activeTimetable._id}/export/pdf`, '_blank');
 };

 const downloadExcel = () => {
 if (!activeTimetable) return;
 window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/timetables/${activeTimetable._id}/export/excel`, '_blank');
 };

 // Custom multi-views filters
 const getDisplayPeriods = () => {
 if (activeView === 'class') return gridPeriods;

 if (activeView === 'teacher' && viewEntityId) {
 // Find periods of this teacher across this timetable
 return gridPeriods.map((p) => {
 const isMatch = p.teacher?._id === viewEntityId || p.teacher === viewEntityId;
 if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) return p;
 return isMatch ? p : { ...p, subject: null, teacher: null, room: '' };
 });
 }

 if (activeView === 'subject' && viewEntityId) {
 return gridPeriods.map((p) => {
 const isMatch = p.subject?._id === viewEntityId || p.subject === viewEntityId;
 if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) return p;
 return isMatch ? p : { ...p, subject: null, teacher: null, room: '' };
 });
 }

 return gridPeriods;
 };

 const getSubjectColorClass = (subject) => {
 if (!subject) return 'bg-white/40 border-border text-muted';
 const cat = subject.category || 'academic';
 
 switch (cat) {
 case 'academic': return 'bg-sage /50 text-forest';
 case 'sports': return 'bg-emerald-950/45 border-emerald-700/50 text-emerald-300';
 case 'arts': return 'bg-amber-950/45 border-amber-700/50 text-amber-300';
 case 'activity': return 'bg-rose-950/45 border-rose-700/50 text-rose-300';
 default: return 'bg-white border-border text-secondary';
 }
 };

 // Table lists columns
 const listColumns = [
 { key: 'class', label: 'Class', render: (r) => r.schoolClass?.name || classMap[r.schoolClass?._id || r.schoolClass] || '—' },
 { key: 'section', label: 'Section', render: (r) => r.section?.name || sectionMap[r.section?._id || r.section] || '—' },
 { key: 'academicYear', label: 'Academic Year', render: (r) => r.academicYear?.name || yearMap[r.academicYear?._id || r.academicYear] || '—' },
 { key: 'periods', label: 'Periods', render: (r) => Array.isArray(r.periods) ? r.periods.length : '—' },
 { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'published' ? 'success' : 'warning'}>{r.status}</Badge> },
 {
 key: 'actions',
 label: 'Actions',
 render: (r) => (
 <div className="flex items-center gap-2">
 <Button size="sm"variant="ghost"onClick={() => openEditor(r)} title="Edit Timetable">
 <Edit2 size={14} className="mr-1"/> Edit
 </Button>
 <Button size="sm"variant="outline"onClick={() => handlePublish(r)} title={r.status === 'published' ? 'Unpublish' : 'Publish'}>
 <Send size={14} className="mr-1"/> {r.status === 'published' ? 'Draft' : 'Publish'}
 </Button>
 <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"title="Delete">
 <Trash2 size={14} />
 </button>
 </div>
 ),
 },
 ];

 const maxPeriods = configSnapshot?.periodsPerDay || activeTimetable?.totalPeriodsPerDay || 8;
 const workingDays = configSnapshot?.workingDays || [1, 2, 3, 4, 5];

 const filteredSections = sections.filter((s) => !form.schoolClass || s.schoolClass === form.schoolClass);

 return (
 <div className="space-y-6 pb-12">
 <PageHeader
 title="Timetable Manager"
 description="Configure constraints, auto-generate schedules, and perform drag & drop adjustments."
 action={
 <div className="flex gap-3">
 <Button onClick={() => setOpenGen(true)}>
 <Plus size={16} className="mr-2"/> Generate Timetable
 </Button>
 </div>
 }
 />

 {/* Editor Workspace */}
 {activeTimetable ? (
 <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-scale-in">
 {/* Main Grid */}
 <div className="xl:col-span-3 space-y-4">
 <div className="bg-white border border-border rounded-2xl p-5 shadow-2xl space-y-4">
 {/* Toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
 <div>
 <h2 className="text-lg font-bold text-deep flex items-center gap-2">
 <Layers size={18} className="text-forest"/>
 {classMap[activeTimetable.schoolClass._id || activeTimetable.schoolClass]} -{' '}
 {sectionMap[activeTimetable.section._id || activeTimetable.section]}
 <Badge color={activeTimetable.status === 'published' ? 'success' : 'warning'}>
 {activeTimetable.status}
 </Badge>
 </h2>
 <p className="text-xs text-muted mt-0.5">
 Academic Year: {yearMap[activeTimetable.academicYear._id || activeTimetable.academicYear]}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {/* Views Selectors */}
 <Select
 className="w-36 bg-white border-border py-1"
 options={[
 { value: 'class', label: 'Class View' },
 { value: 'teacher', label: 'Teacher View' },
 { value: 'subject', label: 'Subject View' },
 ]}
 value={activeView}
 onChange={(e) => {
 setActiveView(e.target.value);
 setViewEntityId('');
 }}
 />

 {activeView === 'teacher' && (
 <Select
 className="w-48 bg-white border-border py-1"
 options={teachers.map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))}
 value={viewEntityId}
 onChange={(e) => setViewEntityId(e.target.value)}
 placeholder="Select Teacher"
 />
 )}

 {activeView === 'subject' && (
 <Select
 className="w-48 bg-white border-border py-1"
 options={subjects.map((s) => ({ value: s._id, label: s.name }))}
 value={viewEntityId}
 onChange={(e) => setViewEntityId(e.target.value)}
 placeholder="Select Subject"
 />
 )}

 <div className="h-6 w-[1px] bg-surface mx-1 hidden sm:block"></div>

 <Button size="sm"variant="ghost"onClick={undo} disabled={historyIndex <= 0} title="Undo">
 <RotateCcw size={15} className="transform rotate-45"/>
 </Button>
 <Button size="sm"variant="ghost"onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
 <RotateCcw size={15} className="transform -scale-x-100 rotate-45"/>
 </Button>
 <Button size="sm"variant="outline"onClick={handlePartialRegenerate} loading={generating} title="Regenerate unlocked slots">
 <RefreshCw size={14} className="mr-1"/> Re-gen Unlocked
 </Button>
 <Button size="sm"variant="outline"onClick={loadReports} title="Open analytical reports">
 <BarChart3 size={14} className="mr-1"/> Analytics
 </Button>
 <Button size="sm"onClick={saveDraft} loading={saving}>
 Save Draft
 </Button>

 <div className="flex items-center gap-1 bg-white/60 p-1 border border-border/60 rounded-lg">
 <button onClick={downloadPdf} className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-white"title="Export PDF">
 <Download size={14} />
 </button>
 <button onClick={downloadExcel} className="p-1.5 text-muted hover:text-success rounded-lg hover:bg-white"title="Export Excel">
 <FileText size={14} />
 </button>
 </div>
 </div>
 </div>

 {/* Grid representation */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm border-collapse min-w-[700px]">
 <thead>
 <tr className="border-b border-border/60">
 <th className="px-3 py-2.5 text-left text-xs font-bold text-muted uppercase tracking-wider w-20">Period</th>
 {workingDays.map((d) => (
 <th key={d} className="px-3 py-2.5 text-center text-xs font-bold text-muted uppercase tracking-wider">
 {DAYS.find((day) => day.value === d)?.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {Array.from({ length: maxPeriods }).map((_, idx) => {
 const pNo = idx + 1;
 return (
 <tr key={idx} className="hover:bg-white/10">
 <td className="px-3 py-4 font-bold text-muted border-r border-border/40">
 <div>P{pNo}</div>
 {configSnapshot?.periodTimings?.find((t) => t.periodNo === pNo) && (
 <div className="text-[10px] text-muted font-normal mt-0.5">
 {configSnapshot.periodTimings.find((t) => t.periodNo === pNo).startTime} -{' '}
 {configSnapshot.periodTimings.find((t) => t.periodNo === pNo).endTime}
 </div>
 )}
 </td>
 {workingDays.map((d) => {
 const p = getDisplayPeriods().find((item) => item.day === d && item.periodNo === pNo);
 const isCellDragged = draggedPeriod?.day === d && draggedPeriod?.periodNo === pNo;
 
 // Check if this cell has active validation errors
 const cellConflict = conflicts.find(
 (c) => c.context?.day === d && c.context?.periodNo === pNo
 );

 if (!p) return <td key={d} className="px-2 py-3 border border-border/40 bg-white/20"></td>;

 if (p.isLunch || p.isBreak || p.isAssembly || p.isFixed) {
 return (
 <td
 key={d}
 className="px-2 py-3 border border-border/30 bg-white/60 text-center font-semibold text-muted select-none text-xs"
 >
 {p.label || 'Break'}
 </td>
 );
 }

 const subjectObj = p.subject?._id ? p.subject : (p.subject ? subjects.find(s => s._id === p.subject) : null);
 const teacherObj = p.teacher?._id ? p.teacher : (p.teacher ? teachers.find(t => t._id === p.teacher) : null);

 return (
 <td
 key={d}
 draggable={!p.isLocked}
 onDragStart={(e) => handleDragStart(e, p)}
 onDragOver={handleDragOver}
 onDrop={(e) => handleDrop(e, p)}
 className={`px-2 py-3 border border-border/40 transition-all duration-150 relative cursor-grab active:cursor-grabbing ${
 isCellDragged ? 'opacity-40 scale-95' : ''
 } ${getSubjectColorClass(subjectObj)} ${
 cellConflict ? 'ring-2 ring-red-500 border-transparent' : ''
 }`}
 >
 {/* Locked/Action badge */}
 <div className="absolute top-1 right-1 flex gap-1">
 {p.isLocked && <Lock size={10} className="text-muted"/>}
 {cellConflict && (
 <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"title={cellConflict.message}></div>
 )}
 </div>

 <div className="text-center space-y-1">
 {subjectObj ? (
 <>
 <div className="font-semibold text-xs leading-tight line-clamp-1">{subjectObj.name}</div>
 <div className="text-[10px] opacity-75 font-medium line-clamp-1">
 {teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName.substring(0, 1)}.` : '—'}
 </div>
 {p.room && <div className="text-[9px] opacity-60 font-semibold">{p.room}</div>}
 </>
 ) : (
 <div className="text-muted italic text-[11px] py-1">— Empty —</div>
 )}
 </div>

 {/* Context Menu Hover */}
 <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 hover:opacity-100 bg-page/80 backdrop-blur-xs transition-opacity duration-150 rounded-md">
 <button
 onClick={() => openEditCell(p)}
 className="p-1 text-secondary hover:text-white rounded bg-white border border-border hover:border-border"
 title="Edit slot details"
 >
 <Edit2 size={11} />
 </button>
 <button
 onClick={() => toggleLock(p)}
 className="p-1 text-secondary hover:text-white rounded bg-white border border-border hover:border-border"
 title={p.isLocked ? 'Unlock slot' : 'Lock slot'}
 >
 {p.isLocked ? <Unlock size={11} /> : <Lock size={11} />}
 </button>
 </div>
 </td>
 );
 })}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Conflict logs / Sidebar */}
 <div className="space-y-6">
 {/* Class overview card */}
 <div className="bg-white border border-border rounded-2xl p-5 shadow-2xl space-y-3">
 <h3 className="text-md font-bold text-deep">Status Summary</h3>
 <div className="space-y-2">
 <div className="flex justify-between text-sm">
 <span className="text-muted">Total Periods:</span>
 <span className="font-semibold text-deep">{gridPeriods.filter((p) => p.subject).length}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted">Locked Slots:</span>
 <span className="font-semibold text-deep">{gridPeriods.filter((p) => p.isLocked).length}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-muted">Version:</span>
 <span className="font-semibold text-forest">v{activeTimetable.version || 1}</span>
 </div>
 </div>
 <Button className="w-full mt-2"variant="outline"onClick={() => setActiveTimetable(null)}>
 Close Editor
 </Button>
 </div>

 {/* Conflict logs panel */}
 <div className="bg-white border border-border rounded-2xl p-5 shadow-2xl space-y-4">
 <h3 className="text-md font-bold text-deep flex items-center gap-2 border-b border-border/60 pb-3">
 <AlertCircle size={18} className="text-forest"/> Conflict Logs ({conflicts.length})
 </h3>
 
 {conflicts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-6 text-center text-muted">
 <CheckCircle size={28} className="text-emerald-500 mb-2"/>
 <span className="text-xs font-semibold text-secondary">Conflict Free</span>
 <span className="text-[10px] text-muted mt-0.5">This timetable satisfies all scheduling constraints.</span>
 </div>
 ) : (
 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
 {conflicts.map((conf, idx) => (
 <div
 key={idx}
 className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
 conf.severity === 'error'
 ? 'bg-red-950/20 border-red-900/40 text-danger-text'
 : 'bg-yellow-950/20 border-yellow-900/40 text-warning-text'
 }`}
 >
 <div className="font-semibold capitalize flex items-center gap-1.5">
 <span className={`w-1.5 h-1.5 rounded-full ${conf.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
 {conf.type?.replace(/_/g, ' ')}
 </div>
 <p className="opacity-80">{conf.message}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 ) : (
 /* Timetables list view */
 <div className="space-y-4 animate-scale-in">
 <DataTable
 columns={listColumns}
 data={timetables}
 loading={loading}
 meta={meta}
 onPageChange={(p) => { setLoading(true); setPage(p); }}
 onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
 searchPlaceholder="Search timetables..."
 />
 </div>
 )}

 {/* Editor Cell Configuration Modal */}
 <Modal isOpen={!!editCell} onClose={() => setEditCell(null)} title={`Edit Period Slot — P${editCell?.periodNo} (${DAYS.find(d => d.value === editCell?.day)?.label})`}>
 {editCell && (
 <div className="space-y-4">
 <Select
 label="Subject"
 placeholder="— Empty —"
 options={subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` }))}
 value={cellForm.subject}
 onChange={(e) => setCellForm((f) => ({ ...f, subject: e.target.value }))}
 />
 <Select
 label="Teacher"
 placeholder="— Empty —"
 options={teachers.map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))}
 value={cellForm.teacher}
 onChange={(e) => setCellForm((f) => ({ ...f, teacher: e.target.value }))}
 />
 <Input
 label="Room"
 placeholder="Optional classroom / lab name"
 value={cellForm.room}
 onChange={(e) => setCellForm((f) => ({ ...f, room: e.target.value }))}
 />
 <div className="flex justify-end gap-3 pt-4 border-t border-border">
 <Button variant="ghost"onClick={() => setEditCell(null)}>
 Cancel
 </Button>
 <Button onClick={handleCellSave}>
 Apply Edit
 </Button>
 </div>
 </div>
 )}
 </Modal>

 {/* Generate Timetable Configuration Modal */}
 <Modal isOpen={openGen} onClose={() => setOpenGen(false)} title="Generate New Timetable">
 <div className="space-y-4">
 <Select
 label="Academic Year *"
 options={years.map((y) => ({ value: y._id, label: y.name }))}
 value={form.academicYear}
 onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
 placeholder="Select Academic Year"
 />

 <div className="border border-border/60 p-4 rounded-xl bg-white/30 space-y-4">
 <h4 className="text-sm font-semibold text-secondary">Single Class Generation</h4>
 <div className="grid grid-cols-2 gap-4">
 <Select
 label="Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={form.schoolClass}
 onChange={(e) => setForm((f) => ({ ...f, schoolClass: e.target.value, section: '' }))}
 placeholder="Select Class"
 />
 <Select
 label="Section"
 options={filteredSections.map((s) => ({ value: s._id, label: s.name }))}
 value={form.section}
 onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
 placeholder="Select Section"
 disabled={!form.schoolClass}
 />
 </div>
 <div className="flex justify-end">
 <Button onClick={handleGenerate} loading={generating} disabled={!form.schoolClass || !form.section || !form.academicYear}>
 Generate Single
 </Button>
 </div>
 </div>

 <div className="border border-border/60 p-4 rounded-xl bg-white/30 space-y-3">
 <h4 className="text-sm font-semibold text-secondary">Bulk Generation (Entire School)</h4>
 <p className="text-xs text-muted leading-relaxed">
 Caution: This will generate timetables for ALL class sections, clearing all current drafts. Published timetables will be preserved.
 </p>
 <div className="flex justify-end">
 <Button variant="outline"onClick={handleBulkGenerate} loading={generating} disabled={!form.academicYear}>
 Generate All Classes
 </Button>
 </div>
 </div>
 </div>
 </Modal>

 {/* Reports & Analytics Modal */}
 <Modal isOpen={showReports} onClose={() => setShowReports(false)} title="Timetable Analytical Reports"size="xl">
 <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-1">
 {/* Workload chart */}
 <div className="space-y-3">
 <h3 className="text-sm font-bold text-deep">Teacher Workload Utilization</h3>
 <div className="h-[250px] w-full bg-white/30 border border-border rounded-xl p-4">
 <ResponsiveContainer width="100%"height="100%">
 <BarChart data={workloadReport}>
 <XAxis dataKey="teacher.firstName"stroke="#888888"fontSize={11} tickLine={false} axisLine={false} />
 <YAxis stroke="#888888"fontSize={11} tickLine={false} axisLine={false} />
 <Tooltip
 contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }}
 labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
 />
 <Bar dataKey="assignedPeriods"name="Assigned Periods"radius={[4, 4, 0, 0]}>
 {workloadReport.map((entry, index) => {
 const overload = entry.assignedPeriods > entry.weeklyLimit;
 return <Cell key={`cell-${index}`} fill={overload ? '#ef4444' : '#4f46e5'} />;
 })}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Workload details table */}
 <div className="space-y-3">
 <h3 className="text-sm font-bold text-deep">Teacher Assignments & Limits</h3>
 <div className="border border-border rounded-xl overflow-hidden text-xs">
 <table className="w-full">
 <thead>
 <tr className="bg-white border-b border-border text-muted font-bold">
 <th className="px-3 py-2 text-left">Teacher</th>
 <th className="px-3 py-2 text-center">Limit/Week</th>
 <th className="px-3 py-2 text-center">Assigned</th>
 <th className="px-3 py-2 text-center">Utilization</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {workloadReport.map((w, idx) => {
 const ratio = w.assignedPeriods / w.weeklyLimit;
 return (
 <tr key={idx} className="hover:bg-white/20 text-secondary">
 <td className="px-3 py-2.5 font-medium">{w.teacher.firstName} {w.teacher.lastName}</td>
 <td className="px-3 py-2.5 text-center">{w.weeklyLimit}</td>
 <td className={`px-3 py-2.5 text-center font-bold ${w.assignedPeriods > w.weeklyLimit ? 'text-red-400' : 'text-deep'}`}>
 {w.assignedPeriods}
 </td>
 <td className="px-3 py-2.5 text-center font-semibold">
 {Math.round(ratio * 100)}%
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Subject Distribution */}
 <div className="space-y-3">
 <h3 className="text-sm font-bold text-deep">Subject Distribution Report</h3>
 <div className="border border-border rounded-xl overflow-hidden text-xs">
 <table className="w-full">
 <thead>
 <tr className="bg-white border-b border-border text-muted font-bold">
 <th className="px-3 py-2 text-left">Subject</th>
 <th className="px-3 py-2 text-left">Category</th>
 <th className="px-3 py-2 text-center">Total Assigned periods</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {distributionReport.map((d, idx) => (
 <tr key={idx} className="hover:bg-white/20 text-secondary">
 <td className="px-3 py-2.5 font-medium">{d.name} ({d.code})</td>
 <td className="px-3 py-2.5 capitalize">{d.category}</td>
 <td className="px-3 py-2.5 text-center font-bold text-deep">
 {d.totalWeeklyPeriodsAssigned}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </Modal>

 {/* Bulk Generation Results Modal */}
 <Modal isOpen={showBulkResults} onClose={() => setShowBulkResults(false)} title="Timetable Generation Results"size="xl">
 {bulkResults && (
 <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
 {/* Summary Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="p-4 bg-surface/40 rounded-xl text-center">
 <p className="text-2xl font-bold text-deep">{bulkResults.summary?.total ?? 0}</p>
 <p className="text-xs text-muted mt-1">Total Sections</p>
 </div>
 <div className="p-4 bg-emerald-900/30 border border-emerald-800/40 rounded-xl text-center">
 <p className="text-2xl font-bold text-emerald-400">{bulkResults.summary?.generated ?? 0}</p>
 <p className="text-xs text-muted mt-1">Generated</p>
 </div>
 <div className="p-4 bg-amber-900/30 border border-amber-800/40 rounded-xl text-center">
 <p className="text-2xl font-bold text-amber-400">{bulkResults.summary?.skipped ?? 0}</p>
 <p className="text-xs text-muted mt-1">Skipped (Published)</p>
 </div>
 <div className="p-4 bg-red-900/30 border border-red-800/40 rounded-xl text-center">
 <p className="text-2xl font-bold text-red-400">{bulkResults.summary?.failed ?? 0}</p>
 <p className="text-xs text-muted mt-1">Failed</p>
 </div>
 </div>

 {/* Pre-validation Errors */}
 {bulkResults.preValidationErrors?.length > 0 && (
 <div className="space-y-2">
 <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
 <AlertCircle size={14} /> Pre-Validation Errors — Fix these before generating
 </h4>
 <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
 {bulkResults.preValidationErrors.map((err, i) => (
 <div key={i} className="flex items-start gap-2 text-sm text-danger-text">
 <span className="text-red-500 mt-0.5 shrink-0">✕</span>
 <span>{err.message}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Pre-validation Warnings */}
 {bulkResults.preValidationWarnings?.length > 0 && (
 <div className="space-y-2">
 <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
 <AlertCircle size={14} /> Warnings
 </h4>
 <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 space-y-2 max-h-36 overflow-y-auto">
 {bulkResults.preValidationWarnings.map((w, i) => (
 <div key={i} className="flex items-start gap-2 text-sm text-amber-300">
 <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
 <span>{w.message}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Per-Class Results Table */}
 {bulkResults.results?.length > 0 && (
 <div className="space-y-2">
 <h4 className="text-sm font-bold text-deep">Per-Class Results</h4>
 <div className="overflow-hidden border border-border rounded-xl">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-white/60 text-muted text-xs uppercase tracking-wider">
 <th className="text-left px-4 py-2.5">Class</th>
 <th className="text-left px-4 py-2.5">Section</th>
 <th className="text-left px-4 py-2.5">Status</th>
 <th className="text-left px-4 py-2.5">Details</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {bulkResults.results.map((r, i) => {
 const statusColor = r.status === 'generated' ? 'text-emerald-400' 
 : r.status === 'skipped' ? 'text-amber-400' 
 : r.status === 'generated_with_warnings' ? 'text-yellow-400'
 : 'text-red-400';
 const statusIcon = r.status === 'generated' ? '✓' 
 : r.status === 'skipped' ? '⏭' 
 : r.status === 'generated_with_warnings' ? '⚠'
 : '✕';
 return (
 <tr key={i} className="hover:bg-white/40">
 <td className="px-4 py-2.5 text-deep font-medium">{r.className}</td>
 <td className="px-4 py-2.5 text-secondary">{r.sectionName}</td>
 <td className={`px-4 py-2.5 font-semibold ${statusColor}`}>
 {statusIcon} {r.status.replace(/_/g, ' ')}
 </td>
 <td className="px-4 py-2.5 text-muted text-xs">
 {r.statusReason || (r.conflicts?.length > 0 ? `${r.conflicts.length} conflict(s)` : '—')}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}
 </Modal>
 </div>
 );
}
