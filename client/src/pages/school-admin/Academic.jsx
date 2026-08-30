import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Edit2, Upload, BookOpen, Layers, Calendar, CheckCircle2,
  Search, RotateCcw, Filter, MoreVertical, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown, Award, Sparkles, BookMarked, UserCheck, UserX, GraduationCap
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';
import BulkImportModal from '../../components/ui/BulkImportModal';

/* ──────────────────────── Academic Years Subtab ──────────────────────── */
function AcademicYears() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await academicApi.getAcademicYears({
          page,
          limit: 10,
          search: search || undefined,
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load academic years');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, sortField, sortOrder]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm({ name: '', startDate: '', endDate: '', isCurrent: false }); setOpen(false); };
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      await academicApi.createAcademicYear({ ...form, isCurrent: form.isCurrent });
      toast.success('Academic year created');
      resetAndClose();
      setPage(1);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to create academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete academic year?',
      text: `${row.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await academicApi.deleteAcademicYear(row._id);
        toast.success('Academic year deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete academic year');
      }
    });
  };

  const currentYear = data.find(y => y.isCurrent);

  return (
    <div className="space-y-4">
      {/* Mini KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-1.5"><Calendar size={15} /></div>
          <p className="text-[11px] font-semibold text-secondary">Total Academic Years</p>
          <p className="text-xl font-bold text-deep mt-0.5">{meta?.total || data.length}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5"><CheckCircle2 size={15} /></div>
          <p className="text-[11px] font-semibold text-secondary">Current Active Session</p>
          <p className="text-xl font-bold text-deep mt-0.5">{currentYear ? currentYear.name : 'None set'}</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search academic years..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5 text-xs"><Plus size={14} /> Add Academic Year</Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th onClick={() => handleSort('name')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>NAME</span><SortIcon field="name" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">START DATE</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">END DATE</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">STATUS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">No academic years found.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-xs text-deep">{row.name}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{new Date(row.startDate).toLocaleDateString()}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{new Date(row.endDate).toLocaleDateString()}</td>
                    <td className="px-3.5 py-2.5">
                      {row.isCurrent ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Current</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">Previous</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === row._id && (
                        <div ref={menuRef} className="absolute right-4 top-10 w-36 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                          <button onClick={() => { setActiveMenuId(null); handleDelete(row); }} className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
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

      <Modal isOpen={open} onClose={resetAndClose} title="Add Academic Year">
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="2026-2027" />
          <Input label="Start date *" type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
          <Input label="End date *" type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setField('isCurrent', e.target.checked)} className="w-4 h-4 accent-forest" />
            Set as current academic year
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ──────────────────────── Classes Subtab ──────────────────────── */
function Classes() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [years, setYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', academicYear: '', classTeacher: '', subjects: [] });
  const [bulkOpen, setBulkOpen] = useState(false);

  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    academicApi.getAcademicYears({ limit: 100 }).then((res) => {
      const fetchedYears = res.data || [];
      setYears(fetchedYears);
      if (fetchedYears.length > 0) {
        const defaultYear = fetchedYears.find((y) => y.isCurrent)?._id || fetchedYears[0]._id;
        setForm((f) => ({ ...f, academicYear: f.academicYear || defaultYear }));
      }
    }).catch(() => { });
    teacherApi.getAll({ limit: 100 }).then((res) => setTeachers(res.data || [])).catch(() => { });
    academicApi.getSubjects({ limit: 100 }).then((res) => setAllSubjects(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await academicApi.getClasses({
          page,
          limit: 10,
          search: search || undefined,
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load classes');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, sortField, sortOrder]);

  const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));
  const teacherMap = Object.fromEntries(teachers.map((t) => [t._id, `${t.firstName} ${t.lastName}`]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const toggleSubject = (subjectId) => {
    setForm((f) => {
      const current = f.subjects || [];
      if (current.includes(subjectId)) {
        return { ...f, subjects: current.filter(id => id !== subjectId) };
      } else {
        return { ...f, subjects: [...current, subjectId] };
      }
    });
  };

  const resetAndClose = () => {
    const defaultYear = years.find((y) => y.isCurrent)?._id || years[0]?._id || '';
    setForm({ name: '', academicYear: defaultYear, classTeacher: '', subjects: [] });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name,
      academicYear: row.academicYear,
      classTeacher: row.classTeacher || '',
      subjects: Array.isArray(row.subjects) ? row.subjects.map(s => s._id || s) : [],
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.academicYear) { toast.error('Class name and academic year are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        academicYear: form.academicYear,
        classTeacher: form.classTeacher || undefined,
        subjects: form.subjects,
      };

      if (editingId) {
        await academicApi.updateClass(editingId, payload);
        toast.success('Class updated successfully');
      } else {
        await academicApi.createClass(payload);
        toast.success('Class created successfully');
      }
      resetAndClose();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete class?',
      text: `${row.name} and its sections will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await academicApi.deleteClass(row._id);
        toast.success('Class deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete class');
      }
    });
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

  return (
    <div className="space-y-4">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-2"><BookOpen size={16} /></div>
          <p className="text-[11px] font-semibold text-secondary">Total Classes</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{meta?.total || data.length}</p>
          <p className="text-[10px] text-muted mt-1">All class sections</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><UserCheck size={16} /></div>
          <p className="text-[11px] font-semibold text-secondary">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{data.filter(d => d.status === 'active').length}</p>
          <p className="text-[10px] text-muted mt-1">Currently running</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2"><UserX size={16} /></div>
          <p className="text-[11px] font-semibold text-secondary">Inactive</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{data.filter(d => d.status !== 'active').length}</p>
          <p className="text-[10px] text-muted mt-1">Not currently active</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><GraduationCap size={16} /></div>
          <p className="text-[11px] font-semibold text-secondary">Subjects</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{allSubjects.length}</p>
          <p className="text-[10px] text-muted mt-1">Unique subjects taught</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1 text-xs"><Upload size={14} /> Bulk Import</Button>
          <Button onClick={() => setOpen(true)} className="gap-1.5 text-xs"><Plus size={14} /> Add Class</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th onClick={() => handleSort('name')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>CLASS</span><SortIcon field="name" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">ACADEMIC YEAR</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">CLASS TEACHER</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SECTIONS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SUBJECTS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={6} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted">No classes found.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-xs text-deep">{row.name}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{yearMap[row.academicYear] || '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">{teacherMap[row.classTeacher] || '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{Array.isArray(row.sections) ? row.sections.length : '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{Array.isArray(row.subjects) ? row.subjects.length : '—'}</td>
                    <td className="px-3.5 py-2.5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === row._id && (
                        <div ref={menuRef} className="absolute right-4 top-10 w-36 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                          <button onClick={() => { setActiveMenuId(null); handleEdit(row); }} className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2">
                            <Edit2 size={13} className="text-muted" /> Edit Class
                          </button>
                          <button onClick={() => { setActiveMenuId(null); handleDelete(row); }} className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Delete Class
                          </button>
                        </div>
                      )}
                    </td>
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

      <Modal isOpen={open} onClose={resetAndClose} title={editingId ? 'Edit Class' : 'Add Class'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Class name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Grade 8" />
            <Select label="Academic year *" options={years.map((y) => ({ value: y._id, label: y.name }))} value={form.academicYear} onChange={(e) => setField('academicYear', e.target.value)} />
          </div>
          <Select label="Class teacher" options={teachers.map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))} value={form.classTeacher} onChange={(e) => setField('classTeacher', e.target.value)} />
          <div className="mt-4">
            <label className="text-sm font-medium text-secondary mb-2 block">Assigned Subjects</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-3 bg-white border border-border rounded-xl">
              {allSubjects.map((s) => {
                const isSelected = form.subjects.includes(s._id);
                return (
                  <button key={s._id} type="button" onClick={() => toggleSubject(s._id)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${isSelected ? 'bg-forest-soft border-forest text-forest' : 'bg-white border-border text-secondary'}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${isSelected ? 'bg-forest text-white' : 'border-border'}`}>{isSelected && '✓'}</span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editingId ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>
      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="classes" onSuccess={() => triggerReload()} />
    </div>
  );
}

/* ──────────────────────── Sections Subtab ──────────────────────── */
function Sections() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', schoolClass: '', roomNo: '', strength: '' });
  const [bulkOpen, setBulkOpen] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => {
      const fetchedClasses = res.data || [];
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) setForm((f) => ({ ...f, schoolClass: f.schoolClass || fetchedClasses[0]._id }));
    }).catch(() => { });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await academicApi.getSections({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load sections');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const resetAndClose = () => {
    setForm({ name: '', schoolClass: classes[0]?._id || '', roomNo: '', strength: '' });
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.schoolClass) { toast.error('Section name and class are required'); return; }
    setSaving(true);
    try {
      await academicApi.createSection({
        name: form.name,
        schoolClass: form.schoolClass,
        roomNo: form.roomNo || undefined,
        strength: form.strength ? Number(form.strength) : undefined
      });
      toast.success('Section created');
      resetAndClose();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete section?',
      text: `Section ${row.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await academicApi.deleteSection(row._id);
        toast.success('Section deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete section');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search sections..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1 text-xs"><Upload size={14} /> Bulk Import</Button>
          <Button onClick={() => setOpen(true)} className="gap-1.5 text-xs"><Plus size={14} /> Add Section</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SECTION</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">CLASS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">ROOM NO</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">STRENGTH</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">No sections found.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-xs text-deep">Section {row.name}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">{classMap[row.schoolClass] || '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{row.roomNo || '—'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{row.strength ?? '—'}</td>
                    <td className="px-3.5 py-2.5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === row._id && (
                        <div ref={menuRef} className="absolute right-4 top-10 w-36 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                          <button onClick={() => { setActiveMenuId(null); handleDelete(row); }} className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Delete Section
                          </button>
                        </div>
                      )}
                    </td>
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

      <Modal isOpen={open} onClose={resetAndClose} title="Add Section">
        <div className="space-y-4">
          <Input label="Section name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="A" />
          <Select label="Class *" options={classes.map((c) => ({ value: c._id, label: c.name }))} value={form.schoolClass} onChange={(e) => setField('schoolClass', e.target.value)} />
          <Input label="Room no" value={form.roomNo} onChange={(e) => setField('roomNo', e.target.value)} placeholder="201" />
          <Input label="Strength / Capacity" type="number" value={form.strength} onChange={(e) => setField('strength', e.target.value)} placeholder="40" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create</Button>
        </div>
      </Modal>
      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="sections" onSuccess={() => triggerReload()} />
    </div>
  );
}

/* ──────────────────────── Subjects Subtab ──────────────────────── */
function Subjects() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'core', maxMarks: 100, passMarks: 33 });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ field: 'maxMarks', value: '' });

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await academicApi.getSubjects({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load subjects');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  const resetAndClose = () => {
    setForm({ name: '', code: '', type: 'core', maxMarks: 100, passMarks: 33 });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name,
      code: row.code,
      type: row.type || 'core',
      maxMarks: row.maxMarks ?? 100,
      passMarks: row.passMarks ?? 33,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Subject name and code are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        maxMarks: Number(form.maxMarks) || 100,
        passMarks: Number(form.passMarks) || 33,
      };

      if (editingId) {
        await academicApi.updateSubject(editingId, payload);
        toast.success('Subject updated');
      } else {
        await academicApi.createSubject(payload);
        toast.success('Subject created');
      }
      resetAndClose();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkEdit = async () => {
    if (!bulkEditForm.value) { toast.error('Please enter a value'); return; }
    setSaving(true);
    try {
      await academicApi.bulkEditSubjects({
        field: bulkEditForm.field,
        value: bulkEditForm.value,
      });
      toast.success('Subjects updated');
      setBulkEditOpen(false);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to bulk update subjects');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete subject?',
      text: `${row.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await academicApi.deleteSubject(row._id);
        toast.success('Subject deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete subject');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1 text-xs"><Upload size={14} /> Bulk Import</Button>
          <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)} className="gap-1 text-xs"><Edit2 size={14} /> Bulk Update</Button>
          <Button onClick={() => setOpen(true)} className="gap-1.5 text-xs"><Plus size={14} /> Add Subject</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">CODE</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">NAME</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">TYPE</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">MAX MARKS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}><td colSpan={5} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted">No subjects found.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-xs text-deep font-mono">{row.code}</td>
                    <td className="px-3.5 py-2.5 text-xs font-semibold text-deep">{row.name}</td>
                    <td className="px-3.5 py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${row.type === 'core' ? 'bg-forest-soft text-forest border-forest/20' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary">{row.maxMarks ?? '—'}</td>
                    <td className="px-3.5 py-2.5 text-right relative">
                      <button onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)} className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors">
                        <MoreVertical size={14} />
                      </button>
                      {activeMenuId === row._id && (
                        <div ref={menuRef} className="absolute right-4 top-10 w-36 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                          <button onClick={() => { setActiveMenuId(null); handleEdit(row); }} className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2">
                            <Edit2 size={13} className="text-muted" /> Edit Subject
                          </button>
                          <button onClick={() => { setActiveMenuId(null); handleDelete(row); }} className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={13} /> Delete Subject
                          </button>
                        </div>
                      )}
                    </td>
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

      <Modal isOpen={open} onClose={resetAndClose} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Mathematics" />
          <Input label="Code *" value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="MATH" />
          <Select label="Type" options={[{ value: 'core', label: 'Core' }, { value: 'elective', label: 'Elective' }, { value: 'co-curricular', label: 'Co-curricular' }]} value={form.type} onChange={(e) => setField('type', e.target.value)} />
          <Input label="Max marks" type="number" value={form.maxMarks} onChange={(e) => setField('maxMarks', e.target.value)} />
          <Input label="Pass marks" type="number" value={form.passMarks} onChange={(e) => setField('passMarks', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editingId ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <Modal isOpen={bulkEditOpen} onClose={() => setBulkEditOpen(false)} title="Bulk Update Subjects">
        <div className="space-y-4">
          <Select label="Field to update *" options={[{ value: 'maxMarks', label: 'Max Marks' }, { value: 'passMarks', label: 'Pass Marks' }, { value: 'type', label: 'Type' }]} value={bulkEditForm.field} onChange={(e) => setBulkEditForm({ field: e.target.value, value: '' })} />
          <Input label="New Value *" type="number" value={bulkEditForm.value} onChange={(e) => setBulkEditForm({ ...bulkEditForm, value: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkEdit} loading={saving}>Update All</Button>
        </div>
      </Modal>

      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="subjects" onSuccess={() => triggerReload()} />
    </div>
  );
}

/* ──────────────────────── Main Component ──────────────────────── */
const TABS = [
  { key: 'years', label: 'Academic Years' },
  { key: 'classes', label: 'Classes' },
  { key: 'sections', label: 'Sections' },
  { key: 'subjects', label: 'Subjects' },
];

export default function Academic() {
  const [activeTab, setActiveTab] = useState('years');

  return (
    <div className="space-y-4 w-full">
      {/* Page Header */}
      <div className="pb-1">
        <h1 className="text-xl font-bold text-deep tracking-tight">Academic Structure</h1>
        <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
          Manage academic sessions, classes, sections, and subjects offered.
        </p>
      </div>

      {/* Segmented Section Navigation */}
      <div className="flex items-center gap-1 border-b border-border/80 pb-3 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
              activeTab === t.key
                ? 'bg-forest text-white font-semibold shadow-2xs'
                : 'text-secondary hover:bg-surface hover:text-deep font-medium'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="pt-1">
        {activeTab === 'years' && <AcademicYears />}
        {activeTab === 'classes' && <Classes />}
        {activeTab === 'sections' && <Sections />}
        {activeTab === 'subjects' && <Subjects />}
      </div>
    </div>
  );
}
