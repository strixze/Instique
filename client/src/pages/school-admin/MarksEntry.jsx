import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Trophy, Save, Send, Search, Filter, ArrowUpDown, Users, CheckCircle,
  XCircle, AlertCircle, TrendingUp, Award, BarChart3, ClipboardList,
  Eye, Edit3, Hash, ArrowDown, ArrowUp,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { examApi } from '../../api/exam.api';

// ── Helpers ──

const computeGrade = (pct) => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};

const gradeColor = (grade) => {
  if (!grade) return 'gray';
  if (grade === 'A+' || grade === 'A') return 'success';
  if (grade === 'B+' || grade === 'B') return 'info';
  if (grade === 'C' || grade === 'D') return 'warning';
  return 'danger';
};

// ── Main Component ──

export default function MarksEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedExamId = searchParams.get('examId');

  // State
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examDetails, setExamDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marksGrid, setMarksGrid] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [examLoading, setExamLoading] = useState(true);
  const [viewMode, setViewMode] = useState('entry'); // 'entry' | 'results'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'roll' | 'name'
  const [sortDir, setSortDir] = useState('asc');
  const [resultData, setResultData] = useState(null);

  const gridRef = useRef(null);

  // Load all exams on mount
  useEffect(() => {
    examApi.getAll({ limit: 200 }).then((res) => {
      setExams(res.data || []);
      setExamLoading(false);
      if (preselectedExamId) {
        setSelectedExamId(preselectedExamId);
      }
    }).catch(() => {
      toast.error('Failed to load exams');
      setExamLoading(false);
    });
  }, [preselectedExamId]);

  // When exam changes, load exam details + students + existing marks
  useEffect(() => {
    if (!selectedExamId) {
      setExamDetails(null);
      setStudents([]);
      setSubjects([]);
      setMarksGrid({});
      setResultData(null);
      return;
    }

    let active = true;
    const loadExamData = async () => {
      setLoading(true);
      try {
        const [examRes, studentsRes, resultsRes] = await Promise.all([
          examApi.getById(selectedExamId),
          examApi.getExamStudents(selectedExamId),
          examApi.getExamResults(selectedExamId),
        ]);

        if (!active) return;

        setExamDetails(examRes.data);
        setStudents(studentsRes.data || []);
        setResultData(resultsRes.data || null);

        // Build subjects list from exam
        const exam = examRes.data;
        const subjs = (exam.subjects || []).map((s) => ({
          _id: s.subject._id || s.subject,
          name: s.subject.name || s.subject,
          code: s.subject.code || '',
          maxMarks: s.maxMarks,
          passMarks: s.passMarks,
        }));
        setSubjects(subjs);

        // Build marks grid from existing results
        const grid = {};
        if (resultsRes.data?.results) {
          for (const r of resultsRes.data.results) {
            const sid = r.student._id;
            grid[sid] = {};
            for (const sm of r.subjects) {
              if (sm.marksObtained !== null && sm.marksObtained !== undefined) {
                grid[sid][sm.subjectId] = String(sm.marksObtained);
              }
            }
          }
        }
        setMarksGrid(grid);
        setErrors({});
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load exam data');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadExamData();
    return () => { active = false; };
  }, [selectedExamId]);

  // ── Marks Handling ──

  const updateMark = useCallback((studentId, subjectId, value) => {
    setMarksGrid((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectId]: value },
    }));

    // Validate
    const subj = subjects.find((s) => s._id === subjectId);
    if (!subj) return;

    const key = `${studentId}-${subjectId}`;
    const num = parseFloat(value);

    setErrors((prev) => {
      const next = { ...prev };
      if (value === '' || value === undefined) {
        delete next[key];
      } else if (isNaN(num)) {
        next[key] = 'Invalid number';
      } else if (num < 0) {
        next[key] = 'Cannot be negative';
      } else if (num > subj.maxMarks) {
        next[key] = `Cannot exceed ${subj.maxMarks}`;
      } else {
        delete next[key];
      }
      return next;
    });
  }, [subjects]);

  // ── Computed Results (frontend-side for instant feedback) ──

  const computedResults = useMemo(() => {
    if (!students.length || !subjects.length) return [];

    const maxTotal = subjects.reduce((sum, s) => sum + s.maxMarks, 0);

    const results = students.map((student) => {
      const studentMarks = marksGrid[student._id] || {};
      let totalObtained = 0;
      let allEntered = true;
      let allPassed = true;
      const subjectResults = [];

      for (const subj of subjects) {
        const raw = studentMarks[subj._id];
        const num = parseFloat(raw);
        const entered = raw !== '' && raw !== undefined && raw !== null && !isNaN(num);

        if (entered) {
          const passed = num >= subj.passMarks;
          if (!passed) allPassed = false;
          totalObtained += num;
          subjectResults.push({
            subjectId: subj._id,
            marksObtained: num,
            maxMarks: subj.maxMarks,
            passed,
            grade: computeGrade((num / subj.maxMarks) * 100),
          });
        } else {
          allEntered = false;
          subjectResults.push({
            subjectId: subj._id,
            marksObtained: null,
            maxMarks: subj.maxMarks,
            passed: null,
            grade: null,
          });
        }
      }

      const isComplete = allEntered;
      const percentage = isComplete ? Math.round((totalObtained / maxTotal) * 10000) / 100 : null;
      const result = !isComplete ? 'incomplete' : (allPassed ? 'pass' : 'fail');

      return {
        student,
        subjectResults,
        totalObtained: isComplete ? totalObtained : null,
        maxTotal,
        percentage,
        result,
        rank: null,
      };
    });

    // Competition ranking
    const complete = results.filter((r) => r.result !== 'incomplete');
    complete.sort((a, b) => b.percentage - a.percentage);
    for (let i = 0; i < complete.length; i++) {
      if (i === 0 || complete[i].percentage !== complete[i - 1].percentage) {
        complete[i].rank = i + 1;
      } else {
        complete[i].rank = complete[i - 1].rank;
      }
    }

    return results;
  }, [students, subjects, marksGrid]);

  // ── Filter & Sort ──

  const filteredResults = useMemo(() => {
    let items = [...computedResults];

    // Filter by status
    if (filterStatus === 'pass') items = items.filter((r) => r.result === 'pass');
    else if (filterStatus === 'fail') items = items.filter((r) => r.result === 'fail');
    else if (filterStatus === 'incomplete') items = items.filter((r) => r.result === 'incomplete');

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((r) => {
        const name = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
        const roll = String(r.student.rollNo || '');
        const admission = (r.student.admissionNo || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || admission.includes(q);
      });
    }

    // Sort
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'rank') {
        // Ranked first, then incomplete
        if (a.rank !== null && b.rank !== null) cmp = a.rank - b.rank;
        else if (a.rank !== null) cmp = -1;
        else if (b.rank !== null) cmp = 1;
        else cmp = (a.student.rollNo || 0) - (b.student.rollNo || 0);
      } else if (sortBy === 'roll') {
        cmp = (a.student.rollNo || 0) - (b.student.rollNo || 0);
      } else if (sortBy === 'name') {
        cmp = `${a.student.firstName} ${a.student.lastName}`.localeCompare(`${b.student.firstName} ${b.student.lastName}`);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [computedResults, filterStatus, searchTerm, sortBy, sortDir]);

  // ── Summary Stats ──

  const summary = useMemo(() => {
    const total = computedResults.length;
    const complete = computedResults.filter((r) => r.result !== 'incomplete');
    const passed = computedResults.filter((r) => r.result === 'pass').length;
    const failed = computedResults.filter((r) => r.result === 'fail').length;
    const incomplete = total - complete.length;
    const pcts = complete.map((r) => r.percentage);
    const avg = pcts.length > 0 ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100) / 100 : null;
    const highest = pcts.length > 0 ? Math.max(...pcts) : null;
    const marksEnteredCount = computedResults.filter((r) => r.subjectResults.some((s) => s.marksObtained !== null)).length;
    return { total, completed: complete.length, passed, failed, incomplete, classAverage: avg, highestPercentage: highest, marksEntered: marksEnteredCount };
  }, [computedResults]);

  // ── Keyboard Navigation ──

  const handleKeyDown = useCallback((e, studentIndex, subjectIndex) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const displayed = filteredResults;
      let nextStudent = studentIndex;
      let nextSubject = subjectIndex;

      if (e.key === 'Tab' && !e.shiftKey) {
        nextSubject++;
        if (nextSubject >= subjects.length) {
          nextSubject = 0;
          nextStudent++;
        }
      } else if (e.key === 'Tab' && e.shiftKey) {
        nextSubject--;
        if (nextSubject < 0) {
          nextSubject = subjects.length - 1;
          nextStudent--;
        }
      } else if (e.key === 'Enter') {
        nextStudent++;
      }

      if (nextStudent >= 0 && nextStudent < displayed.length && nextSubject >= 0 && nextSubject < subjects.length) {
        const nextId = `mark-${displayed[nextStudent].student._id}-${subjects[nextSubject]._id}`;
        const nextInput = document.getElementById(nextId);
        if (nextInput) nextInput.focus();
      }
    }
  }, [filteredResults, subjects]);

  // ── Save Marks ──

  const handleSave = async (status = 'draft') => {
    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    // Build marks array from grid
    const marksArray = [];
    for (const studentId of Object.keys(marksGrid)) {
      const studentMarks = marksGrid[studentId];
      for (const subjectId of Object.keys(studentMarks)) {
        const value = studentMarks[subjectId];
        if (value !== '' && value !== undefined && value !== null) {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            marksArray.push({ student: studentId, subject: subjectId, marksObtained: num });
          }
        }
      }
    }

    if (marksArray.length === 0) {
      toast.error('No marks to save');
      return;
    }

    setSaving(true);
    try {
      const res = await examApi.saveMarksBulk(selectedExamId, { marks: marksArray, status });
      const data = res.data;
      if (data.errors?.length > 0) {
        toast.error(`${data.errors.length} marks had errors`);
      } else {
        toast.success(status === 'submitted' ? 'Marks submitted successfully' : 'Marks saved as draft');
      }
      // Refresh results
      const resultsRes = await examApi.getExamResults(selectedExamId);
      setResultData(resultsRes.data || null);
    } catch (e) {
      toast.error(e?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Sort ──

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-muted" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-forest" /> : <ArrowDown size={12} className="text-forest" />;
  };

  // ── Render ──

  const maxTotal = subjects.reduce((sum, s) => sum + s.maxMarks, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marks Entry"
        description="Enter subject-wise marks for exams with automatic calculation"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/leaderboard' + (selectedExamId ? `?examId=${selectedExamId}` : ''))}
          >
            <Award size={14} className="mr-1.5" /> View Leaderboard
          </Button>
        }
      />

      {/* Exam Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-md">
            <Select
              label="Select Exam"
              placeholder="Choose an exam..."
              options={exams.map((e) => ({
                value: e._id,
                label: `${e.name}${e.schoolClass ? '' : ''}`,
              }))}
              value={selectedExamId}
              onChange={(e) => { setSelectedExamId(e.target.value); setViewMode('entry'); }}
              disabled={examLoading}
            />
          </div>
          {examDetails && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge color="primary">{examDetails.schoolClass?.name || 'Class'}</Badge>
              <Badge color="gray">{examDetails.academicYear?.name || 'Year'}</Badge>
              <Badge color={examDetails.status === 'published' ? 'success' : examDetails.status === 'completed' ? 'gray' : 'info'}>
                {examDetails.status}
              </Badge>
              <span className="text-muted">
                {subjects.length} subject{subjects.length !== 1 && 's'} · Max {maxTotal} marks
              </span>
            </div>
          )}
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading exam data...
          </div>
        </div>
      )}

      {!loading && examDetails && students.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <SummaryCard icon={Users} label="Students" value={summary.total} color="text-deep" />
            <SummaryCard icon={Edit3} label="Entered" value={`${summary.marksEntered}/${summary.total}`} color="text-info" />
            <SummaryCard icon={CheckCircle} label="Passed" value={summary.passed} color="text-success" />
            <SummaryCard icon={XCircle} label="Failed" value={summary.failed} color="text-danger" />
            <SummaryCard icon={AlertCircle} label="Incomplete" value={summary.incomplete} color="text-warning" />
            <SummaryCard icon={BarChart3} label="Average" value={summary.classAverage !== null ? `${summary.classAverage}%` : '—'} color="text-info" />
            <SummaryCard icon={TrendingUp} label="Highest" value={summary.highestPercentage !== null ? `${summary.highestPercentage}%` : '—'} color="text-success" />
          </div>

          {/* Controls */}
          <Card padding={false}>
            <div className="p-4 border-b border-border">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                {/* View Toggle */}
                <div className="flex rounded-lg bg-surface p-0.5 shrink-0">
                  <button
                    onClick={() => setViewMode('entry')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'entry' ? 'bg-white text-forest shadow-card' : 'text-muted hover:text-deep'}`}
                  >
                    <Edit3 size={13} /> Marks Entry
                  </button>
                  <button
                    onClick={() => setViewMode('results')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'results' ? 'bg-white text-forest shadow-card' : 'text-muted hover:text-deep'}`}
                  >
                    <Eye size={13} /> Results
                  </button>
                  <button
                    onClick={() => navigate('/leaderboard' + (selectedExamId ? `?examId=${selectedExamId}` : ''))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted hover:text-deep transition-all"
                  >
                    <Award size={13} /> Leaderboard
                  </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-border rounded-lg text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter size={13} className="text-muted" />
                  {['all', 'pass', 'fail', 'incomplete'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterStatus(f)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        filterStatus === f
                          ? f === 'pass' ? 'bg-success-light text-success-text'
                          : f === 'fail' ? 'bg-danger-light text-danger-text'
                          : f === 'incomplete' ? 'bg-warning-light text-warning-text'
                          : 'bg-sage text-forest'
                          : 'text-muted hover:bg-surface'
                      }`}
                    >
                      {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                {viewMode === 'entry' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={() => handleSave('draft')} loading={saving} disabled={saving}>
                      <Save size={14} className="mr-1.5" /> Save Draft
                    </Button>
                    <Button size="sm" onClick={() => handleSave('submitted')} loading={saving} disabled={saving}>
                      <Send size={14} className="mr-1.5" /> Submit Marks
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Marks Grid */}
            <div className="overflow-x-auto" ref={gridRef}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-sage-soft">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wider w-12 cursor-pointer select-none" onClick={() => toggleSort('rank')}>
                      <span className="flex items-center gap-1">Rank <SortIcon field="rank" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wider w-12 cursor-pointer select-none" onClick={() => toggleSort('roll')}>
                      <span className="flex items-center gap-1">Roll <SortIcon field="roll" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wider min-w-[140px] cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Student <SortIcon field="name" /></span>
                    </th>
                    {subjects.map((subj) => (
                      <th key={subj._id} className="px-2 py-2.5 text-center text-xs font-semibold text-muted uppercase tracking-wider min-w-[90px]">
                        <div>{subj.name}</div>
                        <div className="text-[10px] font-normal text-muted/70 mt-0.5">Max: {subj.maxMarks}</div>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase tracking-wider w-24">Total</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase tracking-wider w-20">%</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase tracking-wider w-20">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={subjects.length + 6} className="px-4 py-12 text-center text-muted">
                        {searchTerm || filterStatus !== 'all' ? 'No students match your filters' : 'No students found for this exam'}
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((row, studentIndex) => {
                      const isIncomplete = row.result === 'incomplete';
                      const isFailed = row.result === 'fail';
                      return (
                        <tr
                          key={row.student._id}
                          className={`transition-colors ${
                            isFailed ? 'bg-danger-light/30 hover:bg-danger-light/50'
                            : isIncomplete ? 'hover:bg-surface/50'
                            : 'hover:bg-sage-soft/50'
                          }`}
                        >
                          {/* Rank */}
                          <td className="px-3 py-2 text-center">
                            {row.rank !== null ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                row.rank === 1 ? 'bg-warning-light text-warning-text' :
                                row.rank === 2 ? 'bg-surface text-secondary' :
                                row.rank === 3 ? 'bg-warning-light/60 text-warning-text' :
                                'bg-surface text-muted'
                              }`}>
                                {row.rank}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          {/* Roll No */}
                          <td className="px-3 py-2 text-center text-secondary text-xs">
                            {row.student.rollNo || '—'}
                          </td>

                          {/* Student Name */}
                          <td className="px-3 py-2">
                            <div className="font-medium text-deep text-[13px]">
                              {row.student.firstName} {row.student.lastName}
                            </div>
                            <div className="text-[11px] text-muted">{row.student.admissionNo}</div>
                          </td>

                          {/* Subject Marks */}
                          {subjects.map((subj, subjIndex) => {
                            const markKey = `${row.student._id}-${subj._id}`;
                            const cellValue = marksGrid[row.student._id]?.[subj._id] ?? '';
                            const hasError = errors[markKey];
                            const num = parseFloat(cellValue);
                            const isBelowPass = !isNaN(num) && num < subj.passMarks && cellValue !== '';

                            return (
                              <td key={subj._id} className="px-1 py-1.5 text-center">
                                {viewMode === 'entry' ? (
                                  <div className="relative group">
                                    <input
                                      id={`mark-${row.student._id}-${subj._id}`}
                                      type="number"
                                      min="0"
                                      max={subj.maxMarks}
                                      step="any"
                                      value={cellValue}
                                      onChange={(e) => updateMark(row.student._id, subj._id, e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, studentIndex, subjIndex)}
                                      className={`w-full max-w-[72px] mx-auto px-2 py-1.5 text-center text-sm rounded-md border transition-all focus:outline-none focus:ring-2 ${
                                        hasError
                                          ? 'border-danger bg-danger-light/30 text-danger-text focus:ring-danger/30'
                                          : isBelowPass
                                          ? 'border-warning bg-warning-light/30 text-warning-text focus:ring-warning/30'
                                          : 'border-border bg-white text-deep focus:ring-forest/30 focus:border-forest'
                                      }`}
                                      placeholder="—"
                                    />
                                    {hasError && (
                                      <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-danger text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-dropdown">
                                        {hasError}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`text-sm font-medium ${
                                    isBelowPass ? 'text-danger' : cellValue !== '' ? 'text-deep' : 'text-muted'
                                  }`}>
                                    {cellValue !== '' ? cellValue : '—'}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Total */}
                          <td className="px-3 py-2 text-center">
                            {row.totalObtained !== null ? (
                              <span className="font-semibold text-deep text-[13px]">
                                {row.totalObtained}<span className="text-muted font-normal">/{maxTotal}</span>
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Percentage */}
                          <td className="px-3 py-2 text-center">
                            {row.percentage !== null ? (
                              <span className={`font-semibold text-[13px] ${
                                row.percentage >= 80 ? 'text-success' :
                                row.percentage >= 60 ? 'text-info-text' :
                                row.percentage >= 40 ? 'text-warning-text' :
                                'text-danger'
                              }`}>
                                {row.percentage}%
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Result */}
                          <td className="px-3 py-2 text-center">
                            {row.result === 'pass' && <Badge color="success">PASS</Badge>}
                            {row.result === 'fail' && <Badge color="danger">FAIL</Badge>}
                            {row.result === 'incomplete' && <Badge color="warning">Incomplete</Badge>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            {viewMode === 'entry' && filteredResults.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-surface/30">
                <p className="text-xs text-muted">
                  Showing {filteredResults.length} of {computedResults.length} student{computedResults.length !== 1 ? 's' : ''} · Use <kbd className="px-1 py-0.5 bg-white border border-border rounded text-[10px]">Tab</kbd> to move between subjects, <kbd className="px-1 py-0.5 bg-white border border-border rounded text-[10px]">Enter</kbd> for next student
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSave('draft')} loading={saving} disabled={saving}>
                    <Save size={14} className="mr-1.5" /> Save Draft
                  </Button>
                  <Button size="sm" onClick={() => handleSave('submitted')} loading={saving} disabled={saving}>
                    <Send size={14} className="mr-1.5" /> Submit Marks
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {!loading && examDetails && students.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={40} className="text-muted mb-3" />
            <h3 className="text-lg font-medium text-deep mb-1">No Students Found</h3>
            <p className="text-sm text-muted max-w-md">
              No active students are assigned to {examDetails.schoolClass?.name || 'the class'} for this exam. Please ensure students are enrolled in the correct class.
            </p>
          </div>
        </Card>
      )}

      {!loading && !examDetails && !examLoading && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={48} className="text-muted mb-4" />
            <h3 className="text-lg font-semibold text-deep mb-2">Select an Exam to Begin</h3>
            <p className="text-sm text-muted max-w-md">
              Choose an exam from the dropdown above. Students from the assigned class will be automatically loaded with a marks entry grid.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Summary Card ──

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3 flex items-center gap-3 shadow-card">
      <div className={`p-2 rounded-lg bg-surface ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[11px] text-muted font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
