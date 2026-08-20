import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Trash2, Upload, Users, UserCheck, UserX,
  Search, RotateCcw, Filter, MoreVertical, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, ChevronsUpDown, GraduationCap,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { studentApi } from '../../api/student.api';
import { academicApi } from '../../api/academic.api';
import { feeApi } from '../../api/fee.api';
import BulkImportModal from '../../components/ui/BulkImportModal';

/* ──────────────────────── Helpers ──────────────────────── */

function getInitials(firstName = '', lastName = '') {
  return ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'ST';
}

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

  /* ──────────────────────── Render Helpers ──────────────────────── */

  const renderGender = (gender) => {
    if (gender === 'female') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-600">
          <span className="text-sm"></span> Female
        </span>
      );
    }
    if (gender === 'male') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
          <span className="text-sm"></span> Male
        </span>
      );
    }
    return <span className="text-xs text-muted capitalize">{gender || '\u2014'}</span>;
  };

  const renderStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
        {status || 'Inactive'}
      </span>
    );
  };

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));
  const sectionOptions = sections
    .filter((s) => !form.currentClass || s.schoolClass === form.currentClass)
    .map((s) => ({ value: s._id, label: s.name }));

  /* ──────────────────────── RENDER ──────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">Students</h1>
          <p className="text-secondary text-xs sm:text-sm mt-0.5">
            Manage student records, enrollment, and academic information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-1.5">
            <Upload size={14} /> Bulk Import
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus size={16} /> Add Student <ChevronDown size={14} className="opacity-70 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-2">
            <Users size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Total Students</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{totalCount}</p>
          <p className="text-[10px] text-muted mt-1">All enrolled students</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <UserCheck size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{activeCount}</p>
          <p className="text-[10px] text-muted mt-1">Currently enrolled</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <UserX size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Inactive</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{inactiveCount}</p>
          <p className="text-[10px] text-muted mt-1">Not currently active</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <GraduationCap size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Gender Split</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">{maleCount}M / {femaleCount}F</p>
          <p className="text-[10px] text-muted mt-1">Male / Female ratio</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
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
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="font-semibold text-muted text-[11px]">Gender</span>
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs text-secondary">
              <RotateCcw size={13} className="mr-1 text-muted" /> Reset
            </Button>

            <Button size="sm" variant="primary" className="text-xs gap-1.5">
              <Filter size={13} /> Filters
              {countActiveFilters() > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
                  {countActiveFilters()}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-secondary text-xs mr-1">Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${isActive
                    ? 'bg-forest text-white font-semibold shadow-2xs'
                    : 'bg-white border border-border text-secondary hover:bg-surface hover:text-deep font-medium'
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
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th onClick={() => handleSort('admissionNo')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>ADMISSION NO.</span><SortIcon field="admissionNo" /></div>
                </th>
                <th onClick={() => handleSort('firstName')} className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none">
                  <div className="flex items-center gap-1"><span>STUDENT</span><SortIcon field="firstName" /></div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">GENDER</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">CLASS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">SECTION</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">STATUS</th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}><td colSpan={7} className="px-3.5 py-3"><div className="h-5 bg-surface rounded animate-pulse w-full" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-xs text-muted">No students found matching the selected criteria.</td></tr>
              ) : (
                data.map((row) => (
                  <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-xs text-deep font-mono">{row.admissionNo || '\u2014'}</td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-forest-soft text-forest text-[11px] font-bold flex items-center justify-center shrink-0">
                          {getInitials(row.firstName, row.lastName)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-deep leading-tight">{row.firstName} {row.lastName}</p>
                          {row.contact?.email && <p className="text-[11px] text-muted leading-tight mt-0.5">{row.contact.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">{renderGender(row.gender)}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">{classMap[row.currentClass] || '\u2014'}</td>
                    <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">{sectionMap[row.currentSection] || '\u2014'}</td>
                    <td className="px-3.5 py-2.5">{renderStatusBadge(row.status)}</td>
                    <td className="px-3.5 py-2.5 text-right relative">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                          className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors"
                          title="More actions"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                      {activeMenuId === row._id && (
                        <div ref={menuRef} className="absolute right-4 top-10 w-40 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                          <button
                            onClick={() => { setActiveMenuId(null); handleDelete(row); }}
                            className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={13} /> Delete Student
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
          <Select label="Fee Structure" options={[{ value: '', label: 'None' }, ...feeStructures.map(f => ({ value: f._id, label: `${f.name} — \u20B9${f.totalAmount?.toLocaleString('en-IN') || 0}` }))]} value={form.feeStructure} onChange={(e) => setField('feeStructure', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Student</Button>
        </div>
      </Modal>

      <BulkImportModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} entityType="students" onSuccess={() => triggerReload()} />
    </div>
  );
}
