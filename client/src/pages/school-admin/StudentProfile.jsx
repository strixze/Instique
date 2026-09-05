import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  ChevronLeft, Edit3, MoreVertical, ShieldAlert, Award, Calendar,
  CreditCard, BookOpen, FileText, Clock, UserCheck, AlertTriangle,
  Download, Plus, Key, Trash2, Mail, Phone, MapPin, User, GraduationCap
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import UserAvatar from '../../components/ui/UserAvatar';
import { studentApi } from '../../api/student.api';
import { academicApi } from '../../api/academic.api';
import { useUserStore } from '../../store/userStore';

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    admissionNo: '',
    gender: 'male',
    dateOfBirth: '',
    currentClass: '',
    currentSection: '',
    rollNo: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
  });

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Parent Reset Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Add Document Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', type: 'Aadhaar', url: '' });

  // Handle click outside action dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch student profile using TanStack Query
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['student-profile', studentId],
    queryFn: async () => {
      const res = await studentApi.getProfile(studentId);
      return res.data;
    },
    enabled: !!studentId,
  });

  // Load dropdown references for Edit modal
  useEffect(() => {
    if (editOpen) {
      academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
      academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
    }
  }, [editOpen]);

  // Populate edit form when opening edit modal
  const handleOpenEdit = () => {
    if (!profile?.student) return;
    const st = profile.student;
    setEditForm({
      firstName: st.firstName || '',
      lastName: st.lastName || '',
      admissionNo: st.admissionNo || '',
      gender: st.gender || 'male',
      dateOfBirth: st.dateOfBirth ? new Date(st.dateOfBirth).toISOString().split('T')[0] : '',
      currentClass: st.currentClass?._id || st.currentClass || '',
      currentSection: st.currentSection?._id || st.currentSection || '',
      rollNo: st.rollNo || '',
      phone: st.contact?.phone || '',
      email: st.contact?.email || '',
      address: st.contact?.address || '',
      status: st.status || 'active',
    });
    setEditOpen(true);
    setActiveMenuOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.firstName || !editForm.lastName || !editForm.admissionNo) {
      toast.error('Please fill required fields');
      return;
    }
    setSavingEdit(true);
    try {
      await studentApi.update(studentId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        admissionNo: editForm.admissionNo,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth || undefined,
        currentClass: editForm.currentClass || undefined,
        currentSection: editForm.currentSection || undefined,
        rollNo: editForm.rollNo ? Number(editForm.rollNo) : undefined,
        status: editForm.status,
        contact: {
          phone: editForm.phone || undefined,
          email: editForm.email || undefined,
          address: editForm.address || undefined,
        },
      });
      toast.success('Student profile updated');
      setEditOpen(false);
      queryClient.invalidateQueries(['student-profile', studentId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to update student profile');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteStudent = () => {
    setActiveMenuOpen(false);
    Swal.fire({
      title: 'Delete student record?',
      text: `${profile.student.firstName} ${profile.student.lastName} will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (res) => {
      if (!res.isConfirmed) return;
      try {
        await studentApi.delete(studentId);
        toast.success('Student record deleted');
        navigate('/students');
      } catch (err) {
        toast.error(err?.message || 'Failed to delete student');
      }
    });
  };

  const handleOpenParentReset = () => {
    setActiveMenuOpen(false);
    const parents = profile.parents || [];
    if (parents.length === 0) {
      toast.error('No parent account linked to this student');
      return;
    }
    const primary = parents.find((p) => p.isPrimary) || parents[0];
    setSelectedParentId(primary._id);
    setResetModalOpen(true);
  };

  const handleConfirmSendReset = async () => {
    setSendingReset(true);
    try {
      const res = await studentApi.sendParentPasswordReset(studentId, selectedParentId || undefined);
      toast.success(res.message || 'Password reset link sent to parent email');
      setResetModalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to send password reset');
    } finally {
      setSendingReset(false);
    }
  };

  const handleAddDocument = async () => {
    if (!docForm.name || !docForm.url) {
      toast.error('Document name and file URL are required');
      return;
    }
    setSavingDoc(true);
    try {
      const existingDocs = profile.student.documents || [];
      const updatedDocs = [
        ...existingDocs,
        { name: docForm.name, type: docForm.type, url: docForm.url, uploadedAt: new Date() }
      ];
      await studentApi.update(studentId, { documents: updatedDocs });
      toast.success('Document uploaded successfully');
      setDocModalOpen(false);
      setDocForm({ name: '', type: 'Aadhaar', url: '' });
      queryClient.invalidateQueries(['student-profile', studentId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to upload document');
    } finally {
      setSavingDoc(false);
    }
  };

  /* ──────────────────────── Skeleton Loading State ──────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-5 w-full animate-pulse p-1">
        <div className="h-6 w-36 bg-surface dark:bg-dark-hover rounded-lg" />
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface dark:bg-dark-hover" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-surface dark:bg-dark-hover rounded" />
              <div className="h-4 w-64 bg-surface dark:bg-dark-hover rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-surface dark:bg-dark-hover rounded-lg" />
            <div className="h-9 w-28 bg-surface dark:bg-dark-hover rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4" />
          ))}
        </div>
        <div className="h-10 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
        <div className="h-80 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-6" />
      </div>
    );
  }

  /* ──────────────────────── Error State ──────────────────────── */
  if (isError || !profile?.student) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl my-6">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-lg font-bold text-deep dark:text-dark-text">Student Not Found or Unauthorized</h2>
        <p className="text-xs text-secondary dark:text-dark-text-secondary mt-1 max-w-md leading-relaxed">
          {error?.message || 'You do not have permission to view this student record, or the student does not exist.'}
        </p>
        <Button onClick={() => navigate('/students')} className="mt-4 gap-1.5" size="sm">
          <ChevronLeft size={14} /> Back to Students
        </Button>
      </div>
    );
  }

  const { student, parents, kpis, academics, attendance, fees, homework, recognition, documents, activityTimeline } = profile;

  /* ──────────────────────── Render Helpers ──────────────────────── */
  const renderStatusBadge = (status) => {
    const s = String(status || 'active').toLowerCase();
    let style = 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    let label = 'Active';

    if (s === 'inactive') {
      style = 'bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border-slate-200 dark:border-dark-border';
      label = 'Inactive';
    } else if (s === 'promoted') {
      style = 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      label = 'Promoted';
    } else if (s === 'transferred') {
      style = 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      label = 'Transferred';
    } else if (s === 'archived') {
      style = 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      label = 'Archived';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  };

  const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));
  const sectionOptions = sections
    .filter((sec) => !editForm.currentClass || sec.schoolClass === editForm.currentClass)
    .map((sec) => ({ value: sec._id, label: sec.name }));

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'academics', label: 'Academics', icon: GraduationCap },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'fees', label: 'Fees', icon: CreditCard },
    { key: 'homework', label: 'Homework', icon: BookOpen },
    { key: 'recognition', label: 'Recognition', icon: Award },
    { key: 'documents', label: 'Documents', icon: FileText, count: documents?.length },
    { key: 'activity', label: 'Activity', icon: Clock },
  ];

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Top Navigation Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} /> Back to Students
        </button>
        <span className="text-xs text-muted dark:text-dark-text-muted">
          Student ID: <span className="font-mono font-bold text-deep dark:text-dark-text">{student.admissionNo || 'N/A'}</span>
        </span>
      </div>

      {/* ──────────────────────── 1. HEADER CARD ──────────────────────── */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              type="student"
              gender={student.gender}
              id={student._id}
              admissionNo={student.admissionNo}
              name={`${student.firstName} ${student.lastName}`}
              size="lg"
              className="w-16 h-16 text-lg ring-2 ring-forest/20 dark:ring-emerald-500/20 shrink-0"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">
                  {student.firstName} {student.lastName}
                </h1>
                {renderStatusBadge(student.status)}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary dark:text-dark-text-secondary mt-1 font-medium">
                <span>Class: <strong className="text-deep dark:text-dark-text">{student.currentClass?.name || 'N/A'}</strong></span>
                <span>•</span>
                <span>Section: <strong className="text-deep dark:text-dark-text">{student.currentSection?.name || 'N/A'}</strong></span>
                <span>•</span>
                <span>Roll No: <strong className="text-deep dark:text-dark-text">{student.rollNo || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 relative">
            {currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin' ? (
              <Button size="sm" onClick={handleOpenEdit} className="gap-1.5">
                <Edit3 size={14} /> Edit Student
              </Button>
            ) : null}

            <div className="relative" ref={menuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMenuOpen(!activeMenuOpen)}
                className="gap-1 px-2.5"
              >
                <span>More Actions</span>
                <MoreVertical size={14} />
              </Button>

              {activeMenuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in">
                  <button
                    onClick={() => { setActiveTab('documents'); setActiveMenuOpen(false); }}
                    className="w-full px-3 py-2 text-xs text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2 font-medium"
                  >
                    <FileText size={13} /> View Documents
                  </button>

                  {parents && parents.length > 0 && (
                    <button
                      onClick={handleOpenParentReset}
                      className="w-full px-3 py-2 text-xs text-forest dark:text-emerald-400 hover:bg-forest/5 flex items-center gap-2 font-medium border-t border-border/50 dark:border-dark-border"
                    >
                      <Key size={13} /> Send Parent Reset Link
                    </button>
                  )}

                  {(currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin') && (
                    <button
                      onClick={handleDeleteStudent}
                      className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 font-medium border-t border-border/50 dark:border-dark-border"
                    >
                      <Trash2 size={13} /> Delete Student
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────── 2. QUICK OVERVIEW (KPIS) ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Attendance */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted dark:text-dark-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attendance</span>
            <Calendar size={14} className="text-forest dark:text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-deep dark:text-dark-text">
            {kpis.attendancePercentage !== null ? `${kpis.attendancePercentage}%` : 'No data'}
          </p>
          <span className="text-[10px] text-muted dark:text-dark-text-muted">Total Marked: {attendance.totalDays} days</span>
        </div>

        {/* Academic Avg */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted dark:text-dark-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Academic Avg</span>
            <GraduationCap size={14} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-deep dark:text-dark-text">
            {kpis.academicAverage !== null ? `${kpis.academicAverage}%` : 'No data'}
          </p>
          <span className="text-[10px] text-muted dark:text-dark-text-muted">Pass Rate: {academics.passPercentage !== null ? `${academics.passPercentage}%` : 'N/A'}</span>
        </div>

        {/* Fees Pending */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted dark:text-dark-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Fees Pending</span>
            <CreditCard size={14} className="text-amber-500" />
          </div>
          <p className="text-xl font-bold text-deep dark:text-dark-text">
            {kpis.pendingFees !== null ? `₹${kpis.pendingFees.toLocaleString('en-IN')}` : 'No data'}
          </p>
          <span className="text-[10px] text-muted dark:text-dark-text-muted">Total Paid: ₹{(fees.paidAmount || 0).toLocaleString('en-IN')}</span>
        </div>

        {/* Homework */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted dark:text-dark-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Homework</span>
            <BookOpen size={14} className="text-violet-500" />
          </div>
          <p className="text-xl font-bold text-deep dark:text-dark-text">
            {kpis.homeworkCompletionPct !== null ? `${kpis.homeworkCompletionPct}%` : 'No data'}
          </p>
          <span className="text-[10px] text-muted dark:text-dark-text-muted">Submitted: {homework.completed} / {homework.totalAssigned}</span>
        </div>

        {/* Recognition */}
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted dark:text-dark-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recognition</span>
            <Award size={14} className="text-yellow-500" />
          </div>
          <p className="text-xl font-bold text-deep dark:text-dark-text">
            {kpis.recognitionPoints !== null ? `${kpis.recognitionPoints} pts` : 'No data'}
          </p>
          <span className="text-[10px] text-muted dark:text-dark-text-muted">Badges: {recognition.badgesCount || 0}</span>
        </div>
      </div>

      {/* ──────────────────────── 3. ATTENDANCE WARNING ALERT ──────────────────────── */}
      {attendance.isBelowThreshold && (
        <div className="p-3.5 bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Attendance requires attention</p>
            <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-400">
              Student's attendance is currently <strong>{attendance.overallPercentage}%</strong>, which is below the school's configured threshold of <strong>{attendance.threshold}%</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ──────────────────────── 4. TAB NAVIGATION ──────────────────────── */}
      <div className="border-b border-border dark:border-dark-border overflow-x-auto no-scrollbar">
        <nav className="flex space-x-6 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-1 border-b-2 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-forest dark:border-emerald-500 text-forest dark:text-emerald-400'
                    : 'border-transparent text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-surface dark:bg-dark-hover text-muted dark:text-dark-text-muted font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ──────────────────────── 5. TAB CONTENT SECTIONS ──────────────────────── */}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Info */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60 dark:border-dark-border">
              <User size={14} className="text-forest dark:text-emerald-400" /> Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Full Name</span>
                <span className="font-semibold text-deep dark:text-dark-text">{student.firstName} {student.lastName}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Student / Admission ID</span>
                <span className="font-mono font-semibold text-deep dark:text-dark-text">{student.admissionNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Date of Birth</span>
                <span className="font-semibold text-deep dark:text-dark-text">
                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Gender</span>
                <span className="font-semibold text-deep dark:text-dark-text capitalize">{student.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Admission Date</span>
                <span className="font-semibold text-deep dark:text-dark-text">
                  {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Status</span>
                <span>{renderStatusBadge(student.status)}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60 dark:border-dark-border">
              <GraduationCap size={14} className="text-forest dark:text-emerald-400" /> Academic Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Academic Session</span>
                <span className="font-semibold text-deep dark:text-dark-text">{student.academicYear?.name || '2026-2027'}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Current Class</span>
                <span className="font-semibold text-deep dark:text-dark-text">{student.currentClass?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Section</span>
                <span className="font-semibold text-deep dark:text-dark-text">{student.currentSection?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Roll Number</span>
                <span className="font-mono font-semibold text-deep dark:text-dark-text">{student.rollNo || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60 dark:border-dark-border">
              <Phone size={14} className="text-forest dark:text-emerald-400" /> Contact Information
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-muted dark:text-dark-text-muted shrink-0" />
                <span className="text-muted dark:text-dark-text-muted w-20">Phone:</span>
                <span className="font-medium text-deep dark:text-dark-text">{student.contact?.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-muted dark:text-dark-text-muted shrink-0" />
                <span className="text-muted dark:text-dark-text-muted w-20">Email:</span>
                <span className="font-medium text-deep dark:text-dark-text">{student.contact?.email || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-muted dark:text-dark-text-muted shrink-0 mt-0.5" />
                <span className="text-muted dark:text-dark-text-muted w-20">Address:</span>
                <span className="font-medium text-deep dark:text-dark-text">{student.contact?.address || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Parent / Guardian Information */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60 dark:border-dark-border">
              <UserCheck size={14} className="text-forest dark:text-emerald-400" /> Parent / Guardian Information
            </h3>
            {parents && parents.length > 0 ? (
              parents.map((p) => (
                <div key={p._id} className="p-3 bg-surface/50 dark:bg-dark-elevated rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-deep dark:text-dark-text">
                      {p.firstName} {p.lastName} {p.relation ? `(${p.relation})` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      {p.accountStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-secondary dark:text-dark-text-secondary">
                    Phone: {p.contact?.phone || 'N/A'} • Email: {p.contact?.email || 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted dark:text-dark-text-muted italic py-2">
                Parent account not linked
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACADEMICS TAB */}
      {activeTab === 'academics' && (
        <div className="space-y-4">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Overall Average</span>
              <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">
                {academics.academicAverage !== null ? `${academics.academicAverage}%` : 'No data'}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Best Subject</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {academics.bestSubject ? `${academics.bestSubject.subject} (${academics.bestSubject.percentage}%)` : 'No data'}
              </p>
            </div>

            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Needs Attention</span>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                {academics.needingAttentionSubject ? `${academics.needingAttentionSubject.subject} (${academics.needingAttentionSubject.percentage}%)` : 'None'}
              </p>
            </div>
          </div>

          {/* Subject Performance Horizontal Bars */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Subject Performance</h3>
            {academics.subjectPerformance && academics.subjectPerformance.length > 0 ? (
              <div className="space-y-2.5">
                {academics.subjectPerformance.map((subj) => (
                  <div key={subj.subject} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-deep dark:text-dark-text">{subj.subject}</span>
                      <span className="font-bold text-deep dark:text-dark-text">{subj.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface dark:bg-dark-hover rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest dark:bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, subj.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-4 text-center">No published subject performance records available yet.</p>
            )}
          </div>

          {/* Examinations Table */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated">
              <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Recent Examinations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary bg-surface/50 dark:bg-dark-hover">
                    <th className="px-3.5 py-2.5 font-semibold">Exam Name</th>
                    <th className="px-3.5 py-2.5 font-semibold">Date</th>
                    <th className="px-3.5 py-2.5 font-semibold">Subjects</th>
                    <th className="px-3.5 py-2.5 font-semibold">Total Marks</th>
                    <th className="px-3.5 py-2.5 font-semibold">Percentage</th>
                    <th className="px-3.5 py-2.5 font-semibold">Grade</th>
                    <th className="px-3.5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                  {academics.exams && academics.exams.length > 0 ? (
                    academics.exams.map((ex) => (
                      <tr key={ex.id} className="hover:bg-surface/50 dark:hover:bg-dark-hover">
                        <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text">{ex.name}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                          {ex.date ? new Date(ex.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{ex.subjectsCount} subjects</td>
                        <td className="px-3.5 py-2.5 font-mono text-deep dark:text-dark-text">{ex.totalObtained} / {ex.totalMax}</td>
                        <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text">{ex.percentage}%</td>
                        <td className="px-3.5 py-2.5 font-bold text-forest dark:text-emerald-400">{ex.grade}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 capitalize">
                            {ex.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted dark:text-dark-text-muted">
                        No published exam results yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Overall Attendance</span>
              <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">{attendance.overallPercentage !== null ? `${attendance.overallPercentage}%` : 'No data'}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Present Days</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{attendance.presentCount}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Absent Days</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{attendance.absentCount}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Late / Leave</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{attendance.lateCount + attendance.leaveCount}</p>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Attendance Trend</h3>
            {attendance.monthlyTrend && attendance.monthlyTrend.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendance.monthlyTrend}>
                    <defs>
                      <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip />
                    <Area type="monotone" dataKey="percentage" stroke="#6C5CE7" fillOpacity={1} fill="url(#attendanceColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">No attendance records recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* FEES TAB */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Total Assigned</span>
              <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">₹{fees.totalAssigned.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Paid</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{fees.paidAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Pending</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{fees.pendingAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Overdue</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{fees.overdueAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated">
              <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary bg-surface/50 dark:bg-dark-hover">
                    <th className="px-3.5 py-2.5 font-semibold">Receipt No</th>
                    <th className="px-3.5 py-2.5 font-semibold">Fee Structure</th>
                    <th className="px-3.5 py-2.5 font-semibold">Amount</th>
                    <th className="px-3.5 py-2.5 font-semibold">Paid</th>
                    <th className="px-3.5 py-2.5 font-semibold">Method</th>
                    <th className="px-3.5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                  {fees.transactions && fees.transactions.length > 0 ? (
                    fees.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-surface/50 dark:hover:bg-dark-hover">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-deep dark:text-dark-text">{tx.receiptNo}</td>
                        <td className="px-3.5 py-2.5 text-deep dark:text-dark-text font-medium">{tx.structureName}</td>
                        <td className="px-3.5 py-2.5 font-mono text-deep dark:text-dark-text">₹{tx.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{tx.paidAmount?.toLocaleString('en-IN')}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary capitalize">{tx.paymentMethod || 'Online'}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 capitalize">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted dark:text-dark-text-muted">
                        No fee records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HOMEWORK TAB */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Assigned</span>
              <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">{homework.totalAssigned}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Completed</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{homework.completed}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Pending</span>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{homework.pending}</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Overdue</span>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{homework.overdue}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated">
              <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Recent Homework Assignments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary bg-surface/50 dark:bg-dark-hover">
                    <th className="px-3.5 py-2.5 font-semibold">Subject</th>
                    <th className="px-3.5 py-2.5 font-semibold">Title</th>
                    <th className="px-3.5 py-2.5 font-semibold">Teacher</th>
                    <th className="px-3.5 py-2.5 font-semibold">Due Date</th>
                    <th className="px-3.5 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                  {homework.list && homework.list.length > 0 ? (
                    homework.list.map((hw) => (
                      <tr key={hw.id} className="hover:bg-surface/50 dark:hover:bg-dark-hover">
                        <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text">{hw.subject}</td>
                        <td className="px-3.5 py-2.5 text-deep dark:text-dark-text">{hw.title}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{hw.teacher}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                          {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                            hw.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : hw.status === 'overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {hw.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted dark:text-dark-text-muted">
                        No homework records available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECOGNITION TAB */}
      {activeTab === 'recognition' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Total Points</span>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{recognition.points} pts</p>
            </div>
            <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase">Badges Earned</span>
              <p className="text-2xl font-bold text-deep dark:text-dark-text mt-1">{recognition.badgesCount}</p>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Earned Badges</h3>
            {recognition.badges && recognition.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {recognition.badges.map((b) => (
                  <div key={b.id} className="p-3 bg-surface/50 dark:bg-dark-elevated rounded-xl border border-border/60 dark:border-dark-border text-center space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-lg">
                      🏆
                    </div>
                    <p className="font-bold text-xs text-deep dark:text-dark-text leading-tight">{b.name}</p>
                    <p className="text-[10px] text-muted dark:text-dark-text-muted capitalize">{b.category?.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-4 text-center">No badges awarded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Associated Student Documents</h3>
            {(currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin') && (
              <Button size="sm" onClick={() => setDocModalOpen(true)} className="gap-1">
                <Plus size={14} /> Upload Document
              </Button>
            )}
          </div>

          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary bg-surface/50 dark:bg-dark-hover">
                  <th className="px-3.5 py-2.5 font-semibold">Document Name</th>
                  <th className="px-3.5 py-2.5 font-semibold">Type</th>
                  <th className="px-3.5 py-2.5 font-semibold">Uploaded Date</th>
                  <th className="px-3.5 py-2.5 font-semibold">Verification Status</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                {documents && documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface/50 dark:hover:bg-dark-hover">
                      <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text flex items-center gap-2">
                        <FileText size={14} className="text-forest dark:text-emerald-400 shrink-0" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary capitalize">{doc.type}</td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          {doc.verificationStatus}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-forest dark:text-emerald-400 font-semibold hover:underline"
                          >
                            <Download size={13} /> Download
                          </a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted dark:text-dark-text-muted">
                      No documents uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVITY TIMELINE TAB */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">Activity Timeline</h3>
          {activityTimeline && activityTimeline.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border dark:before:bg-dark-border">
              {activityTimeline.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3 text-xs">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-dark-card border-2 border-forest dark:border-emerald-500 flex items-center justify-center text-[10px]">
                    ●
                  </div>
                  <div>
                    <p className="font-bold text-deep dark:text-dark-text">{item.title}</p>
                    <p className="text-secondary dark:text-dark-text-secondary text-[11px] mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-muted dark:text-dark-text-muted mt-1 block">
                      {new Date(item.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">No activity history recorded yet.</p>
          )}
        </div>
      )}

      {/* ──────────────────────── MODALS ──────────────────────── */}

      {/* Edit Student Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student Profile" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name *" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
          <Input label="Last Name *" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
          <Input label="Admission No *" value={editForm.admissionNo} onChange={(e) => setEditForm({ ...editForm, admissionNo: e.target.value })} />
          <Select label="Gender *" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} />
          <Input label="Date of Birth" type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} />
          <Select label="Class" options={classOptions} value={editForm.currentClass} onChange={(e) => setEditForm({ ...editForm, currentClass: e.target.value, currentSection: '' })} />
          <Select label="Section" options={sectionOptions} value={editForm.currentSection} onChange={(e) => setEditForm({ ...editForm, currentSection: e.target.value })} />
          <Input label="Roll No" type="number" value={editForm.rollNo} onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })} />
          <Select label="Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'promoted', label: 'Promoted' }, { value: 'transferred', label: 'Transferred' }, { value: 'archived', label: 'Archived' }]} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="sm:col-span-2" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button>
        </div>
      </Modal>

      {/* Parent Password Reset Confirmation Modal */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Send Parent Password Reset" size="md">
        <div className="space-y-4">
          <p className="text-xs text-secondary leading-relaxed">
            A single-use password reset link will be sent to the parent account associated with {student.firstName} {student.lastName}.
          </p>
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">Select Recipient Parent:</label>
            <div className="space-y-2">
              {(parents || []).map((parent) => (
                <label key={parent._id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer bg-white">
                  <input
                    type="radio"
                    name="parentSel"
                    value={parent._id}
                    checked={selectedParentId === parent._id}
                    onChange={() => setSelectedParentId(parent._id)}
                    className="text-forest focus:ring-forest"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-deep">{parent.firstName} {parent.lastName} ({parent.relation || 'Parent'})</p>
                    <p className="text-[11px] text-muted">{parent.contact?.email || 'No email'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSendReset} loading={sendingReset}>Send Reset Link</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} title="Upload Document" size="md">
        <div className="space-y-4">
          <Input label="Document Name *" value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} placeholder="e.g. Aadhaar Card Scan" />
          <Select label="Category / Type" options={[{ value: 'Aadhaar', label: 'Aadhaar' }, { value: 'Birth Certificate', label: 'Birth Certificate' }, { value: 'Transfer Certificate', label: 'Transfer Certificate' }, { value: 'Report Card', label: 'Report Card' }, { value: 'Medical', label: 'Medical' }, { value: 'Custom', label: 'Custom' }]} value={docForm.type} onChange={(e) => setDocForm({ ...docForm, type: e.target.value })} />
          <Input label="File URL *" value={docForm.url} onChange={(e) => setDocForm({ ...docForm, url: e.target.value })} placeholder="https://..." />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDocModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDocument} loading={savingDoc}>Upload Document</Button>
        </div>
      </Modal>
    </div>
  );
}
