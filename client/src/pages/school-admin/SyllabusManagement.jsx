import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  BookOpen, Plus, Search, Filter, RotateCcw, ChevronRight, Eye,
  CheckCircle2, Clock, AlertTriangle, Layers, Award, Edit3, Trash2,
  Send, Archive, ArrowUpRight, TrendingUp, Users, Check, AlertCircle
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { syllabusApi } from '../../api/syllabus.api';
import { academicApi } from '../../api/academic.api';
import { useUserStore } from '../../store/userStore';

export default function SyllabusManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);

  // Filter States
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Dropdown reference data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    schoolClass: '',
    subject: '',
    academicYear: '',
  });

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setClasses(list);
    }).catch(() => {});

    academicApi.getSubjects({ limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSubjects(list);
    }).catch(() => {});

    academicApi.getAcademicYears({ limit: 100 }).then((res) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setAcademicYears(list);
      const active = list.find((a) => a.isCurrent || a.status === 'active') || list[0];
      if (active) {
        setCreateForm((prev) => ({ ...prev, academicYear: prev.academicYear || active._id }));
      }
    }).catch(() => {});
  }, []);

  // Fetch Syllabi List via TanStack Query
  const { data: syllabiData, isLoading: loadingList } = useQuery({
    queryKey: ['syllabi', page, search, classFilter, subjectFilter, statusFilter],
    queryFn: async () => {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        schoolClass: classFilter || undefined,
        subject: subjectFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const res = await syllabusApi.getAll(params);
      return res;
    },
  });

  // Fetch School-wide Analytics via TanStack Query
  const { data: analyticsData } = useQuery({
    queryKey: ['syllabus-analytics'],
    queryFn: async () => {
      const res = await syllabusApi.getAnalytics();
      return res.data;
    },
  });

  const syllabi = syllabiData?.data || [];
  const meta = syllabiData?.meta;
  const kpis = analyticsData?.kpis || { totalSyllabi: 0, publishedSyllabi: 0, activeTracks: 0, averageProgress: 0 };
  const needsAttention = analyticsData?.needsAttention || [];

  const handleCreateSyllabus = async () => {
    if (!createForm.schoolClass || !createForm.subject || !createForm.academicYear) {
      toast.error('Please select Class, Subject, and Academic Year');
      return;
    }
    setCreating(true);
    try {
      const res = await syllabusApi.create(createForm);
      toast.success('Syllabus created in Draft status');
      setCreateOpen(false);
      setCreateForm({ title: '', description: '', schoolClass: '', subject: '', academicYear: '' });
      queryClient.invalidateQueries(['syllabi']);
      queryClient.invalidateQueries(['syllabus-analytics']);
      navigate(`/syllabus/${res.data._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create syllabus');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id, e) => {
    e.stopPropagation();
    try {
      await syllabusApi.publish(id);
      toast.success('Syllabus published successfully');
      queryClient.invalidateQueries(['syllabi']);
      queryClient.invalidateQueries(['syllabus-analytics']);
    } catch (err) {
      toast.error(err?.message || 'Failed to publish syllabus');
    }
  };

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    try {
      await syllabusApi.archive(id);
      toast.success('Syllabus archived');
      queryClient.invalidateQueries(['syllabi']);
      queryClient.invalidateQueries(['syllabus-analytics']);
    } catch (err) {
      toast.error(err?.message || 'Failed to archive syllabus');
    }
  };

  const handleDelete = (id, title, e) => {
    e.stopPropagation();
    Swal.fire({
      title: 'Delete syllabus?',
      text: `${title || 'Syllabus'} will be permanently removed along with its section tracks.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#dc2626',
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await syllabusApi.delete(id);
        toast.success('Syllabus deleted');
        queryClient.invalidateQueries(['syllabi']);
        queryClient.invalidateQueries(['syllabus-analytics']);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete syllabus');
      }
    });
  };

  const renderStatusBadge = (status) => {
    const s = String(status || 'draft').toLowerCase();
    if (s === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Published
        </span>
      );
    }
    if (s === 'archived') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Archived
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Draft
      </span>
    );
  };

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));
  const subjectOptions = subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` }));
  const academicYearOptions = academicYears.map((a) => ({ value: a._id, label: a.name }));

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-forest dark:text-emerald-400" />
            Syllabus & Curriculum Management
          </h1>
          <p className="text-secondary dark:text-dark-text-secondary text-xs mt-1">
            Build structured curriculum syllabi, assign to class sections, and track real teaching completion.
          </p>
        </div>
        {(currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin') && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 shrink-0">
            <Plus size={15} /> Create Syllabus
          </Button>
        )}
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Total Syllabi</span>
          <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">{kpis.totalSyllabi}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Published</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{kpis.publishedSyllabi}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Active Section Tracks</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{kpis.activeTracks}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Avg Completion</span>
          <p className="text-2xl font-bold text-forest dark:text-emerald-400 mt-1">{kpis.averageProgress}%</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search syllabus title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearch(''); setClassFilter(''); setSubjectFilter(''); setStatusFilter('all'); setPage(1); }}
              className="text-xs text-secondary gap-1"
            >
              <RotateCcw size={12} /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Syllabi List + Needs Attention Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Syllabi Table */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-border dark:border-dark-border bg-slate-50/60 dark:bg-dark-elevated">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Curriculum Syllabi Definitions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border dark:border-dark-border text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider bg-slate-50/80 dark:bg-dark-elevated">
                  <th className="px-3.5 py-2.5">Syllabus Title / Subject</th>
                  <th className="px-3.5 py-2.5">Class</th>
                  <th className="px-3.5 py-2.5">Academic Year</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border bg-white dark:bg-dark-card text-xs">
                {loadingList ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i}><td colSpan={5} className="px-3.5 py-3"><div className="h-5 bg-surface dark:bg-dark-hover rounded animate-pulse" /></td></tr>
                  ))
                ) : syllabi.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-xs text-muted dark:text-dark-text-muted">
                      No syllabi definitions found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  syllabi.map((syl) => (
                    <tr
                      key={syl._id}
                      onClick={() => navigate(`/syllabus/${syl._id}`)}
                      className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text">
                        <div>
                          <p className="leading-tight">{syl.title || `${syl.subject?.name} - ${syl.schoolClass?.name}`}</p>
                          <p className="text-[11px] text-muted dark:text-dark-text-muted font-normal mt-0.5">
                            {syl.chapters?.length || 0} chapters • {syl.totalTopicsCount || 0} topics
                          </p>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary font-medium">
                        {syl.schoolClass?.name || '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                        {syl.academicYear?.name || '2026-2027'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {renderStatusBadge(syl.status)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/syllabus/${syl._id}`)}
                          className="p-1.5 text-forest dark:text-emerald-400 hover:bg-forest/10 border border-forest/20 rounded-lg transition-colors"
                          title="View / Edit Builder"
                        >
                          <Eye size={13} />
                        </button>
                        {syl.status === 'draft' && (
                          <button
                            onClick={(e) => handlePublish(syl._id, e)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors"
                            title="Publish Syllabus"
                          >
                            <Send size={13} />
                          </button>
                        )}
                        {(currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin') && (
                          <button
                            onClick={(e) => handleDelete(syl._id, syl.title, e)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            title="Delete Syllabus"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Attention Sidebar */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
            <AlertTriangle size={14} className="text-amber-500" /> Syllabus Needs Attention
          </h2>
          <p className="text-[11px] text-muted dark:text-dark-text-muted">
            Section tracks with the lowest completion percentages requiring curriculum review:
          </p>

          {needsAttention.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {needsAttention.map((track) => (
                <div
                  key={track.trackId}
                  onClick={() => navigate(`/syllabus/tracks/${track.trackId}`)}
                  className="p-3 bg-surface/60 dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl hover:border-forest/40 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex justify-between text-xs font-bold text-deep dark:text-dark-text">
                    <span>{track.className} ({track.sectionName}) — {track.subjectName}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">{track.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-dark-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, track.percentage)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted dark:text-dark-text-muted flex justify-between">
                    <span>Teacher: {track.teacherName}</span>
                    <span className="text-forest dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      Track <ArrowUpRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
              All assigned section tracks are progressing smoothly!
            </p>
          )}
        </div>
      </div>

      {/* Create Syllabus Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Syllabus Definition" size="md">
        <div className="space-y-4">
          <Input
            label="Syllabus Title (Optional)"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="e.g. Class 8 Mathematics Curriculum 2026"
          />
          <Select
            label="Class *"
            placeholder="-- Select Class --"
            options={classOptions}
            value={createForm.schoolClass}
            onChange={(e) => setCreateForm({ ...createForm, schoolClass: e.target.value })}
            helperText={classOptions.length === 0 ? "Loading classes..." : undefined}
          />
          <Select
            label="Subject *"
            placeholder="-- Select Subject --"
            options={subjectOptions}
            value={createForm.subject}
            onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
            helperText={subjectOptions.length === 0 ? "Loading subjects..." : undefined}
          />
          <Select
            label="Academic Year *"
            placeholder="-- Select Academic Year --"
            options={academicYearOptions}
            value={createForm.academicYear}
            onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
            helperText={academicYearOptions.length === 0 ? "Loading academic years..." : undefined}
          />
          <Input
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            placeholder="Curriculum guidelines and learning scope"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSyllabus} loading={creating}>Create & Open Builder</Button>
        </div>
      </Modal>
    </div>
  );
}
