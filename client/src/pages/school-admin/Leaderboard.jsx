import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Trophy, Award, Users, CheckCircle, XCircle, AlertCircle, TrendingUp,
  BarChart3, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  Printer, Download, Edit3, ChevronRight, School, Calendar, BookOpen,
  UserCheck, RefreshCw, FileText,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import UserAvatar from '../../components/ui/UserAvatar';
import { examApi } from '../../api/exam.api';
import { useUserStore } from '../../store/userStore';
import ReportCardModal from '../../components/exams/ReportCardModal';

// ── Helpers ──

const getInitials = (firstName = '', lastName = '') => {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}` || 'S';
};

const getAvatarBg = (name = '') => {
  const colors = [
    'bg-forest/10 text-forest border-forest/20',
    'bg-info-light text-info-text border-info/20',
    'bg-sage text-forest border-forest/20',
    'bg-warning-light text-warning-text border-warning/20',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  const initialExamId = searchParams.get('examId') || '';

  // State
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report Card Modal State
  const [reportCardExam, setReportCardExam] = useState(null);
  const [reportCardStudentId, setReportCardStudentId] = useState(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all'); // 'all' | 'pass' | 'fail' | 'incomplete'
  const [filterSection, setFilterSection] = useState('all');
  const [sortBy, setSortBy] = useState('rank'); // 'rank' | 'percentage' | 'total' | 'name' | 'roll'
  const [sortDir, setSortDir] = useState('asc');

  // Load all exams for selector
  useEffect(() => {
    examApi.getAll({ limit: 200 })
      .then((res) => {
        const list = res.data || [];
        setExams(list);
        setExamLoading(false);
        if (!selectedExamId && list.length > 0) {
          setSelectedExamId(list[0]._id);
        }
      })
      .catch(() => {
        toast.error('Failed to load exams list');
        setExamLoading(false);
      });
  }, []);

  // Fetch results when exam changes
  const loadResults = async (examId) => {
    if (!examId) {
      setExamData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await examApi.getExamResults(examId);
      setExamData(res.data);
    } catch (e) {
      setError(e?.message || 'Failed to load leaderboard data');
      toast.error(e?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      setSearchParams({ examId: selectedExamId }, { replace: true });
      loadResults(selectedExamId);
    }
  }, [selectedExamId]);

  // Extract distinct sections from results
  const sectionsList = useMemo(() => {
    if (!examData?.results) return [];
    const set = new Set();
    examData.results.forEach((r) => {
      if (r.student?.section?.name) set.add(r.student.section.name);
    });
    return Array.from(set).sort();
  }, [examData]);

  // Current logged in student match
  const currentStudentResult = useMemo(() => {
    if (!user || user.role !== 'student' || !examData?.results) return null;
    return examData.results.find(
      (r) =>
        (user.profileId && String(r.student._id) === String(user.profileId)) ||
        (r.student.admissionNo && r.student.admissionNo.toLowerCase() === (user.email || '').toLowerCase()) ||
        (`${r.student.firstName} ${r.student.lastName}`.trim().toLowerCase() === (user.name || '').trim().toLowerCase())
    );
  }, [user, examData]);

  // Top 3 Podium Students (ranked complete results)
  const podiumStudents = useMemo(() => {
    if (!examData?.results) return [];
    const complete = examData.results.filter((r) => r.result !== 'incomplete' && r.rank !== null);
    // Sort by rank ascending
    complete.sort((a, b) => a.rank - b.rank);
    return complete.slice(0, 3);
  }, [examData]);

  // Filtered and sorted results for table
  const processedResults = useMemo(() => {
    if (!examData?.results) return [];
    let items = [...examData.results];

    // Filter by Result
    if (filterResult === 'pass') items = items.filter((r) => r.result === 'pass');
    else if (filterResult === 'fail') items = items.filter((r) => r.result === 'fail');
    else if (filterResult === 'incomplete') items = items.filter((r) => r.result === 'incomplete');

    // Filter by Section
    if (filterSection !== 'all') {
      items = items.filter((r) => r.student?.section?.name === filterSection);
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter((r) => {
        const name = `${r.student.firstName || ''} ${r.student.lastName || ''}`.toLowerCase();
        const roll = String(r.student.rollNo || '');
        const admission = (r.student.admissionNo || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || admission.includes(q);
      });
    }

    // Sorting
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'rank') {
        if (a.rank !== null && b.rank !== null) cmp = a.rank - b.rank;
        else if (a.rank !== null) cmp = -1;
        else if (b.rank !== null) cmp = 1;
        else cmp = (a.student.rollNo || 0) - (b.student.rollNo || 0);
      } else if (sortBy === 'percentage') {
        const pA = a.percentage ?? -1;
        const pB = b.percentage ?? -1;
        cmp = pB - pA;
      } else if (sortBy === 'total') {
        const tA = a.totalObtained ?? -1;
        const tB = b.totalObtained ?? -1;
        cmp = tB - tA;
      } else if (sortBy === 'name') {
        const nA = `${a.student.firstName} ${a.student.lastName}`;
        const nB = `${b.student.firstName} ${b.student.lastName}`;
        cmp = nA.localeCompare(nB);
      } else if (sortBy === 'roll') {
        cmp = (a.student.rollNo || 0) - (b.student.rollNo || 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [examData, filterResult, filterSection, searchTerm, sortBy, sortDir]);

  // Sorting Toggle
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-muted/60" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-forest" />
    ) : (
      <ArrowDown size={12} className="text-forest" />
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!examData || !processedResults.length) return;
    const headers = ['Rank', 'Student Name', 'Admission No', 'Roll No', 'Section', 'Total Marks', 'Max Marks', 'Percentage', 'Result'];
    const rows = processedResults.map((r) => [
      r.rank !== null ? r.rank : 'Incomplete',
      `"${r.student.firstName} ${r.student.lastName}"`,
      `"${r.student.admissionNo || ''}"`,
      r.student.rollNo || '',
      r.student.section?.name || '',
      r.totalObtained !== null ? r.totalObtained : '',
      examData.maxTotal,
      r.percentage !== null ? `${r.percentage}%` : '',
      r.result.toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${examData.exam.name}_Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leaderboard exported to CSV');
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const summary = examData?.summary || {};
  const hasMarks = examData?.results?.some((r) => r.result !== 'incomplete' || r.totalObtained !== null);

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Page Header */}
      <div className="print:hidden">
        <PageHeader
          title="Exam Leaderboard"
          description="Academic standing, performance rankings, and class distribution"
          action={
            <div className="flex flex-wrap items-center gap-2">
              {examData && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download size={14} className="mr-1.5" /> Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer size={14} className="mr-1.5" /> Print
                  </Button>
                </>
              )}
              {user?.role !== 'student' && user?.role !== 'parent' && selectedExamId && (
                <Button size="sm" onClick={() => navigate(`/marks-entry?examId=${selectedExamId}`)}>
                  <Edit3 size={14} className="mr-1.5" /> Marks Entry
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Exam Selector Bar */}
      <Card className="print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Select
              label="Select Examination"
              placeholder="Choose an exam..."
              options={exams.map((e) => ({
                value: e._id,
                label: `${e.name}`,
              }))}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={examLoading}
            />
          </div>

          {examData && (
            <div className="flex flex-wrap items-center gap-2.5 text-sm pt-2 lg:pt-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border">
                <School size={14} className="text-forest" />
                <span className="font-semibold text-deep">{examData.exam.schoolClass?.name || 'Class'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border">
                <Calendar size={14} className="text-secondary" />
                <span className="text-secondary">{examData.exam.academicYear?.name || 'Academic Year'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border">
                <BookOpen size={14} className="text-secondary" />
                <span className="text-secondary">{examData.subjects?.length || 0} Subjects ({examData.maxTotal} Marks)</span>
              </div>
              <Badge color={examData.exam.status === 'published' ? 'success' : examData.exam.status === 'completed' ? 'gray' : 'info'}>
                {examData.exam.status}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Print-Only Header */}
      {examData && (
        <div className="hidden print:block border-b border-border pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-deep uppercase tracking-wide">Instique School ERP</h1>
              <h2 className="text-lg font-semibold text-deep mt-1">{examData.exam.name} — Official Leaderboard</h2>
              <p className="text-xs text-secondary mt-0.5">
                Class: {examData.exam.schoolClass?.name || '—'} · Academic Year: {examData.exam.academicYear?.name || '—'} · Total Marks: {examData.maxTotal}
              </p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Total Students: {summary.totalStudents || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white border border-border rounded-xl animate-pulse p-4" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white border border-border rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white border border-border rounded-xl animate-pulse" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={40} className="text-danger mb-3" />
            <h3 className="text-lg font-semibold text-deep mb-1">Unable to Load Leaderboard</h3>
            <p className="text-sm text-muted max-w-md mb-4">
              Something went wrong while retrieving examination results.
            </p>
            <Button size="sm" onClick={() => loadResults(selectedExamId)}>
              <RefreshCw size={14} className="mr-1.5" /> Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State: No Marks Entered */}
      {!loading && !error && examData && !hasMarks && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-sage-soft flex items-center justify-center text-forest mb-4">
              <Trophy size={28} />
            </div>
            <h3 className="text-lg font-semibold text-deep mb-1">No Leaderboard Available Yet</h3>
            <p className="text-sm text-secondary max-w-md mb-6">
              Marks have not been entered for <strong>{examData.exam.name}</strong>. Once subject marks are entered, the leaderboard and rankings will automatically calculate.
            </p>
            {user?.role !== 'student' && user?.role !== 'parent' && (
              <Button onClick={() => navigate(`/marks-entry?examId=${selectedExamId}`)}>
                <Edit3 size={16} className="mr-2" /> Enter Marks
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Main Leaderboard Content */}
      {!loading && !error && examData && hasMarks && (
        <>
          {/* ── Summary Statistics Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              icon={Users}
              label="Total Students"
              value={summary.totalStudents || 0}
              sub={`${summary.completed || 0} evaluated`}
              color="text-deep"
            />
            <StatCard
              icon={CheckCircle}
              label="Passed"
              value={summary.passed || 0}
              sub={summary.completed ? `${Math.round((summary.passed / summary.completed) * 100)}% pass rate` : '—'}
              color="text-success"
            />
            <StatCard
              icon={XCircle}
              label="Failed"
              value={summary.failed || 0}
              sub={summary.failed ? `${summary.failed} student${summary.failed > 1 ? 's' : ''}` : 'None'}
              color="text-danger"
            />
            <StatCard
              icon={AlertCircle}
              label="Incomplete"
              value={summary.incomplete || 0}
              sub="Pending marks"
              color="text-warning-text"
            />
            <StatCard
              icon={BarChart3}
              label="Class Average"
              value={summary.classAverage !== null ? `${summary.classAverage}%` : '—'}
              sub="Overall performance"
              color="text-info-text"
            />
            <StatCard
              icon={TrendingUp}
              label="Highest Score"
              value={summary.highestPercentage !== null ? `${summary.highestPercentage}%` : '—'}
              sub={summary.lowestPercentage !== null ? `Low: ${summary.lowestPercentage}%` : '—'}
              color="text-forest"
            />
          </div>

          {/* ── Current Student Highlight Card (if logged in user is student) ── */}
          {currentStudentResult && (
            <div className="bg-forest/5 border-2 border-forest/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-forest text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {currentStudentResult.rank !== null ? `#${currentStudentResult.rank}` : '—'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded-md">
                      Your Academic Standing
                    </span>
                    {currentStudentResult.result === 'pass' && <Badge color="success">PASS</Badge>}
                    {currentStudentResult.result === 'fail' && <Badge color="danger">FAIL</Badge>}
                  </div>
                  <h4 className="text-base font-bold text-deep mt-0.5">
                    {currentStudentResult.student.firstName} {currentStudentResult.student.lastName}
                  </h4>
                  <p className="text-xs text-secondary">
                    Roll No: {currentStudentResult.student.rollNo || '—'} · Admission: {currentStudentResult.student.admissionNo || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <p className="text-[11px] text-muted uppercase font-medium">Total Marks</p>
                  <p className="text-lg font-bold text-deep">
                    {currentStudentResult.totalObtained !== null ? currentStudentResult.totalObtained : '—'}
                    <span className="text-xs font-normal text-muted">/{examData.maxTotal}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted uppercase font-medium">Percentage</p>
                  <p className="text-lg font-bold text-forest">
                    {currentStudentResult.percentage !== null ? `${currentStudentResult.percentage}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Top 3 Performers Academic Podium ── */}
          {podiumStudents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Award size={18} className="text-forest" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-deep">
                  Top Academic Performers
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* 2nd Place (Left) */}
                {podiumStudents[1] ? (
                  <PodiumCard
                    position={2}
                    data={podiumStudents[1]}
                    maxTotal={examData.maxTotal}
                    accent="slate"
                  />
                ) : (
                  <div className="hidden md:block" />
                )}

                {/* 1st Place (Center - Prominent) */}
                {podiumStudents[0] && (
                  <PodiumCard
                    position={1}
                    data={podiumStudents[0]}
                    maxTotal={examData.maxTotal}
                    accent="gold"
                    isFirst
                  />
                )}

                {/* 3rd Place (Right) */}
                {podiumStudents[2] ? (
                  <PodiumCard
                    position={3}
                    data={podiumStudents[2]}
                    maxTotal={examData.maxTotal}
                    accent="bronze"
                  />
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            </div>
          )}

          {/* ── Main Leaderboard Table & Filters ── */}
          <Card padding={false}>
            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-border bg-white rounded-t-card print:hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Section Filter (if multiple sections exist) */}
                  {sectionsList.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted font-medium">Section:</span>
                      <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-deep text-xs font-medium focus:outline-none focus:ring-2 focus:ring-forest/30"
                      >
                        <option value="all">All Sections</option>
                        {sectionsList.map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Result Status Filter */}
                  <div className="flex items-center rounded-lg bg-surface p-0.5">
                    {['all', 'pass', 'fail', 'incomplete'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterResult(f)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          filterResult === f
                            ? 'bg-white text-forest shadow-card'
                            : 'text-muted hover:text-deep'
                        }`}
                      >
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Sort Selector for mobile */}
                  <div className="flex sm:hidden items-center gap-1.5 text-xs ml-auto">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 bg-surface border border-border rounded-lg text-deep text-xs font-medium focus:outline-none"
                    >
                      <option value="rank">Sort by Rank</option>
                      <option value="percentage">Sort by %</option>
                      <option value="total">Sort by Total</option>
                      <option value="name">Sort by Name</option>
                      <option value="roll">Sort by Roll</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface/80 border-b border-border">
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-16 cursor-pointer select-none"
                      onClick={() => toggleSort('rank')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Rank <SortIcon field="rank" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider min-w-[200px] cursor-pointer select-none"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Student <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-20 cursor-pointer select-none"
                      onClick={() => toggleSort('roll')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Roll No. <SortIcon field="roll" />
                      </div>
                    </th>
                    {sectionsList.length > 0 && (
                      <th className="px-3 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-20">
                        Section
                      </th>
                    )}
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-32 cursor-pointer select-none"
                      onClick={() => toggleSort('total')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Total Marks <SortIcon field="total" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-28 cursor-pointer select-none"
                      onClick={() => toggleSort('percentage')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Percentage <SortIcon field="percentage" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider w-24">
                      Result
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider w-28">
                      Report Card
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 bg-white">
                  {processedResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted">
                        No students match the current filters.
                      </td>
                    </tr>
                  ) : (
                    processedResults.map((row) => {
                      const isCurrentUser =
                        user?.role === 'student' &&
                        ((user.profileId && String(row.student._id) === String(user.profileId)) ||
                          `${row.student.firstName} ${row.student.lastName}`.trim().toLowerCase() === (user.name || '').trim().toLowerCase());

                      const isFirst = row.rank === 1;
                      const isSecond = row.rank === 2;
                      const isThird = row.rank === 3;
                      const isIncomplete = row.result === 'incomplete';
                      const isFailed = row.result === 'fail';

                      return (
                        <tr
                          key={row.student._id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-forest/10 border-l-4 border-l-forest font-medium'
                              : isFirst
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : isSecond
                              ? 'bg-slate-50/60 hover:bg-slate-100/60'
                              : isThird
                              ? 'bg-amber-50/20 hover:bg-amber-50/40'
                              : isFailed
                              ? 'hover:bg-rose-50/20'
                              : isIncomplete
                              ? 'hover:bg-surface/50 text-secondary'
                              : 'hover:bg-surface/50'
                          }`}
                        >
                          {/* Rank Column */}
                          <td className="px-4 py-3 text-center">
                            {row.rank !== null ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  isFirst
                                    ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300'
                                    : isSecond
                                    ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300'
                                    : isThird
                                    ? 'bg-amber-100/70 text-amber-800 ring-1 ring-amber-200'
                                    : 'bg-surface text-secondary'
                                }`}
                              >
                                {row.rank}
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Student Name & Avatar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                type="student"
                                gender={row.student.gender}
                                id={row.student._id}
                                admissionNo={row.student.admissionNo}
                                name={`${row.student.firstName} ${row.student.lastName}`}
                                size="sm"
                                className="shrink-0 ring-1 ring-border/50"
                              />
                              <div>
                                <div className="font-semibold text-deep flex items-center gap-1.5">
                                  <span>{row.student.firstName} {row.student.lastName}</span>
                                  {isCurrentUser && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-forest text-white font-medium">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted">
                                  {row.student.admissionNo || '—'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Roll No */}
                          <td className="px-3 py-3 text-center text-secondary font-medium text-xs">
                            {row.student.rollNo || '—'}
                          </td>

                          {/* Section */}
                          {sectionsList.length > 0 && (
                            <td className="px-3 py-3 text-center text-secondary text-xs">
                              {row.student.section?.name || '—'}
                            </td>
                          )}

                          {/* Total Marks */}
                          <td className="px-4 py-3 text-center">
                            {row.totalObtained !== null ? (
                              <span className="font-semibold text-deep text-[13px]">
                                {row.totalObtained}
                                <span className="text-muted font-normal text-xs">/{examData.maxTotal}</span>
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Percentage */}
                          <td className="px-4 py-3 text-center">
                            {row.percentage !== null ? (
                              <span
                                className={`font-bold text-[13px] ${
                                  row.percentage >= 85
                                    ? 'text-forest'
                                    : row.percentage >= 70
                                    ? 'text-info-text'
                                    : row.percentage >= 40
                                    ? 'text-warning-text'
                                    : 'text-danger'
                                }`}
                              >
                                {row.percentage.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>

                          {/* Result Badge */}
                          <td className="px-4 py-3 text-center">
                            {row.result === 'pass' && <Badge color="success">PASS</Badge>}
                            {row.result === 'fail' && <Badge color="danger">FAIL</Badge>}
                            {row.result === 'incomplete' && <Badge color="warning">Incomplete</Badge>}
                          </td>
                          
                          {/* Report Card Generator Button */}
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setReportCardExam(examData.exam);
                                setReportCardStudentId(row.student._id);
                              }}
                              className="px-2.5 py-1 text-xs bg-forest-soft text-forest hover:bg-forest hover:text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                              title="Generate Report Card"
                            >
                              <FileText size={12} /> Card
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-border bg-surface/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
              <span>
                Showing {processedResults.length} of {examData.results.length} students
              </span>
              <span className="text-[11px]">
                Rankings determined by official percentage with standard academic tie rules
              </span>
            </div>
          </Card>
        </>
      )}

      <ReportCardModal
        isOpen={!!reportCardExam}
        onClose={() => { setReportCardExam(null); setReportCardStudentId(null); }}
        exam={reportCardExam}
        studentId={reportCardStudentId}
      />
    </div>
  );
}

// ── Summary Stat Card ──

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3.5 shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-lg bg-surface ${color}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        {sub && <p className="text-[11px] text-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Top 3 Podium Card Component ──

function PodiumCard({ position, data, maxTotal, accent, isFirst = false }) {
  const rankColors = {
    gold: {
      card: 'bg-gradient-to-b from-amber-50/70 to-white border-amber-300 ring-2 ring-amber-400/30',
      badge: 'bg-amber-500 text-white',
      pill: 'bg-amber-100 text-amber-900 border-amber-300',
      ring: 'ring-amber-300',
      rankLabel: '1st Place',
    },
    slate: {
      card: 'bg-gradient-to-b from-slate-50/70 to-white border-slate-300 ring-1 ring-slate-300/40',
      badge: 'bg-slate-500 text-white',
      pill: 'bg-slate-100 text-slate-800 border-slate-300',
      ring: 'ring-slate-300',
      rankLabel: '2nd Place',
    },
    bronze: {
      card: 'bg-gradient-to-b from-amber-50/30 to-white border-amber-200 ring-1 ring-amber-200/40',
      badge: 'bg-amber-700 text-white',
      pill: 'bg-amber-100/60 text-amber-900 border-amber-200',
      ring: 'ring-amber-200',
      rankLabel: '3rd Place',
    },
  };

  const currentTheme = rankColors[accent] || rankColors.gold;

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 text-center flex flex-col justify-between shadow-card transition-all relative ${
        currentTheme.card
      } ${isFirst ? 'md:-translate-y-2 md:shadow-card-hover' : ''}`}
    >
      {/* Position Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentTheme.pill}`}
        >
          <Award size={12} />
          {currentTheme.rankLabel}
        </span>
        <span className="text-xs font-semibold text-secondary">
          Roll #{data.student.rollNo || '—'}
        </span>
      </div>

      {/* Student Details */}
      <div className="flex flex-col items-center my-2">
        <UserAvatar
          type="student"
          gender={data.student.gender}
          id={data.student._id}
          admissionNo={data.student.admissionNo}
          name={`${data.student.firstName} ${data.student.lastName}`}
          size="lg"
          className={`mb-2 ring-2 ${currentTheme.ring} shadow-md`}
        />
        <h4 className="text-base font-bold text-deep line-clamp-1">
          {data.student.firstName} {data.student.lastName}
        </h4>
        <p className="text-xs text-muted">{data.student.admissionNo || ''}</p>
      </div>

      {/* Scores */}
      <div className="mt-3 pt-3 border-t border-border/70 flex items-center justify-around bg-surface/50 rounded-xl py-2 px-3">
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted">Total</p>
          <p className="text-sm font-bold text-deep">
            {data.totalObtained}
            <span className="text-[10px] text-muted font-normal">/{maxTotal}</span>
          </p>
        </div>
        <div className="h-6 w-px bg-border" />
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted">Score</p>
          <p className="text-sm font-bold text-forest">{data.percentage.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}
