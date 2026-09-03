import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Eye, Send, Lock, Unlock, Download, RotateCcw,
  BarChart3, RefreshCw, Layers, Edit2, AlertCircle, FileText, CheckCircle,
  Search, Filter, MoreVertical, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ChevronsUpDown, Calendar, CheckCircle2, AlertTriangle, Layers3, Printer, Coffee
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { timetableApi } from '../../api/timetable.api';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSubjectStyle, DEFAULT_PERIOD_TIMES } from '../../utils/timetableTheme';
import TimetablePrintView from '../../components/timetable/TimetablePrintView';
import { generateTimetablePdf } from '../../utils/timetablePdf';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const STATUS_PILLS = [
  { value: 'all', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

export default function Timetable() {
  // Navigation & Lists
  const [timetables, setTimetables] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Row Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [generateDropdownOpen, setGenerateDropdownOpen] = useState(false);
  const generateDropdownRef = useRef(null);

  // Action Menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

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

  // Bulk Delete Modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ type: 'class', schoolClass: '', academicYear: '' });
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Bulk Publish Modal
  const [openPublishModal, setOpenPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ type: 'class', schoolClass: '', academicYear: '', status: 'published' });
  const [publishingBulk, setPublishingBulk] = useState(false);

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
  const [draggedPeriod, setDraggedPeriod] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
      if (generateDropdownRef.current && !generateDropdownRef.current.contains(e.target)) {
        setGenerateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allSelected = timetables.length > 0 && selectedIds.length === timetables.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(timetables.map((t) => t._id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPublishSelected = async (status = 'published') => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => timetableApi.publish(id, status)));
      toast.success(`${selectedIds.length} timetable(s) marked as ${status}`);
      setSelectedIds([]);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to update selected timetables');
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} timetable${selectedIds.length > 1 ? 's' : ''}?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Timetables',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => timetableApi.delete(id)));
      toast.success(`Deleted ${selectedIds.length} timetable(s)`);
      setSelectedIds([]);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to delete selected timetables');
    }
  };

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
        const params = {
          page,
          limit: 10,
          search: search || undefined,
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        };
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (classFilter) params.schoolClass = classFilter;

        const res = await timetableApi.getAll(params);
        if (!active) return;
        setTimetables(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load timetables');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, statusFilter, classFilter, sortField, sortOrder]);

  // Maps for display
  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));
  const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));

  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('');
    setPage(1);
    setLoading(true);
  };

  const countActiveFilters = () => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (classFilter) count++;
    if (search) count++;
    return count;
  };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  // KPI Stats
  const totalCount = meta?.total || timetables.length;
  const publishedCount = timetables.filter(t => t.status === 'published').length;
  const draftCount = timetables.filter(t => t.status !== 'published').length;

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
    if (!form.schoolClass || !form.academicYear) {
      toast.error('Please select class and academic year');
      return;
    }
    setGenerating(true);
    try {
      const res = await timetableApi.generate({
        schoolClass: form.schoolClass,
        academicYear: form.academicYear,
      });
      const timetables = res.data.timetables || [];
      const hasErrors = timetables.some(t => t.generationLog?.some(l => l.severity === 'error'));
      
      if (hasErrors) {
        toast.error('Timetable generated with conflicts. Review Conflict Logs in the sidebar.');
      } else {
        toast.success(`Generated ${timetables.length} timetable(s) successfully`);
      }
      setOpenGen(false);
      triggerReload();
      if (timetables.length > 0) openEditor(timetables[0]);
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
      triggerReload();

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
      if (e?.errors) setConflicts(e.errors);
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
      triggerReload();
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
      confirmButtonColor: '#dc2626',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await timetableApi.delete(timetable._id);
          toast.success('Timetable deleted');
          if (activeTimetable?._id === timetable._id) setActiveTimetable(null);
          triggerReload();
        } catch (e) {
          toast.error(e?.message || 'Failed to delete timetable');
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (!deleteForm.academicYear) {
      toast.error('Academic year is required');
      return;
    }
    if (deleteForm.type === 'class' && !deleteForm.schoolClass) {
      toast.error('Please select a class');
      return;
    }
    const result = await Swal.fire({
      title: 'Bulk Delete Timetables?',
      text: deleteForm.type === 'class' ? 'This will delete ALL section timetables for the selected class.' : 'This will delete ALL timetables across the entire school!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete All',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;

    setDeletingBulk(true);
    try {
      const res = deleteForm.type === 'class'
        ? await timetableApi.deleteClass(deleteForm.schoolClass, deleteForm.academicYear)
        : await timetableApi.deleteSchool(deleteForm.academicYear);
      toast.success(`Deleted ${res.data.deletedCount} timetable(s)`);
      setOpenDeleteModal(false);
      if (activeTimetable) setActiveTimetable(null);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Bulk delete failed');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleBulkPublish = async () => {
    if (!publishForm.academicYear) {
      toast.error('Academic year is required');
      return;
    }
    setPublishingBulk(true);
    try {
      const res = publishForm.type === 'class'
        ? await timetableApi.bulkPublishClass(publishForm.schoolClass, { academicYear: publishForm.academicYear, status: publishForm.status })
        : await timetableApi.bulkPublishSchool({ academicYear: publishForm.academicYear, status: publishForm.status });
      toast.success(`Updated ${res.data.updatedCount} timetable(s) to ${publishForm.status}`);
      setOpenPublishModal(false);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Bulk publish failed');
    } finally {
      setPublishingBulk(false);
    }
  };

  const handleLoadReports = async () => {
    try {
      const [wRes, dRes] = await Promise.all([
        timetableApi.getTeacherWorkloadReport(),
        timetableApi.getSubjectDistributionReport(),
      ]);
      setWorkloadReport(wRes.data || []);
      setDistributionReport(dRes.data || []);
      setShowReports(true);
    } catch (e) {
      toast.error(e?.message || 'Failed to load reports');
    }
  };

  // Editor Cell Edit
  const openCellModal = (day, periodNo) => {
    const existing = gridPeriods.find((p) => p.day === day && p.periodNo === periodNo) || {};
    setEditCell({ day, periodNo });
    setCellForm({
      subject: existing.subject?._id || existing.subject || '',
      teacher: existing.teacher?._id || existing.teacher || '',
      room: existing.room || '',
    });
  };

  const handleCellSave = () => {
    if (!editCell) return;
    const { day, periodNo } = editCell;
    const newPeriods = gridPeriods.filter((p) => !(p.day === day && p.periodNo === periodNo));

    if (cellForm.subject || cellForm.teacher || cellForm.room) {
      const selSubject = subjects.find(s => s._id === cellForm.subject);
      const selTeacher = teachers.find(t => t._id === cellForm.teacher);

      newPeriods.push({
        day,
        periodNo,
        subject: selSubject || cellForm.subject || undefined,
        teacher: selTeacher || cellForm.teacher || undefined,
        room: cellForm.room || undefined,
      });
    }

    setGridPeriods(newPeriods);
    pushToHistory(newPeriods);
    setEditCell(null);
  };

  // Drag and Drop swap
  const handleDragStart = (e, day, periodNo) => {
    setDraggedPeriod({ day, periodNo });
    e.dataTransfer.setData('text/plain', `${day}-${periodNo}`);
  };

  const handleDrop = (e, targetDay, targetPeriodNo) => {
    e.preventDefault();
    if (!draggedPeriod) return;

    const sourceDay = draggedPeriod.day;
    const sourcePeriodNo = draggedPeriod.periodNo;

    if (sourceDay === targetDay && sourcePeriodNo === targetPeriodNo) return;

    const sourceP = gridPeriods.find(p => p.day === sourceDay && p.periodNo === sourcePeriodNo);
    const targetP = gridPeriods.find(p => p.day === targetDay && p.periodNo === targetPeriodNo);

    const updated = gridPeriods.filter(p => !(p.day === sourceDay && p.periodNo === sourcePeriodNo) && !(p.day === targetDay && p.periodNo === targetPeriodNo));

    if (sourceP) updated.push({ ...sourceP, day: targetDay, periodNo: targetPeriodNo });
    if (targetP) updated.push({ ...targetP, day: sourceDay, periodNo: sourcePeriodNo });

    setGridPeriods(updated);
    pushToHistory(updated);
    setDraggedPeriod(null);
    toast.success(`Swapped P${sourcePeriodNo} and P${targetPeriodNo}`);
  };

  // Compute view matrix for alternative views
  const renderGridMatrix = () => {
    const periodCount = configSnapshot?.periodsPerDay || 8;
    const isBreakPeriod = (p) => (configSnapshot?.breakPeriods || []).includes(p);
    const daysList = DAYS.filter(d => d.value !== 0);
    const periodTimings = configSnapshot?.periodTimings || DEFAULT_PERIOD_TIMES;

    let displayPeriods = gridPeriods;

    if (activeView === 'teacher' && viewEntityId) {
      displayPeriods = gridPeriods.filter(p => (p.teacher?._id || p.teacher) === viewEntityId);
    } else if (activeView === 'subject' && viewEntityId) {
      displayPeriods = gridPeriods.filter(p => (p.subject?._id || p.subject) === viewEntityId);
    }

    return (
      <div className="bg-white dark:bg-[#101315] border border-border dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl dark:shadow-2xl space-y-4">
        {/* Container Header inside Timetable Grid Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-deep dark:text-white tracking-tight">Timetable</h2>
            <p className="text-xs text-secondary dark:text-slate-400 font-medium mt-0.5">
              Class {activeTimetable?.schoolClass?.name || classMap[activeTimetable?.schoolClass] || '1 A'} • Section {activeTimetable?.section?.name || sectionMap[activeTimetable?.section] || 'A'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs gap-1.5 dark:bg-[#15191C] dark:border-white/10 dark:text-slate-200 dark:hover:bg-[#181D20]"
            >
              <Printer size={14} /> Print
            </Button>
            <Button
              size="sm"
              onClick={() => {
                generateTimetablePdf({
                  activeTimetable,
                  displayPeriods,
                  daysList,
                  periodCount,
                  subjects,
                  teachers,
                  configSnapshot,
                });
              }}
              className="text-xs gap-1.5 bg-forest hover:bg-forest/90 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-slate-950 font-semibold shadow-2xs"
            >
              <Download size={14} /> Download
            </Button>
          </div>
        </div>

        {/* Timetable Table Grid */}
        <div className="overflow-x-auto rounded-xl border border-border/80 dark:border-white/10">
          <table className="w-full text-center border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="bg-surface/70 dark:bg-[#101315] border-b border-border dark:border-white/10 text-secondary dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3.5 w-32 text-left border-r border-border dark:border-white/10 font-bold text-deep dark:text-slate-200">
                  PERIOD
                </th>
                {daysList.map((dayObj) => (
                  <th key={dayObj.value} className="px-3 py-3.5 border-r border-border dark:border-white/10 min-w-[130px] sm:min-w-[145px]">
                    <div className="flex items-center justify-center gap-1.5 text-deep dark:text-slate-200 font-bold text-xs">
                      <Calendar size={13} className="text-forest dark:text-emerald-400" />
                      <span>{dayObj.label.toUpperCase()}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-white/[0.06] bg-white dark:bg-[#101315]">
              {Array.from({ length: periodCount }, (_, i) => i + 1).map((pNo) => {
                const isBreak = isBreakPeriod(pNo);
                const pTime = periodTimings.find(pt => (pt.periodNo || pt.pNo) === pNo) || DEFAULT_PERIOD_TIMES[pNo - 1] || {};

                return (
                  <tr key={pNo} className="hover:bg-surface/30 dark:hover:bg-white/[0.01] transition-colors">
                    {/* Fixed/Sticky Period Column */}
                    <td className="px-3.5 py-3.5 font-bold border-r border-border dark:border-white/10 bg-surface/40 dark:bg-[#101315] text-left select-none align-middle w-32">
                      <div className="font-extrabold text-sm text-deep dark:text-slate-200 tracking-tight">
                        P{pNo}
                      </div>
                      <div className="text-[10px] text-muted dark:text-slate-400 font-normal mt-0.5 whitespace-nowrap">
                        {pTime.startTime || pTime.start || '08:00'} – {pTime.endTime || pTime.end || '08:45'}
                      </div>
                    </td>

                    {/* Day Columns */}
                    {daysList.map((dayObj) => {
                      const periodData = displayPeriods.find((p) => p.day === dayObj.value && p.periodNo === pNo);

                      if (isBreak) {
                        return (
                          <td key={dayObj.value} className="px-2 py-2.5 border-r border-border dark:border-white/10 bg-amber-50/30 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold text-[11px] select-none text-center align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <Coffee size={12} className="opacity-70" />
                              <span>Break</span>
                            </div>
                          </td>
                        );
                      }

                      const subName = periodData?.subject?.name || (typeof periodData?.subject === 'string' ? subjects.find(s => s._id === periodData.subject)?.name : null);
                      const tchName = periodData?.teacher ? `${periodData.teacher.firstName || ''} ${periodData.teacher.lastName || ''}`.trim() || (teachers.find(t => t._id === periodData.teacher) ? `${teachers.find(t => t._id === periodData.teacher).firstName} ${teachers.find(t => t._id === periodData.teacher).lastName}` : null) : null;
                      
                      const style = getSubjectStyle(subName);
                      const Icon = style.Icon;

                      return (
                        <td
                          key={dayObj.value}
                          draggable={activeView === 'class' && !!periodData}
                          onDragStart={(e) => activeView === 'class' && handleDragStart(e, dayObj.value, pNo)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => activeView === 'class' && handleDrop(e, dayObj.value, pNo)}
                          onClick={() => activeView === 'class' && openCellModal(dayObj.value, pNo)}
                          className="px-2 py-2 border-r border-border dark:border-white/10 align-top cursor-pointer select-none transition-all"
                        >
                          {periodData ? (
                            <div className={`h-full min-h-[72px] bg-forest-soft/40 dark:bg-[#15191C] hover:dark:bg-[#181D20] border border-border/70 dark:border-white/[0.08] ${style.borderHover} rounded-xl p-2.5 space-y-1 text-left transition-all duration-150 shadow-2xs hover:shadow-md dark:shadow-none group`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${style.iconBox}`}>
                                  <Icon size={13} />
                                </div>
                                <div className="font-bold text-xs text-deep dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {subName || 'Subject'}
                                </div>
                              </div>
                              <div className="text-[11px] text-secondary dark:text-slate-400 font-medium truncate pl-0.5">
                                {tchName || '—'}
                              </div>
                              {periodData.room && (
                                <div className="text-[10px] text-muted dark:text-slate-500 font-semibold pl-0.5">
                                  Rm: {periodData.room}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[72px] border border-dashed border-border/60 dark:border-white/[0.06] rounded-xl flex items-center justify-center text-muted/60 dark:text-slate-600 text-[11px] font-medium hover:dark:border-white/15 transition-all bg-surface/20 dark:bg-white/[0.01]">
                              — Free —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="pt-1 text-xs text-forest dark:text-emerald-400/80 font-medium flex items-center gap-1.5">
          <span className="font-bold text-forest dark:text-emerald-400">Note:</span> Timetable is subject to change. Please check regularly for updates.
        </div>
        <div className="hidden print:block">
          <TimetablePrintView
            activeTimetable={activeTimetable}
            displayPeriods={displayPeriods}
            daysList={daysList}
            periodCount={periodCount}
            subjects={subjects}
            teachers={teachers}
            configSnapshot={configSnapshot}
          />
        </div>
      </div>
    );
  };

  /* ──────────────────────── RENDER ──────────────────────── */

  return (
    <div className="space-y-4 w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep tracking-tight">Timetable Management</h1>
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            Auto-generate, inspect, and optimize school class schedules with conflict prevention.
          </p>
        </div>

        {/* Primary and Secondary Actions */}
        <div className="flex items-center gap-2.5 relative">
          {/* Secondary Action: Analytics */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadReports}
            className="gap-1.5 text-xs text-secondary hover:text-deep"
          >
            <BarChart3 size={14} /> Analytics
          </Button>

          {/* Primary Action: Generate Timetable Dropdown */}
          <div className="relative" ref={generateDropdownRef}>
            <Button
              size="sm"
              onClick={() => setGenerateDropdownOpen(!generateDropdownOpen)}
              className="gap-1.5 text-xs bg-forest text-white shadow-2xs"
            >
              <Plus size={15} /> Generate Timetable{' '}
              <ChevronDown
                size={13}
                className={`transition-transform duration-150 opacity-80 ${generateDropdownOpen ? 'rotate-180' : ''}`}
              />
            </Button>

            {generateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-border rounded-xl shadow-dropdown z-50 py-1 text-left animate-scale-in">
                <button
                  onClick={() => { setGenerateDropdownOpen(false); setOpenGen(true); }}
                  className="w-full px-3.5 py-2 text-xs text-deep hover:bg-surface flex items-center gap-2 font-medium"
                >
                  <Plus size={13} className="text-forest" /> Generate for Class
                </button>
                <button
                  onClick={() => {
                    setGenerateDropdownOpen(false);
                    const defaultYear = years.find(y => y.isCurrent)?._id || years[0]?._id || '';
                    setForm(f => ({ ...f, academicYear: defaultYear }));
                    setOpenGen(true);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-deep hover:bg-surface flex items-center gap-2 font-medium"
                >
                  <RefreshCw size={13} className="text-forest" /> Bulk Generation (All Classes)
                </button>
                <div className="border-t border-border/70 my-1"></div>
                <button
                  onClick={() => { setGenerateDropdownOpen(false); setOpenPublishModal(true); }}
                  className="w-full px-3.5 py-2 text-xs text-secondary hover:bg-surface flex items-center gap-2"
                >
                  <Lock size={13} className="text-muted" /> Bulk Publish by Scope
                </button>
                <button
                  onClick={() => { setGenerateDropdownOpen(false); setOpenDeleteModal(true); }}
                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={13} /> Bulk Delete by Scope
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Editor Active View */}
      {activeTimetable ? (
        <div className="space-y-4 animate-scale-in">
          {/* Active Timetable Banner */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-deep">
                  Class {activeTimetable.schoolClass?.name || classMap[activeTimetable.schoolClass]} — Section {activeTimetable.section?.name || sectionMap[activeTimetable.section]}
                </span>
                {activeTimetable.status === 'published' ? (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">Academic Session: {activeTimetable.academicYear?.name || yearMap[activeTimetable.academicYear] || '—'}</p>
            </div>

            {/* View Switcher & Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-surface p-1 rounded-lg text-xs">
                <button
                  onClick={() => { setActiveView('class'); setViewEntityId(''); }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${activeView === 'class' ? 'bg-forest text-white shadow-2xs' : 'text-secondary hover:text-deep'}`}
                >
                  Class View
                </button>
                <button
                  onClick={() => { setActiveView('teacher'); setViewEntityId(teachers[0]?._id || ''); }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${activeView === 'teacher' ? 'bg-forest text-white shadow-2xs' : 'text-secondary hover:text-deep'}`}
                >
                  Teacher View
                </button>
                <button
                  onClick={() => { setActiveView('subject'); setViewEntityId(subjects[0]?._id || ''); }}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${activeView === 'subject' ? 'bg-forest text-white shadow-2xs' : 'text-secondary hover:text-deep'}`}
                >
                  Subject View
                </button>
              </div>

              {/* Action Buttons */}
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0} className="text-xs px-2" title="Undo">↺</Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="text-xs px-2" title="Redo">↻</Button>
              <Button variant="outline" size="sm" onClick={saveDraft} loading={saving} className="text-xs">Save Draft</Button>
              <Button size="sm" onClick={() => handlePublish(activeTimetable)} className="text-xs gap-1">
                {activeTimetable.status === 'published' ? <Lock size={13} /> : <Unlock size={13} />}
                {activeTimetable.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setActiveTimetable(null)} className="text-xs">Close</Button>
            </div>
          </div>

          {/* Sub-view Entity Filter */}
          {activeView === 'teacher' && (
            <div className="bg-white border border-border rounded-xl p-3 shadow-2xs flex items-center gap-3 text-xs">
              <span className="font-semibold text-secondary">Select Teacher:</span>
              <select
                value={viewEntityId}
                onChange={(e) => setViewEntityId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20"
              >
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.department || 'General'})</option>
                ))}
              </select>
            </div>
          )}

          {activeView === 'subject' && (
            <div className="bg-white border border-border rounded-xl p-3 shadow-2xs flex items-center gap-3 text-xs">
              <span className="font-semibold text-secondary">Select Subject:</span>
              <select
                value={viewEntityId}
                onChange={(e) => setViewEntityId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20"
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Main Grid Matrix */}
          {renderGridMatrix()}

          {/* Conflict Log Drawer */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" /> Conflict Warnings ({conflicts.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto text-xs">
                {conflicts.map((conf, idx) => (
                  <div key={idx} className="p-2 bg-white/80 border border-amber-200 rounded-lg text-amber-900">
                    <span className="font-semibold capitalize">{conf.type?.replace(/_/g, ' ')}:</span> {conf.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4 animate-scale-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-1.5">
                <Calendar size={15} />
              </div>
              <p className="text-[11px] font-semibold text-secondary">Total Timetables</p>
              <p className="text-xl font-bold text-deep mt-0.5">{totalCount}</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                <CheckCircle2 size={15} />
              </div>
              <p className="text-[11px] font-semibold text-secondary">Published</p>
              <p className="text-xl font-bold text-deep mt-0.5">{publishedCount}</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                <Layers3 size={15} />
              </div>
              <p className="text-[11px] font-semibold text-secondary">Drafts</p>
              <p className="text-xl font-bold text-deep mt-0.5">{draftCount}</p>
            </div>

            <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-forest text-white flex items-center justify-center mb-1.5">
                <AlertTriangle size={15} />
              </div>
              <p className="text-[11px] font-semibold text-secondary">Conflicts</p>
              <p className="text-xl font-bold text-deep mt-0.5">{conflicts.length}</p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search timetables by class or section..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <span className="font-semibold text-muted text-[11px]">Class</span>
                  <select
                    value={classFilter}
                    onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
                    className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs text-secondary">
                  <RotateCcw size={13} className="mr-1 text-muted" /> Reset
                </Button>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="pt-2 border-t border-border/70 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-secondary text-xs mr-1">Status:</span>
              <div className="flex flex-wrap gap-1">
                {STATUS_PILLS.map((pill) => {
                  const isActive = statusFilter === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs transition-all whitespace-nowrap font-medium ${
                        isActive
                          ? 'bg-forest text-white font-semibold shadow-2xs'
                          : 'text-secondary hover:bg-surface hover:text-deep'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Contextual Bulk Action Toolbar (Only visible when rows are selected) ── */}
          {selectedIds.length > 0 && (
            <div className="bg-forest-soft/60 border border-forest/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-scale-in">
              <div className="flex items-center gap-2">
                <span className="font-bold text-forest">
                  {selectedIds.length} timetable{selectedIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkPublishSelected('published')}
                  className="text-xs bg-white text-forest border-forest/30 hover:bg-forest/10"
                >
                  <CheckCircle2 size={13} className="mr-1" /> Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkPublishSelected('draft')}
                  className="text-xs bg-white text-secondary hover:bg-surface"
                >
                  Set to Draft
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDeleteSelected}
                  className="text-xs bg-white text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={13} className="mr-1 text-red-500" /> Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-muted hover:text-deep"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* High Density Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/70">
                    <th className="px-3 py-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-forest rounded cursor-pointer"
                        title="Select All"
                      />
                    </th>
                    <th onClick={() => handleSort('schoolClass')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                      <div className="flex items-center gap-1"><span>CLASS</span><SortIcon field="schoolClass" /></div>
                    </th>
                    <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SECTION</th>
                    <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SESSION</th>
                    <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">PERIODS OFFERED</th>
                    <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">STATUS</th>
                    <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-white">
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}><td colSpan={7} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                    ))
                  ) : timetables.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-muted">No timetables found matching the selected criteria.</td></tr>
                  ) : (
                    timetables.map((row) => {
                      const isRowSelected = selectedIds.includes(row._id);
                      return (
                        <tr
                          key={row._id}
                          className={`transition-colors ${
                            isRowSelected ? 'bg-forest-soft/30 hover:bg-forest-soft/40' : 'hover:bg-surface/50'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isRowSelected}
                              onChange={() => toggleSelectRow(row._id)}
                              className="w-4 h-4 accent-forest rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-xs text-deep">
                            {row.schoolClass?.name || classMap[row.schoolClass] || '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">
                            Section {row.section?.name || sectionMap[row.section] || '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-secondary">
                            {row.academicYear?.name || yearMap[row.academicYear] || '—'}
                          </td>
                          <td className="px-3.5 py-2.5 text-xs font-semibold text-deep">
                            {Array.isArray(row.periods) ? row.periods.length : 0} slots
                          </td>
                          <td className="px-3.5 py-2.5">
                            {row.status === 'published' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right relative">
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => openEditor(row)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors" title="Open Editor">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors">
                                <MoreVertical size={14} />
                              </button>
                            </div>

                            {activeMenuId === row._id && (
                              <div ref={menuRef} className="absolute right-4 top-10 w-44 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                                <button onClick={() => { setActiveMenuId(null); openEditor(row); }} className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2">
                                  <Eye size={13} className="text-muted" /> Inspect & Edit
                                </button>
                                <button onClick={() => { setActiveMenuId(null); handlePublish(row); }} className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2">
                                  {row.status === 'published' ? <Lock size={13} className="text-muted" /> : <Unlock size={13} className="text-muted" />}
                                  {row.status === 'published' ? 'Unpublish' : 'Publish'}
                                </button>
                                <button onClick={() => { setActiveMenuId(null); handleDelete(row); }} className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <Trash2 size={13} /> Delete Timetable
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-surface/30">
                <span className="text-xs text-muted">
                  Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" disabled={loading || !meta.hasPrevPage} onClick={() => setPage(meta.page - 1)} className="p-1 px-2 text-xs"><ChevronLeft size={14} /></Button>
                  {Array.from({ length: meta.totalPages || 1 }, (_, idx) => idx + 1).map((pageNum) => (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${meta.page === pageNum ? 'bg-forest text-white' : 'bg-white border border-border text-secondary hover:bg-surface'}`}>
                      {pageNum}
                    </button>
                  ))}
                  <Button variant="outline" size="sm" disabled={loading || !meta.hasNextPage} onClick={() => setPage(meta.page + 1)} className="p-1 px-2 text-xs"><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </div>
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
              <Button variant="ghost" onClick={() => setEditCell(null)}>Cancel</Button>
              <Button onClick={handleCellSave}>Apply Edit</Button>
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

          <div className="border border-border p-4 rounded-xl bg-surface/30 space-y-4">
            <h4 className="text-sm font-semibold text-secondary">Class Generation (All Sections)</h4>
            <p className="text-xs text-muted leading-relaxed">
              Select a class to generate timetables for all its sections simultaneously. Teachers will be distributed evenly across sections with no overlaps.
            </p>
            <Select
              label="Class"
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              value={form.schoolClass}
              onChange={(e) => setForm((f) => ({ ...f, schoolClass: e.target.value }))}
              placeholder="Select Class"
            />
            <div className="flex justify-end">
              <Button onClick={handleGenerate} loading={generating} disabled={!form.schoolClass || !form.academicYear}>
                Generate for Class
              </Button>
            </div>
          </div>

          <div className="border border-border p-4 rounded-xl bg-surface/30 space-y-3">
            <h4 className="text-sm font-semibold text-secondary">Bulk Generation (Entire School)</h4>
            <p className="text-xs text-muted leading-relaxed">
              Caution: This will generate timetables for ALL class sections, clearing all current drafts. Published timetables will be preserved.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleBulkGenerate} loading={generating} disabled={!form.academicYear}>
                Generate All Classes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Timetable Modal */}
      <Modal isOpen={openDeleteModal} onClose={() => setOpenDeleteModal(false)} title="Bulk Delete Timetables">
        <div className="space-y-4">
          <Select
            label="Delete Scope *"
            options={[
              { value: 'class', label: 'Class Timetables (All Sections)' },
              { value: 'school', label: 'Entire School Timetables' },
            ]}
            value={deleteForm.type}
            onChange={(e) => setDeleteForm((f) => ({ ...f, type: e.target.value }))}
          />

          <Select
            label="Academic Year *"
            options={years.map((y) => ({ value: y._id, label: y.name }))}
            value={deleteForm.academicYear}
            onChange={(e) => setDeleteForm((f) => ({ ...f, academicYear: e.target.value }))}
            placeholder="Select Academic Year"
          />

          {deleteForm.type === 'class' && (
            <Select
              label="Class *"
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              value={deleteForm.schoolClass}
              onChange={(e) => setDeleteForm((f) => ({ ...f, schoolClass: e.target.value }))}
              placeholder="Select Class"
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
            <Button onClick={handleBulkDelete} loading={deletingBulk} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Publish Timetable Modal */}
      <Modal isOpen={openPublishModal} onClose={() => setOpenPublishModal(false)} title="Bulk Publish / Unpublish Timetables">
        <div className="space-y-4">
          <Select
            label="Action *"
            options={[
              { value: 'published', label: 'Publish All Selected' },
              { value: 'draft', label: 'Unpublish (Set to Draft)' },
            ]}
            value={publishForm.status}
            onChange={(e) => setPublishForm((f) => ({ ...f, status: e.target.value }))}
          />

          <Select
            label="Scope *"
            options={[
              { value: 'class', label: 'Specific Class' },
              { value: 'school', label: 'Entire School' },
            ]}
            value={publishForm.type}
            onChange={(e) => setPublishForm((f) => ({ ...f, type: e.target.value }))}
          />

          <Select
            label="Academic Year *"
            options={years.map((y) => ({ value: y._id, label: y.name }))}
            value={publishForm.academicYear}
            onChange={(e) => setPublishForm((f) => ({ ...f, academicYear: e.target.value }))}
            placeholder="Select Academic Year"
          />

          {publishForm.type === 'class' && (
            <Select
              label="Class *"
              options={classes.map((c) => ({ value: c._id, label: c.name }))}
              value={publishForm.schoolClass}
              onChange={(e) => setPublishForm((f) => ({ ...f, schoolClass: e.target.value }))}
              placeholder="Select Class"
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setOpenPublishModal(false)}>Cancel</Button>
            <Button onClick={handleBulkPublish} loading={publishingBulk}>Apply Action</Button>
          </div>
        </div>
      </Modal>

      {/* Analytics & Reports Modal */}
      <Modal isOpen={showReports} onClose={() => setShowReports(false)} title="Timetable Analytics & Workload Reports" size="xl">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Workload Report */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-deep">Teacher Weekly Workload</h3>
            <div className="border border-border rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface/70 border-b border-border text-secondary font-semibold">
                    <th className="px-3 py-2.5 text-left">Teacher</th>
                    <th className="px-3 py-2.5 text-left">Department</th>
                    <th className="px-3 py-2.5 text-center">Assigned / Limit</th>
                    <th className="px-3 py-2.5 text-center">Load Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {workloadReport.map((w, idx) => {
                    const ratio = w.weeklyLimit > 0 ? (w.assignedPeriods / w.weeklyLimit) : 0;
                    return (
                      <tr key={idx} className="hover:bg-surface/30">
                        <td className="px-3 py-2.5 font-bold text-deep">{w.firstName} {w.lastName}</td>
                        <td className="px-3 py-2.5 text-secondary">{w.department || '—'}</td>
                        <td className={`px-3 py-2.5 text-center font-bold ${w.assignedPeriods > w.weeklyLimit ? 'text-red-600' : 'text-deep'}`}>
                          {w.assignedPeriods} / {w.weeklyLimit}
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
                  <tr className="bg-surface/70 border-b border-border text-secondary font-semibold">
                    <th className="px-3 py-2.5 text-left">Subject</th>
                    <th className="px-3 py-2.5 text-left">Category</th>
                    <th className="px-3 py-2.5 text-center">Total Assigned Periods</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {distributionReport.map((d, idx) => (
                    <tr key={idx} className="hover:bg-surface/30">
                      <td className="px-3 py-2.5 font-bold text-deep">{d.name} ({d.code})</td>
                      <td className="px-3 py-2.5 capitalize text-secondary">{d.category}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-deep">{d.totalWeeklyPeriodsAssigned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Generation Results Modal */}
      <Modal isOpen={showBulkResults} onClose={() => setShowBulkResults(false)} title="Timetable Generation Results" size="xl">
        {bulkResults && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-surface/50 rounded-xl text-center">
                <p className="text-2xl font-bold text-deep">{bulkResults.summary?.total ?? 0}</p>
                <p className="text-xs text-muted mt-1">Total Sections</p>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-700">{bulkResults.summary?.generated ?? 0}</p>
                <p className="text-xs text-muted mt-1">Generated</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-2xl font-bold text-amber-700">{bulkResults.summary?.skipped ?? 0}</p>
                <p className="text-xs text-muted mt-1">Skipped (Published)</p>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <p className="text-2xl font-bold text-rose-700">{bulkResults.summary?.failed ?? 0}</p>
                <p className="text-xs text-muted mt-1">Failed</p>
              </div>
            </div>

            {bulkResults.preValidationErrors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle size={14} /> Pre-Validation Errors
                </h4>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                  {bulkResults.preValidationErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-rose-800">
                      <span className="text-rose-600 mt-0.5 shrink-0">✕</span>
                      <span>{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bulkResults.results?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-deep">Per-Class Results</h4>
                <div className="overflow-hidden border border-border rounded-xl text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface/70 text-secondary uppercase font-semibold">
                        <th className="text-left px-4 py-2.5">Class</th>
                        <th className="text-left px-4 py-2.5">Section</th>
                        <th className="text-left px-4 py-2.5">Status</th>
                        <th className="text-left px-4 py-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {bulkResults.results.map((r, i) => (
                        <tr key={i} className="hover:bg-surface/30">
                          <td className="px-4 py-2.5 text-deep font-bold">{r.className}</td>
                          <td className="px-4 py-2.5 text-secondary">{r.sectionName}</td>
                          <td className="px-4 py-2.5 font-semibold capitalize">{r.status?.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2.5 text-muted">{r.statusReason || (r.conflicts?.length > 0 ? `${r.conflicts.length} conflict(s)` : '—')}</td>
                        </tr>
                      ))}
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
