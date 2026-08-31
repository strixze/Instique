import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Upload, Users, UserCheck, UserX,
  Search, RotateCcw, MoreVertical, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown, GraduationCap,
  Key, Mail, AlertTriangle, UserX as UserXIcon,
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { studentApi } from '../../api/student.api';
import { academicApi } from '../../api/academic.api';
import { feeApi } from '../../api/fee.api';
import BulkImportModal from '../../components/ui/BulkImportModal';
import UserAvatar from '../../components/ui/UserAvatar';

/* ──────────────────────── Constants ──────────────────────── */

const STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm = {
  firstName: '',
  lastName: '',
  admissionNo: '',
  gender: 'male',
  dateOfBirth: '',
  currentClass: '',
  currentSection: '',
  phone: '',
  email: '',
  feeStructure: '',
};

export default function Students() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Entities
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  // Modals
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Parent Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedStudentForReset, setSelectedStudentForReset] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Action menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => { });
    academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => { });
    feeApi.getStructures({ limit: 100 }).then((res) => setFeeStructures(res.data)).catch(() => { });
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
        if (classFilter) params.currentClass = classFilter;
        if (genderFilter && genderFilter !== 'all') params.gender = genderFilter;

        const res = await studentApi.getAll(params);
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load students');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, statusFilter, classFilter, genderFilter, sortField, sortOrder]);

  /* ──────────────────────── Maps & Helpers ──────────────────────── */

  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm(emptyForm); setOpen(false); };
  const triggerReload = () => { setLoading(true); setReload((r) => r + 1); };

  /* ──────────────────────── Filter Helpers ──────────────────────── */

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('');
    setGenderFilter('all');
    setPage(1);
    setLoading(true);
  };

  const countActiveFilters = () => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (classFilter) count++;
    if (genderFilter && genderFilter !== 'all') count++;
    if (search) count++;
    return count;
  };

  /* ──────────────────────── Sorting ──────────────────────── */

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  /* ──────────────────────── KPI Stats ──────────────────────── */

  const totalCount = meta?.total || 0;
  const activeCount = data.filter(s => s.status === 'active').length;
  const inactiveCount = data.filter(s => s.status !== 'active').length;
  const maleCount = data.filter(s => s.gender === 'male').length;
  const femaleCount = data.filter(s => s.gender === 'female').length;

  /* ──────────────────────── CRUD ──────────────────────── */

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.admissionNo || !form.dateOfBirth) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await studentApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        admissionNo: form.admissionNo,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        currentClass: form.currentClass || undefined,
        currentSection: form.currentSection || undefined,
        contact: { phone: form.phone || undefined, email: form.email || undefined },
        feeStructure: form.feeStructure || undefined,
      });
      toast.success('Student created');
      resetAndClose();
      setPage(1);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (student) => {
    Swal.fire({
      title: 'Delete student?',
      text: `${student.firstName} ${student.lastName} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await studentApi.delete(student._id);
        toast.success('Student deleted');
        triggerReload();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete student');
      }
    });
  };

  /* ──────────────────────── Parent Password Reset ──────────────────────── */

  const handleOpenParentReset = (student) => {
    setActiveMenuId(null);
    const parents = student.parents || [];
    if (parents.length === 0) {
      toast.error('No parent account linked to this student');
      return;
    }

    const primaryParent = parents.find((p) => p.isPrimary) || parents[0];
    setSelectedStudentForReset(student);
    setSelectedParentId(primaryParent._id);
    setResetModalOpen(true);
  };

  const handleConfirmSendReset = async () => {
    if (!selectedStudentForReset) return;
    setSendingReset(true);
    try {
      const res = await studentApi.sendParentPasswordReset(
        selectedStudentForReset._id,
        selectedParentId || undefined
      );
      toast.success(res.message || 'Password reset link sent successfully via Brevo');
      setResetModalOpen(false);
      setSelectedStudentForReset(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to send password reset email');
    } finally {
      setSendingReset(false);
    }
  };

  /* ──────────────────────── Render Helpers ──────────────────────── */

  const renderGender = (gender) => {
    if (gender === 'female') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-600">
          Female
        </span>
      );
    }
    if (gender === 'male') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
          Male
        </span>
      );
    }
    return <span className="text-xs text-muted capitalize">{gender || '—'}</span>;
  };

  const renderStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border">
        {status || 'Inactive'}
      </span>
    );
  };

  const renderParentAccountCell = (parents = []) => {
    if (!parents || parents.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted dark:text-dark-text-muted bg-slate-50 dark:bg-dark-elevated px-2 py-0.5 rounded border border-slate-200 dark:border-dark-border">
          Not Linked
        </span>
      );
    }

    const primary = parents.find((p) => p.isPrimary) || parents[0];
    const status = primary.accountStatus || 'NOT_LINKED';

    let badgeColor = 'bg-slate-50 dark:bg-dark-elevated text-slate-600 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border';
    let label = 'Not Linked';

    if (status === 'ACTIVE') {
      badgeColor = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-semibold';
      label = '● Active';
    } else if (status === 'PENDING_ACTIVATION') {
      badgeColor = 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 font-semibold';
      label = '● Pending Activation';
    } else if (status === 'SUSPENDED') {
      badgeColor = 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 font-semibold';
      label = '● Suspended';
    }

    return (
      <div>
        <p className="text-xs font-bold text-deep dark:text-dark-text leading-tight truncate max-w-44">
          {primary.firstName} {primary.lastName}
          {primary.relation ? <span className="text-[10px] text-muted dark:text-dark-text-muted font-normal ml-1">({primary.relation})</span> : ''}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-flex items-center px-1.5 py-0.2 text-[10px] rounded border ${badgeColor}`}>
            {label}
          </span>
          {primary.contact?.email && (
            <span className="text-[10px] text-muted dark:text-dark-text-muted truncate max-w-28" title={primary.contact.email}>
              {primary.contact.email}
            </span>
          )}
        </div>
      </div>
    );
  };

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));
  const sectionOptions = sections
    .filter((s) => !form.currentClass || s.schoolClass === form.currentClass)
    .map((s) => ({ value: s._id, label: s.name }));

  /* ──────────────────────── RENDER ──────────────────────── */

  return (
    <div className="space-y-4 w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">Students</h1>
          <p className="text-secondary dark:text-dark-text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            Manage student records, enrollment, parent accounts, and academic information.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="gap-1.5">
            <Upload size={14} /> Bulk Import
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus size={15} /> Add Student
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-emerald-400 flex items-center justify-center mb-2">
            <Users size={15} strokeWidth={1.8} />
          </div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Total Students</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{totalCount}</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <UserCheck size={15} strokeWidth={1.8} />
          </div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{activeCount}</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <UserX size={15} strokeWidth={1.8} />
          </div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Inactive</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{inactiveCount}</p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <GraduationCap size={15} strokeWidth={1.8} />
          </div>
          <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Gender Split</p>
          <p className="text-2xl font-bold text-deep dark:text-dark-text leading-none mt-1">{maleCount}M / {femaleCount}F</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold text-muted dark:text-dark-text-muted text-[11px]">Class</span>
              <select
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold text-muted dark:text-dark-text-muted text-[11px]">Gender</span>
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500"
              >
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs text-secondary dark:text-dark-text-secondary gap-1">
              <RotateCcw size={12} /> Reset
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 dark:border-dark-border flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-muted dark:text-dark-text-muted text-[11px] uppercase tracking-wide mr-1">Status:</span>
          <div className="flex flex-wrap gap-1">
            {STATUS_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${isActive
                    ? 'bg-forest dark:bg-emerald-500 text-white dark:text-gray-900 shadow-2xs'
                    : 'text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text'
                    }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-dark-border bg-slate-50/80 dark:bg-dark-elevated">
                <th onClick={() => handleSort('admissionNo')} className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-deep dark:hover:text-dark-text select-none">
                  <div className="flex items-center gap-1"><span>Adm No.</span><SortIcon field="admissionNo" /></div>
                </th>
                <th onClick={() => handleSort('firstName')} className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:text-deep dark:hover:text-dark-text select-none">
                  <div className="flex items-center gap-1"><span>Student</span><SortIcon field="firstName" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Class & Section</th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Parent Account</th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-dark-border bg-white dark:bg-dark-card">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}><td colSpan={6} className="px-3.5 py-3"><div className="h-5 bg-surface dark:bg-dark-hover rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-xs text-muted dark:text-dark-text-muted">No students found matching the selected criteria.</td></tr>
              ) : (
                data.map((row) => {
                  const parents = row.parents || [];
                  const primaryParent = parents.find((p) => p.isPrimary) || parents[0];
                  const hasParent = parents.length > 0;
                  const isParentActive = primaryParent?.accountStatus === 'ACTIVE';

                  return (
                    <tr key={row._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-xs text-deep dark:text-dark-text font-mono">{row.admissionNo || '—'}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            type="student"
                            gender={row.gender}
                            id={row._id}
                            admissionNo={row.admissionNo}
                            name={`${row.firstName} ${row.lastName}`}
                            size="sm"
                            className="shrink-0 ring-1 ring-border/50 dark:ring-dark-border"
                          />
                          <div>
                            <p className="font-bold text-xs text-deep dark:text-dark-text leading-tight">{row.firstName} {row.lastName}</p>
                            {row.contact?.phone && <p className="text-[11px] text-muted dark:text-dark-text-muted leading-tight mt-0.5">{row.contact.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-xs text-secondary dark:text-dark-text-secondary font-medium">
                        {classMap[row.currentClass?._id || row.currentClass] || '—'} {sectionMap[row.currentSection?._id || row.currentSection] ? `(${sectionMap[row.currentSection?._id || row.currentSection]})` : ''}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {renderParentAccountCell(row.parents)}
                      </td>
                      <td className="px-3.5 py-2.5">{renderStatusBadge(row.status)}</td>
                      <td className="px-3.5 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                            className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text hover:bg-surface dark:hover:bg-dark-hover border border-border dark:border-dark-border rounded-lg transition-colors cursor-pointer"
                            title="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        {activeMenuId === row._id && (
                          <div ref={menuRef} className="absolute right-4 top-10 w-52 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                            {/* Send Parent Password Reset Action */}
                            {hasParent && isParentActive ? (
                              <button
                                onClick={() => handleOpenParentReset(row)}
                                className="w-full px-3 py-2 text-xs text-forest hover:bg-forest/5 flex items-center gap-2 font-medium cursor-pointer border-b border-border/50"
                              >
                                <Key size={13} className="text-forest shrink-0" />
                                <span>Send Parent Password Reset</span>
                              </button>
                            ) : hasParent && primaryParent?.accountStatus === 'PENDING_ACTIVATION' ? (
                              <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50/50 flex items-center gap-2 border-b border-border/50">
                                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                                <span>Parent Pending Activation</span>
                              </div>
                            ) : (
                              <div className="px-3 py-2 text-xs text-muted flex items-center gap-2 border-b border-border/50">
                                <UserX size={13} className="shrink-0" />
                                <span>Parent not linked</span>
                              </div>
                            )}

                            <button
                              onClick={() => { setActiveMenuId(null); handleDelete(row); }}
                              className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={13} /> Delete Student
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
              <Button variant="outline" size="sm" disabled={loading || !meta.hasPrevPage} onClick={() => setPage(meta.page - 1)} className="p-1 px-2 text-xs">
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: meta.totalPages || 1 }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${meta.page === pageNum ? 'bg-forest text-white' : 'bg-white border border-border text-secondary hover:bg-surface'
                    }`}
                >
                  {pageNum}
                </button>
              ))}
              <Button variant="outline" size="sm" disabled={loading || !meta.hasNextPage} onClick={() => setPage(meta.page + 1)} className="p-1 px-2 text-xs">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={open} onClose={resetAndClose} title="Add Student" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name *" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="John" />
          <Input label="Last name *" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Doe" />
          <Input label="Admission no *" value={form.admissionNo} onChange={(e) => setField('admissionNo', e.target.value)} placeholder="ADM-2026-001" />
          <Select label="Gender *" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={form.gender} onChange={(e) => setField('gender', e.target.value)} />
          <Input label="Date of birth *" type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
          <Select label="Class" options={classOptions} value={form.currentClass} onChange={(e) => { setField('currentClass', e.target.value); setField('currentSection', ''); }} />
          <Select label="Section" options={sectionOptions} value={form.currentSection} onChange={(e) => setField('currentSection', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 90000 00000" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="student@school.edu" />
          <Select label="Fee Structure" options={[{ value: '', label: 'None' }, ...feeStructures.map(f => ({ value: f._id, label: `${f.name} — ₹${f.totalAmount?.toLocaleString('en-IN') || 0}` }))]} value={form.feeStructure} onChange={(e) => setField('feeStructure', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Student</Button>
        </div>
      </Modal>

      {/* ── PARENT PASSWORD RESET CONFIRMATION MODAL ── */}
      {selectedStudentForReset && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => {
            if (!sendingReset) {
              setResetModalOpen(false);
              setSelectedStudentForReset(null);
            }
          }}
          title="Send Parent Password Reset Link"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-forest-soft border border-forest/20 rounded-xl text-xs text-forest">
              <div className="flex items-start gap-2.5">
                <Key size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-deep">Reset Parent Portal Password</p>
                  <p className="text-secondary text-[11px] mt-0.5">
                    A secure, single-use password reset link will be sent to the parent's registered email address via Brevo.
                  </p>
                </div>
              </div>
            </div>

            {/* Student Context */}
            <div className="p-3 bg-slate-50 border border-border rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Student:</span>
                <span className="font-bold text-deep">
                  {selectedStudentForReset.firstName} {selectedStudentForReset.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Admission No:</span>
                <span className="font-mono text-deep">{selectedStudentForReset.admissionNo || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Class:</span>
                <span className="text-deep">{classMap[selectedStudentForReset.currentClass?._id || selectedStudentForReset.currentClass] || '—'}</span>
              </div>
            </div>

            {/* Parent Selection (if multiple parents exist) */}
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">
                Select Recipient Parent:
              </label>

              <div className="space-y-2">
                {(selectedStudentForReset.parents || []).map((parent) => {
                  const isSelected = selectedParentId === parent._id;
                  const email = parent.contact?.email;

                  return (
                    <label
                      key={parent._id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-forest/5 border-forest ring-1 ring-forest/20'
                          : 'bg-white border-border hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="parentRecipient"
                        value={parent._id}
                        checked={isSelected}
                        onChange={() => setSelectedParentId(parent._id)}
                        className="mt-1 text-forest focus:ring-forest"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-deep">
                            {parent.firstName} {parent.lastName}
                          </span>
                          {parent.relation && (
                            <span className="text-[10px] font-semibold text-muted bg-slate-100 px-1.5 py-0.2 rounded capitalize">
                              {parent.relation}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-secondary mt-0.5">
                          <Mail size={12} className="text-muted shrink-0" />
                          <span className="truncate">{email || 'No email registered'}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setResetModalOpen(false);
                  setSelectedStudentForReset(null);
                }}
                disabled={sendingReset}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSendReset}
                loading={sendingReset}
                className="gap-1.5"
              >
                <Key size={14} /> Send Reset Link
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="students" onSuccess={() => triggerReload()} />
    </div>
  );
}
