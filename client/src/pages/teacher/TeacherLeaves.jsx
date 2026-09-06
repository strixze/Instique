import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter,
  User, BookOpen, MapPin, RefreshCw, X, ShieldAlert, ArrowRight, ClipboardList,
  GraduationCap, Check, Eye, ExternalLink, MessageSquare, AlertTriangle, FileText,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { leaveApi } from '../../api/leave.api';
import { substitutionApi } from '../../api/substitution.api';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'gray',
};

const leaveTypeOptions = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'other', label: 'Other' },
];

export default function TeacherLeaves() {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'substitutions' | 'class-leaves'

  // Leaves State
  const [leaves, setLeaves] = useState([]);
  const [leavesMeta, setLeavesMeta] = useState(null);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [leavesPage, setLeavesPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');

  // Substitutions State
  const [substitutions, setSubstitutions] = useState([]);
  const [subsMeta, setSubsMeta] = useState(null);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsPage, setSubsPage] = useState(1);

  // Student/Class Leaves State (for Class Teachers)
  const [classLeaves, setClassLeaves] = useState([]);
  const [classLeavesMeta, setClassLeavesMeta] = useState(null);
  const [classLeavesLoading, setClassLeavesLoading] = useState(true);
  const [classLeavesPage, setClassLeavesPage] = useState(1);
  const [classFilterStatus, setClassFilterStatus] = useState('pending');
  const [classPendingCount, setClassPendingCount] = useState(0);

  // Review & Action State
  const [approvingId, setApprovingId] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedClassLeave, setSelectedClassLeave] = useState(null);

  // Apply Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const [formData, setFormData] = useState({
    type: 'sick',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isPartialDay: false,
    startTime: '09:00',
    endTime: '12:00',
    reason: '',
  });

  // Load My Leaves
  const fetchLeaves = useCallback(async () => {
    setLeavesLoading(true);
    try {
      const params = { page: leavesPage, limit: 15 };
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await leaveApi.getMyLeaves(params);
      setLeaves(res.data || []);
      setLeavesMeta(res.meta || null);
    } catch (err) {
      toast.error(err?.message || 'Failed to load leave requests');
    } finally {
      setLeavesLoading(false);
    }
  }, [leavesPage, filterStatus]);

  // Load My Substitutions
  const fetchSubstitutions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await substitutionApi.getMySubstitutions({ page: subsPage, limit: 15 });
      setSubstitutions(res.data || []);
      setSubsMeta(res.meta || null);
    } catch (err) {
      toast.error(err?.message || 'Failed to load assigned substitutions');
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage]);

  // Load Class Leaves (Students under this teacher's class)
  const fetchClassLeaves = useCallback(async () => {
    setClassLeavesLoading(true);
    try {
      const params = { page: classLeavesPage, limit: 15 };
      if (classFilterStatus !== 'all') params.status = classFilterStatus;
      const res = await leaveApi.getClassRequests(params);
      setClassLeaves(res.data || []);
      setClassLeavesMeta(res.meta || null);

      // Also get quick pending count
      const pendingRes = await leaveApi.getClassRequests({ status: 'pending', limit: 1 });
      setClassPendingCount(pendingRes?.meta?.total ?? 0);
    } catch (err) {
      console.error('Failed to load class leaves:', err);
    } finally {
      setClassLeavesLoading(false);
    }
  }, [classLeavesPage, classFilterStatus]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchSubstitutions();
  }, [fetchSubstitutions]);

  useEffect(() => {
    fetchClassLeaves();
  }, [fetchClassLeaves]);

  // Submit Leave Request (Self)
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      toast.error('Please enter a reason for your leave');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setSubmitting(true);
    try {
      await leaveApi.create(formData);
      toast.success('Leave request submitted successfully');
      setIsApplyOpen(false);
      setFormData({
        type: 'sick',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isPartialDay: false,
        startTime: '09:00',
        endTime: '12:00',
        reason: '',
      });
      fetchLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Leave (Self)
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    setCancellingId(leaveId);
    try {
      await leaveApi.cancel(leaveId, 'Cancelled by teacher');
      toast.success('Leave request cancelled');
      fetchLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel leave request');
    } finally {
      setCancellingId(null);
    }
  };

  // Approve Student Leave (Class Teacher Action)
  const handleApproveStudentLeave = async (item) => {
    const studentName = item.student ? `${item.student.firstName} ${item.student.lastName}` : 'this student';
    if (!window.confirm(`Approve leave request for ${studentName}? Attendance for the leave period will be marked as 'Leave'.`)) {
      return;
    }
    setApprovingId(item._id);
    try {
      await leaveApi.approve(item._id);
      toast.success(`Leave approved for ${studentName}. Attendance updated.`);
      fetchClassLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to approve student leave');
    } finally {
      setApprovingId(null);
    }
  };

  // Open Reject Modal for Student Leave
  const handleOpenRejectModal = (item) => {
    setRejectingLeave(item);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  // Submit Student Leave Rejection
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setRejecting(true);
    try {
      await leaveApi.reject(rejectingLeave._id, { rejectionReason: rejectionReason.trim() });
      toast.success('Student leave request rejected');
      setRejectModalOpen(false);
      setRejectingLeave(null);
      setRejectionReason('');
      fetchClassLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to reject student leave');
    } finally {
      setRejecting(false);
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = (item) => {
    setSelectedClassLeave(item);
    setDetailModalOpen(true);
  };

  // KPI Metrics
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Leave & Substitution Management"
        description="Apply for leave, track request statuses, and view assigned class substitutions"
        action={
          <Button onClick={() => setIsApplyOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Apply for Leave
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">My Pending</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">My Approved</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">My Rejected</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{rejectedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Assigned Subs</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{substitutions.length}</p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('class-leaves')}
          className={`cursor-pointer rounded-xl p-4 border transition-all flex items-center gap-3 ${
            classPendingCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/15'
              : 'bg-white dark:bg-dark-card border-border dark:border-dark-border hover:border-forest/40'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${classPendingCount > 0 ? 'bg-amber-500 text-white' : 'bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Class Requests</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-deep dark:text-dark-text">{classPendingCount}</span>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-border dark:border-dark-border">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'leaves'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <Calendar size={16} /> My Leave Applications
        </button>
        <button
          onClick={() => setActiveTab('substitutions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'substitutions'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <ClipboardList size={16} /> Assigned Substitutions ({substitutions.length})
        </button>
        <button
          onClick={() => setActiveTab('class-leaves')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'class-leaves'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <GraduationCap size={16} /> Student Leave Requests
          {classPendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              {classPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MY LEAVE APPLICATIONS */}
      {activeTab === 'leaves' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-muted dark:text-dark-text-muted" />
              {['all', 'pending', 'approved', 'rejected', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterStatus === st
                      ? 'bg-sage dark:bg-emerald-500/20 text-forest dark:text-emerald-400 font-bold'
                      : 'text-muted dark:text-dark-text-muted hover:bg-surface dark:hover:bg-dark-hover'
                  }`}
                >
                  {st === 'all' ? 'All' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchLeaves}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 dark:bg-dark-elevated border-b border-border dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Leave Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Dates</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase min-w-[200px]">Reason</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Applied On</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-dark-border bg-white dark:bg-dark-card">
                {leavesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted dark:text-dark-text-muted">
                      Loading leave applications...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted dark:text-dark-text-muted">
                      No leave requests found. Click "Apply for Leave" above to submit a new request.
                    </td>
                  </tr>
                ) : (
                  leaves.map((item) => {
                    const startStr = new Date(item.startDate).toLocaleDateString();
                    const endStr = new Date(item.endDate).toLocaleDateString();
                    const sameDay = startStr === endStr;
                    const diffDays = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                      <tr key={item._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                        <td className="px-4 py-3 font-semibold text-deep dark:text-dark-text capitalize">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-forest dark:bg-emerald-400" />
                            {item.type || 'Leave'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-deep dark:text-dark-text text-xs">
                          {sameDay ? startStr : `${startStr} – ${endStr}`}
                          {item.isPartialDay && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                              {item.startTime} – {item.endTime}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-secondary dark:text-dark-text-secondary">
                          {item.isPartialDay ? 'Partial Day' : `${diffDays} Day${diffDays > 1 ? 's' : ''}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted dark:text-dark-text-muted">
                          <p className="line-clamp-2">{item.reason}</p>
                          {item.rejectionReason && (
                            <p className="text-rose-500 dark:text-rose-400 font-medium text-[11px] mt-0.5">
                              Rejection note: {item.rejectionReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={statusColors[item.status] || 'gray'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted dark:text-dark-text-muted">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'pending' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelLeave(item._id)}
                              loading={cancellingId === item._id}
                              className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-muted dark:text-dark-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: ASSIGNED SUBSTITUTIONS */}
      {activeTab === 'substitutions' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border dark:border-dark-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-deep dark:text-dark-text">
              Lectures You Are Covering for Colleagues
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchSubstitutions}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 dark:bg-dark-elevated border-b border-border dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Class & Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Subject</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Covering For</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-dark-border bg-white dark:bg-dark-card">
                {subsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted dark:text-dark-text-muted">
                      Loading assigned substitutions...
                    </td>
                  </tr>
                ) : substitutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted dark:text-dark-text-muted">
                      You have no assigned substitution coverage lectures.
                    </td>
                  </tr>
                ) : (
                  substitutions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3 font-semibold text-deep dark:text-dark-text text-xs">
                        <div>{new Date(sub.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="text-[11px] text-muted dark:text-dark-text-muted font-normal mt-0.5 flex items-center gap-1">
                          <Clock size={11} /> Period {sub.periodNo} ({sub.startTime} – {sub.endTime})
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-deep dark:text-dark-text text-xs">
                        Class {sub.schoolClass?.name || '—'} - {sub.section?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-forest dark:text-emerald-400">
                        {sub.subject?.name || 'Subject'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-secondary dark:text-dark-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-muted" />
                          {sub.room || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-deep dark:text-dark-text font-medium">
                        {sub.originalTeacher ? `${sub.originalTeacher.firstName} ${sub.originalTeacher.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color="success">Assigned</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: STUDENT LEAVE REQUESTS */}
      {activeTab === 'class-leaves' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter size={14} className="text-muted dark:text-dark-text-muted mr-1" />
              {['pending', 'approved', 'rejected', 'all'].map((st) => (
                <button
                  key={st}
                  onClick={() => setClassFilterStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    classFilterStatus === st
                      ? 'bg-forest text-white dark:bg-emerald-500 font-bold shadow-sm'
                      : 'text-muted dark:text-dark-text-muted hover:bg-surface dark:hover:bg-dark-hover'
                  }`}
                >
                  {st === 'all' ? 'All Requests' : st.charAt(0).toUpperCase() + st.slice(1)}
                  {st === 'pending' && classPendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
                      {classPendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchClassLeaves}>
              <RefreshCw size={14} className="mr-1" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 dark:bg-dark-elevated border-b border-border dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Leave Type & Dates</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase min-w-[200px]">Reason & Note</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-dark-border bg-white dark:bg-dark-card">
                {classLeavesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted dark:text-dark-text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-forest dark:text-emerald-400" />
                        <span>Loading student leave requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : classLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted dark:text-dark-text-muted">
                      <div className="max-w-md mx-auto space-y-2">
                        <GraduationCap size={36} className="mx-auto text-muted/60 dark:text-dark-text-muted/60" />
                        <p className="font-semibold text-deep dark:text-dark-text">No student leave requests found</p>
                        <p className="text-xs text-muted dark:text-dark-text-muted">
                          {classFilterStatus === 'pending'
                            ? 'Great job! There are no pending leave requests for your class students.'
                            : 'No leave requests match the selected status filter.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  classLeaves.map((item) => {
                    const student = item.student;
                    const parent = item.parent;
                    const startStr = new Date(item.startDate).toLocaleDateString();
                    const endStr = new Date(item.endDate).toLocaleDateString();
                    const sameDay = startStr === endStr;
                    const diffDays = Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                      <tr key={item._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-forest/10 dark:bg-emerald-500/20 text-forest dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {student?.firstName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-deep dark:text-dark-text text-sm">
                                {student ? `${student.firstName} ${student.lastName}` : 'Student'}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted dark:text-dark-text-muted">
                                {student?.rollNumber && <span>Roll: {student.rollNumber}</span>}
                                {student?.admissionNo && <span>• Adm: {student.admissionNo}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Parent */}
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium text-deep dark:text-dark-text">
                            {parent ? `${parent.firstName} ${parent.lastName}` : 'Parent'}
                          </p>
                          <p className="text-muted dark:text-dark-text-muted text-[11px]">
                            {parent?.phone || '—'}
                          </p>
                        </td>

                        {/* Leave Type & Dates */}
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-2 h-2 rounded-full bg-forest dark:bg-emerald-400" />
                            <span className="font-semibold text-deep dark:text-dark-text capitalize">
                              {item.type || 'Leave'}
                            </span>
                          </div>
                          <p className="text-muted dark:text-dark-text-muted">
                            {sameDay ? startStr : `${startStr} – ${endStr}`}
                          </p>
                          {item.isPartialDay && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 text-[10px] font-medium">
                              {item.startTime} – {item.endTime}
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 text-center text-xs text-secondary dark:text-dark-text-secondary">
                          {item.isPartialDay ? 'Partial Day' : `${diffDays} Day${diffDays > 1 ? 's' : ''}`}
                        </td>

                        {/* Reason & Attachment */}
                        <td className="px-4 py-3 text-xs">
                          <p className="text-deep dark:text-dark-text line-clamp-2">{item.reason}</p>
                          {item.document?.url && (
                            <a
                              href={item.document.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-[11px] text-forest dark:text-emerald-400 hover:underline font-medium"
                            >
                              <FileText size={12} />
                              <span>{item.document.name || 'View Attachment'}</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                          {item.rejectionReason && (
                            <p className="text-rose-500 dark:text-rose-400 font-medium text-[11px] mt-0.5">
                              Rejected note: {item.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <Badge color={statusColors[item.status] || 'gray'}>
                            {item.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  loading={approvingId === item._id}
                                  onClick={() => handleApproveStudentLeave(item)}
                                  className="text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10 font-medium py-1 px-2.5 h-auto"
                                >
                                  <Check size={13} className="mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(item)}
                                  className="text-xs text-rose-600 border-rose-600/30 hover:bg-rose-500/10 font-medium py-1 px-2.5 h-auto"
                                >
                                  <X size={13} className="mr-1" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDetailModal(item)}
                                className="text-xs text-muted hover:text-deep dark:hover:text-dark-text py-1 px-2 h-auto"
                              >
                                <Eye size={13} className="mr-1" /> Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* REJECT STUDENT LEAVE MODAL */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!rejecting) {
            setRejectModalOpen(false);
            setRejectingLeave(null);
          }
        }}
        title="Reject Student Leave Request"
      >
        {rejectingLeave && (
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Rejecting leave for:{' '}
                <span className="font-bold">
                  {rejectingLeave.student
                    ? `${rejectingLeave.student.firstName} ${rejectingLeave.student.lastName}`
                    : 'Student'}
                </span>
              </p>
              <p className="text-xs text-rose-700/80 dark:text-rose-400">
                Dates: {new Date(rejectingLeave.startDate).toLocaleDateString()} –{' '}
                {new Date(rejectingLeave.endDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-deep dark:text-dark-text mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain clearly to the parent why this leave request is rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl text-sm text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                required
              />
              <p className="text-[11px] text-muted dark:text-dark-text-muted mt-1">
                The parent will receive a notification including this explanation.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border dark:border-dark-border">
              <Button
                variant="ghost"
                type="button"
                disabled={rejecting}
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingLeave(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={rejecting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* STUDENT LEAVE DETAIL MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedClassLeave(null);
        }}
        title="Student Leave Application Details"
      >
        {selectedClassLeave && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-dark-border">
              <div>
                <h4 className="font-bold text-deep dark:text-dark-text text-base">
                  {selectedClassLeave.student
                    ? `${selectedClassLeave.student.firstName} ${selectedClassLeave.student.lastName}`
                    : 'Student'}
                </h4>
                <p className="text-xs text-muted dark:text-dark-text-muted">
                  Applied on {new Date(selectedClassLeave.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge color={statusColors[selectedClassLeave.status] || 'gray'}>
                {selectedClassLeave.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-surface dark:bg-dark-elevated rounded-xl">
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Leave Type</span>
                <span className="font-semibold text-deep dark:text-dark-text capitalize">
                  {selectedClassLeave.type}
                </span>
              </div>
              <div className="p-3 bg-surface dark:bg-dark-elevated rounded-xl">
                <span className="text-muted dark:text-dark-text-muted block text-[11px]">Duration</span>
                <span className="font-semibold text-deep dark:text-dark-text">
                  {new Date(selectedClassLeave.startDate).toLocaleDateString()} –{' '}
                  {new Date(selectedClassLeave.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface dark:bg-dark-elevated rounded-xl space-y-1 text-xs">
              <span className="text-muted dark:text-dark-text-muted block text-[11px]">Parent Information</span>
              <p className="font-semibold text-deep dark:text-dark-text">
                {selectedClassLeave.parent
                  ? `${selectedClassLeave.parent.firstName} ${selectedClassLeave.parent.lastName}`
                  : 'Parent'}
              </p>
              {selectedClassLeave.parent?.phone && (
                <p className="text-muted dark:text-dark-text-muted">{selectedClassLeave.parent.phone}</p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-muted dark:text-dark-text-muted block font-medium">Reason for Leave</span>
              <p className="p-3 bg-surface/60 dark:bg-dark-elevated/60 border border-border dark:border-dark-border rounded-xl text-deep dark:text-dark-text">
                {selectedClassLeave.reason}
              </p>
            </div>

            {selectedClassLeave.rejectionReason && (
              <div className="space-y-1 text-xs">
                <span className="text-rose-500 font-medium block">Rejection Note</span>
                <p className="p-3 bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300">
                  {selectedClassLeave.rejectionReason}
                </p>
              </div>
            )}

            {selectedClassLeave.document?.url && (
              <div className="pt-2">
                <a
                  href={selectedClassLeave.document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-forest dark:text-emerald-400 font-semibold hover:underline"
                >
                  <FileText size={14} />
                  <span>View Attached Medical / Supporting Document</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border dark:border-dark-border">
              <Button
                variant="ghost"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedClassLeave(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* APPLY FOR LEAVE MODAL */}
      <Modal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          <Select
            label="Leave Type"
            options={leaveTypeOptions}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface dark:bg-dark-elevated border border-border dark:border-dark-border">
            <div>
              <p className="text-xs font-bold text-deep dark:text-dark-text">Partial Day Leave</p>
              <p className="text-[11px] text-muted dark:text-dark-text-muted">Apply for specific hours only (e.g. 10 AM to 2 PM)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPartialDay}
                onChange={(e) => setFormData({ ...formData, isPartialDay: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 dark:bg-dark-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest dark:peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          {formData.isPartialDay && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface/50 dark:bg-dark-elevated/50 border border-border dark:border-dark-border">
              <Input
                type="time"
                label="Start Time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                type="time"
                label="End Time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-deep dark:text-dark-text mb-1">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State the reason for your leave request..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-2.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl text-sm text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/30 dark:focus:ring-emerald-500/30"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border dark:border-dark-border">
            <Button variant="ghost" type="button" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
