import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  ChevronLeft, Edit3, MoreVertical, ShieldAlert, Award, Calendar,
  BookOpen, FileText, Clock, UserCheck, AlertTriangle, Key, Mail, Phone,
  MapPin, User, GraduationCap, Building2, Users, CheckCircle2, AlertCircle,
  Plus, Send, RefreshCw, Eye, ArrowUpRight, Check, X, ShieldCheck
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import UserAvatar from '../../components/ui/UserAvatar';
import { teacherApi } from '../../api/teacher.api';
import { academicApi } from '../../api/academic.api';
import { useUserStore } from '../../store/userStore';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('overview');
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const menuRef = useRef(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    department: '',
    gender: 'male',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    weeklyTeachingLimit: 30,
    dailyTeachingLimit: 6,
    subjects: [],
  });

  const [allSubjects, setAllSubjects] = useState([]);

  // Account Action States
  const [sendingReset, setSendingReset] = useState(false);
  const [sendingActivation, setSendingActivation] = useState(false);

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

  // Fetch teacher profile via TanStack Query
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: async () => {
      const res = await teacherApi.getProfile(teacherId);
      return res.data;
    },
    enabled: !!teacherId,
  });

  // Load dropdown subjects for Edit modal
  useEffect(() => {
    if (editOpen) {
      academicApi.getSubjects({ limit: 200 }).then((res) => {
        setAllSubjects(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      }).catch(() => {});
    }
  }, [editOpen]);

  // Populate edit form when opening modal
  const handleOpenEdit = () => {
    if (!profile?.teacher) return;
    const t = profile.teacher;
    setEditForm({
      firstName: t.firstName || '',
      lastName: t.lastName || '',
      employeeId: t.employeeId || '',
      department: t.department || '',
      gender: t.gender || 'male',
      dateOfBirth: t.dateOfBirth ? t.dateOfBirth.split('T')[0] : '',
      phone: t.contact?.phone || '',
      email: t.contact?.email || '',
      address: t.contact?.address || '',
      status: t.status || 'active',
      weeklyTeachingLimit: t.weeklyTeachingLimit ?? 30,
      dailyTeachingLimit: t.dailyTeachingLimit ?? 6,
      subjects: Array.isArray(t.subjects) ? t.subjects.map(s => typeof s === 'string' ? s : s._id) : [],
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.firstName || !editForm.lastName || !editForm.employeeId) {
      toast.error('First Name, Last Name, and Employee ID are required');
      return;
    }
    setSavingEdit(true);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        employeeId: editForm.employeeId,
        department: editForm.department,
        gender: editForm.gender,
        dateOfBirth: editForm.dateOfBirth || null,
        contact: {
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
        },
        status: editForm.status,
        weeklyTeachingLimit: Number(editForm.weeklyTeachingLimit) || 30,
        dailyTeachingLimit: Number(editForm.dailyTeachingLimit) || 6,
        subjects: editForm.subjects,
      };

      await teacherApi.update(teacherId, payload);
      toast.success('Teacher profile updated successfully');
      setEditOpen(false);
      queryClient.invalidateQueries(['teacher-profile', teacherId]);
      queryClient.invalidateQueries(['teachers']);
    } catch (err) {
      toast.error(err?.message || 'Failed to update teacher');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResendActivation = async () => {
    setActiveMenuOpen(false);
    setSendingActivation(true);
    try {
      const res = await teacherApi.resendActivation(teacherId);
      toast.success(res?.message || 'Activation email sent successfully');
      queryClient.invalidateQueries(['teacher-profile', teacherId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to send activation email');
    } finally {
      setSendingActivation(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setActiveMenuOpen(false);
    setSendingReset(true);
    try {
      const res = await teacherApi.sendPasswordReset(teacherId);
      toast.success(res?.message || 'Password reset email sent successfully');
      queryClient.invalidateQueries(['teacher-profile', teacherId]);
    } catch (err) {
      toast.error(err?.message || 'Failed to send password reset');
    } finally {
      setSendingReset(false);
    }
  };

  /* ──────────────────────── Render Helper Badges ──────────────────────── */

  const renderStatusBadge = (status) => {
    const s = String(status || 'active').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
        </span>
      );
    }
    if (s === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Left
      </span>
    );
  };

  const renderAccountStatusBadge = (accountStatus) => {
    if (accountStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 size={11} /> Account Active
        </span>
      );
    }
    if (accountStatus === 'PENDING_ACTIVATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <Clock size={11} /> Pending Activation
        </span>
      );
    }
    if (accountStatus === 'SUSPENDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          <AlertCircle size={11} /> Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-dark-hover text-slate-600 dark:text-dark-text-secondary border border-slate-200 dark:border-dark-border">
        Not Linked
      </span>
    );
  };

  /* ──────────────────────── Loading State ──────────────────────── */

  if (isLoading) {
    return (
      <div className="space-y-4 w-full pb-10 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 dark:bg-dark-hover rounded-lg" />
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-6 shadow-2xs flex gap-6 items-center">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-dark-hover shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-slate-200 dark:bg-dark-hover rounded" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-dark-hover rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl" />
      </div>
    );
  }

  /* ──────────────────────── Error State ──────────────────────── */

  if (isError || !profile || !profile.teacher) {
    return (
      <div className="p-8 text-center bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl space-y-4 max-w-md mx-auto my-12 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-bold text-deep dark:text-dark-text">Teacher Not Found</h2>
        <p className="text-xs text-muted dark:text-dark-text-muted">
          {error?.message || "The requested teacher record does not exist or you do not have authorization to view it."}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/teachers')}>
          Back to Teachers List
        </Button>
      </div>
    );
  }

  const {
    teacher,
    userAccount,
    kpis,
    timetable,
    attendanceMarked = [],
    leaves = [],
    leaveStats = { total: 0, approved: 0, pending: 0, rejected: 0 },
    homework = [],
    marksActivity = [],
    studentsTaught = [],
    substitutions = [],
    recognitionGiven = [],
    auditLogs = [],
  } = profile;

  const teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher Profile';
  const subjectsList = Array.isArray(teacher.subjects) ? teacher.subjects : [];
  const assignedClassesList = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
  const assignedSectionsList = Array.isArray(teacher.assignedSections) ? teacher.assignedSections : [];

  // Filter students by search
  const filteredStudents = studentsTaught.filter((st) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    const name = `${st.firstName} ${st.lastName}`.toLowerCase();
    const adm = (st.admissionNo || '').toLowerCase();
    return name.includes(q) || adm.includes(q);
  });

  return (
    <div className="space-y-4 w-full pb-10">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/teachers')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text transition-colors"
        >
          <ChevronLeft size={15} /> Back to Teachers
        </button>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            type="teacher"
            gender={teacher.gender}
            id={teacher._id}
            employeeId={teacher.employeeId}
            name={teacherName}
            size="lg"
            className="ring-2 ring-forest/20 dark:ring-emerald-500/20"
          />

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">
                {teacherName}
              </h1>
              {renderStatusBadge(teacher.status)}
              {userAccount && renderAccountStatusBadge(userAccount.accountStatus)}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary dark:text-dark-text-secondary">
              <span className="font-mono bg-surface dark:bg-dark-elevated px-2 py-0.5 rounded border border-border/60 dark:border-dark-border font-semibold">
                ID: {teacher.employeeId || '—'}
              </span>
              {teacher.department && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-forest dark:text-emerald-400" />
                  {teacher.department}
                </span>
              )}
              {teacher.isClassTeacher && teacher.classTeacherOf && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  Class Teacher ({teacher.classTeacherOf.name} {teacher.classTeacherSection ? `- ${teacher.classTeacherSection.name}` : ''})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {(currentUser?.role === 'school_admin' || currentUser?.role === 'super_admin') && (
            <Button size="sm" onClick={handleOpenEdit} className="gap-1.5">
              <Edit3 size={14} /> Edit Teacher
            </Button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveMenuOpen(!activeMenuOpen)}
              className="p-2"
              title="More Actions"
            >
              <MoreVertical size={15} />
            </Button>

            {activeMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl shadow-lg py-1 z-30 space-y-0.5 text-xs">
                {userAccount?.status === 'pending_activation' && (
                  <button
                    onClick={handleResendActivation}
                    disabled={sendingActivation}
                    className="w-full text-left px-3 py-2 text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2"
                  >
                    <Send size={13} className="text-blue-500" /> Resend Activation Email
                  </button>
                )}
                {userAccount && userAccount.status !== 'pending_activation' && (
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={sendingReset}
                    className="w-full text-left px-3 py-2 text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2"
                  >
                    <Key size={13} className="text-amber-500" /> Send Password Reset
                  </button>
                )}
                <button
                  onClick={() => { setActiveMenuOpen(false); handleOpenEdit(); }}
                  className="w-full text-left px-3 py-2 text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover flex items-center gap-2"
                >
                  <Edit3 size={13} className="text-forest dark:text-emerald-400" /> Update Teaching Limits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Overview (KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Assigned Classes</span>
          <p className="text-xl font-bold text-deep dark:text-dark-text mt-1">{kpis.assignedClassesCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Subjects</span>
          <p className="text-xl font-bold text-forest dark:text-emerald-400 mt-1">{kpis.assignedSubjectsCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Weekly Periods</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{kpis.weeklyPeriods}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Students Taught</span>
          <p className="text-xl font-bold text-deep dark:text-dark-text mt-1">{kpis.studentsTaughtCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Active Homework</span>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpis.activeHomeworkCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">Leave Approved</span>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{kpis.leaveTakenCount}</p>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="border-b border-border dark:border-dark-border flex overflow-x-auto no-scrollbar gap-1 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'assignments', label: 'Classes & Subjects', icon: BookOpen },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'attendance', label: 'Attendance & Leave', icon: Clock },
          { id: 'homework', label: 'Homework & Marks', icon: FileText },
          { id: 'students', label: `Students (${studentsTaught.length})`, icon: Users },
          { id: 'activity', label: 'Activity Timeline', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-forest dark:border-emerald-400 text-forest dark:text-emerald-400 font-bold'
                  : 'border-transparent text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────── TAB CONTENT ──────────────────────── */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <User size={14} className="text-forest dark:text-emerald-400" /> Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted dark:text-dark-text-muted">Full Name</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">{teacherName}</p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Employee ID</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">{teacher.employeeId || '—'}</p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Gender</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5 capitalize">{teacher.gender || '—'}</p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Date of Birth</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">
                  {teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Status</span>
                <div className="mt-0.5">{renderStatusBadge(teacher.status)}</div>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Joined On</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">
                  {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Academic & Workload Limits */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <Building2 size={14} className="text-forest dark:text-emerald-400" /> Department & Workload Rules
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted dark:text-dark-text-muted">Department</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">{teacher.department || 'General'}</p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Class Teacher Role</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">
                  {teacher.isClassTeacher ? `Yes (${teacher.classTeacherOf?.name || ''})` : 'No'}
                </p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Weekly Limit</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">{teacher.weeklyTeachingLimit || 30} periods/week</p>
              </div>
              <div>
                <span className="text-muted dark:text-dark-text-muted">Daily Limit</span>
                <p className="font-semibold text-deep dark:text-dark-text mt-0.5">{teacher.dailyTeachingLimit || 6} periods/day</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <Phone size={14} className="text-forest dark:text-emerald-400" /> Contact Information
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-muted" />
                <span className="font-medium text-deep dark:text-dark-text">{teacher.contact?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-muted" />
                <span className="font-medium text-deep dark:text-dark-text">{teacher.contact?.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-muted mt-0.5 shrink-0" />
                <span className="font-medium text-deep dark:text-dark-text">{teacher.contact?.address || 'No address on record'}</span>
              </div>
            </div>
          </div>

          {/* Account & System Link Status */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <ShieldCheck size={14} className="text-forest dark:text-emerald-400" /> System Account Link
            </h2>
            {userAccount ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted">User Email:</span>
                  <span className="font-semibold text-deep dark:text-dark-text">{userAccount.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Account Status:</span>
                  {renderAccountStatusBadge(userAccount.accountStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Last Login:</span>
                  <span className="font-medium text-deep dark:text-dark-text">
                    {userAccount.lastLogin ? new Date(userAccount.lastLogin).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle size={13} /> No Linked User Account
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400/80">
                  This teacher does not currently have a portal user account linked for login.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CLASSES & SUBJECTS TAB */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Assigned Classes */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <Building2 size={14} className="text-forest dark:text-emerald-400" /> Assigned Classes & Sections ({assignedClassesList.length})
            </h2>

            {assignedClassesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {assignedClassesList.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-3.5 bg-surface/50 dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-deep dark:text-dark-text">{cls.name}</p>
                      <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">Grade: {cls.grade || '—'}</p>
                    </div>
                    {teacher.isClassTeacher && teacher.classTeacherOf?._id === cls._id && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200">
                        Class Teacher
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
                No classes currently assigned to this teacher.
              </p>
            )}
          </div>

          {/* Subjects Taught */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <BookOpen size={14} className="text-forest dark:text-emerald-400" /> Subjects Taught ({subjectsList.length})
            </h2>

            {subjectsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {subjectsList.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3.5 bg-surface/50 dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-deep dark:text-dark-text">{sub.name}</p>
                      <p className="text-[11px] text-muted dark:text-dark-text-muted font-mono mt-0.5">Code: {sub.code || '—'}</p>
                    </div>
                    {sub.category && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200">
                        {sub.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
                No subjects currently assigned to this teacher.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. TIMETABLE TAB */}
      {activeTab === 'timetable' && (
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border/60">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-forest dark:text-emerald-400" /> Master Weekly Timetable Schedule ({timetable.totalWeeklyPeriods} periods/week)
            </h2>
          </div>

          {timetable.periods && timetable.periods.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 pt-1">
              {[1, 2, 3, 4, 5, 6].map((dayNo) => {
                const dayPeriods = timetable.periods.filter((p) => p.day === dayNo).sort((a, b) => a.periodNo - b.periodNo);
                return (
                  <div key={dayNo} className="bg-surface/50 dark:bg-dark-elevated border border-border/60 dark:border-dark-border rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center pb-1 border-b border-border/60 text-xs font-bold text-deep dark:text-dark-text">
                      <span>{DAYS_OF_WEEK[dayNo]}</span>
                      <span className="text-[10px] text-muted font-normal">{dayPeriods.length} periods</span>
                    </div>

                    {dayPeriods.length > 0 ? (
                      <div className="space-y-2">
                        {dayPeriods.map((p, idx) => (
                          <div key={idx} className="p-2 bg-white dark:bg-dark-card border border-border/60 rounded-lg text-xs space-y-1 shadow-2xs">
                            <div className="flex justify-between font-bold text-forest dark:text-emerald-400 text-[11px]">
                              <span>Period {p.periodNo}</span>
                              <span className="text-muted font-normal text-[10px]">{p.startTime || ''}</span>
                            </div>
                            <p className="font-semibold text-deep dark:text-dark-text text-xs leading-tight">{p.subject?.name || 'Subject'}</p>
                            <div className="flex justify-between items-center text-[10px] text-muted">
                              <span>{p.schoolClass?.name || ''} {p.section ? `(${p.section.name})` : ''}</span>
                              {p.room && <span className="font-mono text-secondary">Rm {p.room}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted italic text-center py-4">No periods</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-text-muted italic py-10 text-center">
              No published timetable periods currently assigned to this teacher.
            </p>
          )}
        </div>
      )}

      {/* 4. ATTENDANCE & LEAVE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Leave History */}
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-border/60">
              <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-forest dark:text-emerald-400" /> Teacher Leave Requests ({leaves.length})
              </h2>
              <div className="flex gap-2 text-xs font-semibold">
                <span className="text-emerald-600">Approved: {leaveStats.approved}</span>
                <span className="text-amber-600">Pending: {leaveStats.pending}</span>
              </div>
            </div>

            {leaves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 dark:bg-dark-elevated text-secondary dark:text-dark-text-secondary uppercase text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2">Leave Type</th>
                      <th className="px-3.5 py-2">Date Range</th>
                      <th className="px-3.5 py-2">Reason</th>
                      <th className="px-3.5 py-2">Substitute Teacher</th>
                      <th className="px-3.5 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                    {leaves.map((l) => (
                      <tr key={l._id} className="hover:bg-surface/40 dark:hover:bg-dark-hover">
                        <td className="px-3.5 py-2.5 font-bold capitalize text-deep dark:text-dark-text">{l.type}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                          {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary max-w-xs truncate">{l.reason}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                          {l.substituteTeacher ? `${l.substituteTeacher.firstName} ${l.substituteTeacher.lastName}` : '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            l.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            l.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
                No leave records available for this teacher.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. HOMEWORK & MARKS TAB */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
              <FileText size={14} className="text-forest dark:text-emerald-400" /> Homework Created by Teacher ({homework.length})
            </h2>

            {homework.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/60 dark:bg-dark-elevated text-secondary dark:text-dark-text-secondary uppercase text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2">Title</th>
                      <th className="px-3.5 py-2">Subject</th>
                      <th className="px-3.5 py-2">Class</th>
                      <th className="px-3.5 py-2">Due Date</th>
                      <th className="px-3.5 py-2">Submissions</th>
                      <th className="px-3.5 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                    {homework.map((hw) => (
                      <tr key={hw._id} className="hover:bg-surface/40 dark:hover:bg-dark-hover">
                        <td className="px-3.5 py-2.5 font-bold text-deep dark:text-dark-text">{hw.title}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{hw.subject?.name || '—'}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{hw.schoolClass?.name || '—'}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{new Date(hw.dueDate).toLocaleDateString()}</td>
                        <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">{hw.submissions?.length || 0}</td>
                        <td className="px-3.5 py-2.5 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            hw.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {hw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
                No homework assignments created by this teacher yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. STUDENTS TAUGHT TAB */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-forest dark:text-emerald-400" /> Enrolled Students ({filteredStudents.length})
            </h2>
            <input
              type="text"
              placeholder="Search student name..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="px-3 py-1.5 bg-surface dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-xs w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
          </div>

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/60 dark:bg-dark-elevated text-secondary dark:text-dark-text-secondary uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2">Admission No</th>
                    <th className="px-3.5 py-2">Student Name</th>
                    <th className="px-3.5 py-2">Class / Section</th>
                    <th className="px-3.5 py-2">Gender</th>
                    <th className="px-3.5 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-dark-border">
                  {filteredStudents.map((st) => (
                    <tr
                      key={st._id}
                      onClick={() => navigate(`/students/${st._id}`)}
                      className="hover:bg-surface/40 dark:hover:bg-dark-hover cursor-pointer"
                    >
                      <td className="px-3.5 py-2.5 font-mono font-bold text-deep dark:text-dark-text">{st.admissionNo || '—'}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-deep dark:text-dark-text">{st.firstName} {st.lastName}</td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary">
                        {st.currentClass?.name || '—'} {st.currentSection ? `(${st.currentSection.name})` : ''}
                      </td>
                      <td className="px-3.5 py-2.5 text-secondary dark:text-dark-text-secondary capitalize">{st.gender || '—'}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <Link
                          to={`/students/${st._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-forest dark:text-emerald-400 hover:bg-forest/10 rounded-lg inline-flex items-center gap-1 font-semibold"
                        >
                          Profile <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
              No students found for this teacher's assigned classes.
            </p>
          )}
        </div>
      )}

      {/* 7. ACTIVITY TIMELINE TAB */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border/60">
            <Clock size={14} className="text-forest dark:text-emerald-400" /> Chronological System Activity Feed
          </h2>

          {auditLogs.length > 0 ? (
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60 dark:before:bg-dark-border">
              {auditLogs.map((log) => (
                <div key={log._id} className="relative flex items-start gap-3 text-xs">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-forest dark:bg-emerald-500 ring-4 ring-white dark:ring-dark-card" />
                  <div>
                    <p className="font-semibold text-deep dark:text-dark-text">
                      {log.action?.replace(/_/g, ' ') || 'Activity Log'}
                    </p>
                    <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">
                      By {log.actor?.name || 'System'} ({log.actor?.role || 'Admin'}) • {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted dark:text-dark-text-muted italic py-6 text-center">
              No recent audit activity records found for this teacher.
            </p>
          )}
        </div>
      )}

      {/* ──────────────────────── EDIT TEACHER MODAL ──────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Teacher Details" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name *"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name *"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Employee ID *"
              value={editForm.employeeId}
              onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
            />
            <Input
              label="Department"
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Gender"
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              value={editForm.gender}
              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
            />
            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'left', label: 'Left' },
              ]}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Weekly Limit (Periods)"
              type="number"
              value={editForm.weeklyTeachingLimit}
              onChange={(e) => setEditForm({ ...editForm, weeklyTeachingLimit: e.target.value })}
            />
            <Input
              label="Daily Limit (Periods)"
              type="number"
              value={editForm.dailyTeachingLimit}
              onChange={(e) => setEditForm({ ...editForm, dailyTeachingLimit: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} loading={savingEdit}>Save Changes</Button>
        </div>
      </Modal>
    </div>
  );
}
