import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar, Check, X, Clock, AlertCircle, CheckCircle, XCircle, Users,
  Search, Filter, RefreshCw, User, BookOpen, MapPin, Award, ArrowRight,
  ShieldAlert, ChevronRight, CheckSquare, Eye, Edit3, ClipboardList, ChevronDown,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import UserAvatar from '../../components/ui/UserAvatar';
import { leaveApi } from '../../api/leave.api';
import { substitutionApi } from '../../api/substitution.api';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'gray',
};

const leaveTypeLabels = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  personal: 'Personal Leave',
  emergency: 'Emergency Leave',
  earned: 'Earned Leave',
  vacation: 'Vacation Leave',
  other: 'Other',
};

export default function Leaves() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'history' | 'substitutions'

  // Data State
  const [leaves, setLeaves] = useState([]);
  const [leavesMeta, setLeavesMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Substitutions State
  const [substitutions, setSubstitutions] = useState([]);
  const [subsMeta, setSubsMeta] = useState(null);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsPage, setSubsPage] = useState(1);
  const [subsStatusFilter, setSubsStatusFilter] = useState('all');

  // --- APPROVAL WORKFLOW MODAL STATE ---
  const [approvalModalLeave, setApprovalModalLeave] = useState(null); // Pending leave being approved
  const [affectedLectures, setAffectedLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  // Map of lectureKey -> selected substitute teacher object { _id, firstName, lastName, department }
  const [selectedSubstitutes, setSelectedSubstitutes] = useState({});
  // Set of lectureKeys expanding the "Busy Teachers" view
  const [expandedBusySlots, setExpandedBusySlots] = useState({});

  // Confirmation View Step in Approval Modal
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);
  const [approving, setApproving] = useState(false);

  // --- REJECT MODAL STATE ---
  const [rejectOpenLeave, setRejectOpenLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // --- VIEW DETAILS MODAL STATE ---
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);

  // Fetch Leaves
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (activeTab === 'pending') params.status = 'pending';
      else if (activeTab === 'approved') params.status = 'approved';
      else if (activeTab === 'history') params.status = 'all';

      if (filterType !== 'all') params.type = filterType;

      const res = await leaveApi.getAll(params);
      setLeaves(res.data || []);
      setLeavesMeta(res.meta || null);
    } catch (e) {
      toast.error(e?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, filterType]);

  // Fetch Substitutions
  const fetchSubstitutions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const params = { page: subsPage, limit: 15 };
      if (subsStatusFilter !== 'all') params.status = subsStatusFilter;
      const res = await substitutionApi.getAll(params);
      setSubstitutions(res.data || []);
      setSubsMeta(res.meta || null);
    } catch (e) {
      toast.error(e?.message || 'Failed to load substitutions');
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage, subsStatusFilter]);

  useEffect(() => {
    if (activeTab === 'substitutions') {
      fetchSubstitutions();
    } else {
      fetchLeaves();
    }
  }, [activeTab, fetchLeaves, fetchSubstitutions]);

  // --- OPEN APPROVAL WORKFLOW MODAL (Auto-fetches affected lectures & free teacher lists) ---
  const handleStartApproval = async (leave) => {
    setApprovalModalLeave(leave);
    setSelectedSubstitutes({});
    setExpandedBusySlots({});
    setIsConfirmingApproval(false);
    setLecturesLoading(true);

    try {
      const res = await leaveApi.getSubstitutionOptions(leave._id);
      const lectures = res.data?.affectedLectures || [];
      setAffectedLectures(lectures);
    } catch (e) {
      toast.error(e?.message || 'Failed to calculate affected lectures and free teachers');
      setApprovalModalLeave(null);
    } finally {
      setLecturesLoading(false);
    }
  };

  // Select a replacement teacher for a lecture slot
  const handleSelectTeacherForSlot = (lectureKey, teacher) => {
    setSelectedSubstitutes((prev) => ({
      ...prev,
      [lectureKey]: teacher,
    }));
  };

  // Toggle busy teachers view for a lecture slot
  const toggleBusySlot = (lectureKey) => {
    setExpandedBusySlots((prev) => ({
      ...prev,
      [lectureKey]: !prev[lectureKey],
    }));
  };

  // Submit Final Approval + Assignments to Backend
  const handleConfirmAndApprove = async () => {
    if (!approvalModalLeave) return;

    // Build assignments payload
    const assignmentsPayload = affectedLectures.map((slot) => {
      const selectedTeacher = selectedSubstitutes[slot.lectureKey];
      return {
        lectureKey: slot.lectureKey,
        timetableId: slot.timetableId,
        date: new Date(slot.date).toISOString().split('T')[0],
        day: slot.day,
        periodNo: slot.periodNo,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectId: slot.subject?._id || slot.subject,
        classId: slot.schoolClass?._id || slot.schoolClass,
        sectionId: slot.section?._id || slot.section,
        room: slot.room,
        originalTeacherId: slot.originalTeacher?._id,
        substituteTeacherId: selectedTeacher?._id,
      };
    });

    setApproving(true);
    try {
      await leaveApi.approve(approvalModalLeave._id, { assignments: assignmentsPayload });
      toast.success('Leave approved and substitute teachers assigned successfully!');
      setApprovalModalLeave(null);
      setIsConfirmingApproval(false);
      fetchLeaves();
    } catch (e) {
      toast.error(e?.message || 'Failed to approve leave');
    } finally {
      setApproving(false);
    }
  };

  // --- REJECT LEAVE FLOW ---
  const handleRejectLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    setRejecting(true);
    try {
      await leaveApi.reject(rejectOpenLeave._id, { rejectionReason: rejectionReason.trim() });
      toast.success('Leave request rejected');
      setRejectOpenLeave(null);
      setRejectionReason('');
      fetchLeaves();
    } catch (e) {
      toast.error(e?.message || 'Failed to reject leave');
    } finally {
      setRejecting(false);
    }
  };

  // View Leave Details
  const handleOpenDetails = async (leaveId) => {
    try {
      const res = await leaveApi.getById(leaveId);
      setSelectedLeaveDetails(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to fetch leave details');
    }
  };

  // Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    if (!searchTerm) return true;
    const name = l.requester?.name || '';
    const reason = l.reason || '';
    const type = l.type || '';
    const search = searchTerm.toLowerCase();
    return name.toLowerCase().includes(search) || reason.toLowerCase().includes(search) || type.toLowerCase().includes(search);
  });

  const assignedCount = Object.keys(selectedSubstitutes).length;
  const isAllAssigned = affectedLectures.length === 0 || assignedCount === affectedLectures.length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Leave & Substitution Management"
        description="Review teacher leave applications, resolve affected lecture coverage, and assign substitute teachers prior to approval"
        action={
          <Button variant="outline" size="sm" onClick={() => { fetchLeaves(); fetchSubstitutions(); }}>
            <RefreshCw size={14} className="mr-1.5" /> Refresh Data
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Pending Leaves</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">
              {leaves.filter((l) => l.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Approved Leaves</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">
              {leaves.filter((l) => l.status === 'approved').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Rejected / Cancelled</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">
              {leaves.filter((l) => l.status === 'rejected' || l.status === 'cancelled').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Total Substitutions</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{substitutions.length}</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-border dark:border-dark-border">
        <button
          onClick={() => { setActiveTab('pending'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <AlertCircle size={15} /> Pending Requests
        </button>

        <button
          onClick={() => { setActiveTab('approved'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'approved'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <CheckCircle size={15} /> Approved Leaves
        </button>

        <button
          onClick={() => { setActiveTab('history'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <Calendar size={15} /> All History
        </button>

        <button
          onClick={() => { setActiveTab('substitutions'); setSubsPage(1); }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'substitutions'
              ? 'border-forest text-forest dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text'
          }`}
        >
          <ClipboardList size={15} /> Substitutions Coverage Manager
        </button>
      </div>

      {/* LEAVES TABLE (TAB 1, 2, 3) */}
      {activeTab !== 'substitutions' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted" />
              <input
                type="text"
                placeholder="Search requester, reason, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-sm text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/30 dark:focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-muted dark:text-dark-text-muted" />
              {['all', 'sick', 'casual', 'personal', 'emergency'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    filterType === t
                      ? 'bg-sage dark:bg-emerald-500/20 text-forest dark:text-emerald-400 font-bold'
                      : 'text-muted dark:text-dark-text-muted hover:bg-surface dark:hover:bg-dark-hover'
                  }`}
                >
                  {t === 'all' ? 'All Types' : leaveTypeLabels[t] || t}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 dark:bg-dark-elevated border-b border-border dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Requester</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Leave Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Date Range</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase min-w-[180px]">Reason</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-dark-border bg-white dark:bg-dark-card">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted dark:text-dark-text-muted">
                      Loading leave applications...
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted dark:text-dark-text-muted">
                      No leave requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((row) => (
                    <tr key={row._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3 font-semibold text-deep dark:text-dark-text">
                        {row.requester?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={row.requesterModel === 'Teacher' ? 'info' : 'gray'}>
                          {row.requesterModel || 'User'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-deep dark:text-dark-text text-xs capitalize">
                        {leaveTypeLabels[row.type] || row.type}
                      </td>
                      <td className="px-4 py-3 text-xs text-deep dark:text-dark-text">
                        <div>{new Date(row.startDate).toLocaleDateString()} – {new Date(row.endDate).toLocaleDateString()}</div>
                        {row.isPartialDay && (
                          <span className="text-[10px] text-blue-400 font-semibold">
                            Partial Day ({row.startTime} - {row.endTime})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted dark:text-dark-text-muted">
                        <p className="line-clamp-2">{row.reason}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={statusColors[row.status] || 'gray'}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(row._id)}
                            className="text-xs"
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>

                          {row.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStartApproval(row)}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve Leave
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setRejectOpenLeave(row); setRejectionReason(''); }}
                                className="text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SUBSTITUTIONS MANAGER TAB */}
      {activeTab === 'substitutions' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-deep dark:text-dark-text">
              Active & Historical Substitution Records
            </h3>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-muted dark:text-dark-text-muted" />
              {['all', 'assigned', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSubsStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    subsStatusFilter === st
                      ? 'bg-sage dark:bg-emerald-500/20 text-forest dark:text-emerald-400 font-bold'
                      : 'text-muted dark:text-dark-text-muted hover:bg-surface dark:hover:bg-dark-hover'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface/80 dark:bg-dark-elevated border-b border-border dark:border-dark-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Date & Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Class & Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Original Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Substitute Teacher</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted dark:text-dark-text-secondary uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-dark-border bg-white dark:bg-dark-card">
                {subsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted dark:text-dark-text-muted">
                      Loading substitutions...
                    </td>
                  </tr>
                ) : substitutions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted dark:text-dark-text-muted">
                      No substitution requirements recorded.
                    </td>
                  </tr>
                ) : (
                  substitutions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-surface/50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-4 py-3 font-semibold text-deep dark:text-dark-text text-xs">
                        <div>{new Date(sub.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div className="text-[11px] text-muted dark:text-dark-text-muted font-normal mt-0.5">
                          Period {sub.periodNo} ({sub.startTime} – {sub.endTime})
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-deep dark:text-dark-text text-xs">
                        Class {sub.schoolClass?.name || '—'} - {sub.section?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-forest dark:text-emerald-400">
                        {sub.subject?.name || 'Subject'}
                      </td>
                      <td className="px-4 py-3 text-xs text-deep dark:text-dark-text">
                        {sub.originalTeacher ? `${sub.originalTeacher.firstName} ${sub.originalTeacher.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-deep dark:text-dark-text">
                        {sub.substituteTeacher ? (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle size={13} />
                            {sub.substituteTeacher.firstName} {sub.substituteTeacher.lastName}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-semibold flex items-center gap-1">
                            <AlertCircle size={13} /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={statusColors[sub.status] || 'gray'}>{sub.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================================= */}
      {/* REQUIRED APPROVAL WORKFLOW MODAL                                        */}
      {/* ======================================================================= */}
      <Modal
        isOpen={!!approvalModalLeave}
        onClose={() => setApprovalModalLeave(null)}
        title="Approve Leave & Assign Replacement Teachers"
        size="xl"
      >
        {approvalModalLeave && (
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="p-4 rounded-xl bg-surface dark:bg-dark-elevated border border-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-deep dark:text-dark-text">
                  {approvalModalLeave.requester?.name}
                </h3>
                <p className="text-xs text-muted dark:text-dark-text-muted mt-0.5">
                  <span className="font-semibold text-forest dark:text-emerald-400 capitalize">
                    {leaveTypeLabels[approvalModalLeave.type] || approvalModalLeave.type}
                  </span>
                  {' · '}
                  {new Date(approvalModalLeave.startDate).toLocaleDateString()}
                  {approvalModalLeave.startDate !== approvalModalLeave.endDate && ` – ${new Date(approvalModalLeave.endDate).toLocaleDateString()}`}
                  {' · '}
                  {approvalModalLeave.isPartialDay ? `Partial Day (${approvalModalLeave.startTime} - ${approvalModalLeave.endTime})` : 'Full Day'}
                </p>
                <p className="text-xs text-deep dark:text-dark-text mt-1 italic">
                  "{approvalModalLeave.reason}"
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-muted dark:text-dark-text-muted uppercase block">
                  Assignments Progress
                </span>
                <span className={`text-lg font-bold ${isAllAssigned ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {assignedCount} / {affectedLectures.length} Assigned
                </span>
              </div>
            </div>

            {/* STEP 1: AFFECTED LECTURES & REPLACEMENT SELECTION */}
            {!isConfirmingApproval ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-deep dark:text-dark-text flex items-center gap-1.5">
                    <BookOpen size={14} className="text-forest dark:text-emerald-400" />
                    Affected Lectures ({affectedLectures.length})
                  </h4>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartApproval(approvalModalLeave)}
                    className="text-xs"
                  >
                    <RefreshCw size={12} className="mr-1" /> Refresh Availability
                  </Button>
                </div>

                {lecturesLoading ? (
                  <div className="py-12 text-center text-xs text-muted dark:text-dark-text-muted">
                    Finding available teachers for affected lectures...
                  </div>
                ) : affectedLectures.length === 0 ? (
                  <div className="p-6 text-center border border-border dark:border-dark-border rounded-xl bg-surface/50 dark:bg-dark-card space-y-2">
                    <CheckCircle size={28} className="text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-deep dark:text-dark-text">No timetable coverage required</p>
                    <p className="text-xs text-muted dark:text-dark-text-muted">
                      This teacher has no scheduled lectures during the requested leave period.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                    {affectedLectures.map((lecture) => {
                      const selectedTeacher = selectedSubstitutes[lecture.lectureKey];
                      const freeTeachers = lecture.freeTeachers || [];
                      const busyTeachers = lecture.busyTeachers || [];
                      const isBusyExpanded = Boolean(expandedBusySlots[lecture.lectureKey]);

                      return (
                        <div
                          key={lecture.lectureKey}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            selectedTeacher
                              ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                              : 'border-border dark:border-dark-border bg-white dark:bg-dark-card'
                          }`}
                        >
                          {/* Slot Meta Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 dark:border-dark-border pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-400">
                                  {lecture.startTime} – {lecture.endTime}
                                </span>
                                <span className="text-xs text-muted dark:text-dark-text-muted font-medium">
                                  {new Date(lecture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>

                              <h5 className="text-sm font-bold text-deep dark:text-dark-text mt-1">
                                {lecture.subject?.name || 'Subject'}
                                <span className="text-xs font-normal text-muted dark:text-dark-text-muted ml-2">
                                  Class {lecture.schoolClass?.name || '—'} {lecture.section?.name ? `(${lecture.section.name})` : ''} · Room {lecture.room || '—'}
                                </span>
                              </h5>
                            </div>

                            <div className="text-right text-xs">
                              <span className="text-muted dark:text-dark-text-muted block text-[11px]">Original Teacher</span>
                              <span className="font-bold text-deep dark:text-dark-text">
                                {lecture.originalTeacher?.firstName} {lecture.originalTeacher?.lastName}
                              </span>
                            </div>
                          </div>

                          {/* AVAILABLE SUBSTITUTE TEACHERS LIST (AUTOMATICALLY DISPLAYED) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle size={13} /> Available Substitute Teachers ({freeTeachers.length})
                              </span>

                              {busyTeachers.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleBusySlot(lecture.lectureKey)}
                                  className="text-[11px] text-muted hover:text-deep underline font-medium"
                                >
                                  {isBusyExpanded ? 'Hide Busy Teachers' : `View Busy Teachers (${busyTeachers.length})`}
                                </button>
                              )}
                            </div>

                            {freeTeachers.length === 0 ? (
                              <div className="p-3 text-center text-xs text-rose-500 font-semibold border border-rose-500/20 rounded-lg bg-rose-500/5">
                                No available substitute teachers. All teachers are busy, on leave, or unavailable during this period.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {freeTeachers.map(({ teacher, badgeText, substitutionsToday, score }) => {
                                  const isSelected = selectedTeacher?._id === teacher._id;

                                  return (
                                    <div
                                      key={teacher._id}
                                      onClick={() => handleSelectTeacherForSlot(lecture.lectureKey, teacher)}
                                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                        isSelected
                                          ? 'border-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/20 shadow-sm'
                                          : 'border-border dark:border-dark-border bg-surface/50 dark:bg-dark-elevated hover:border-forest/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                          isSelected ? 'bg-emerald-500 text-white' : 'bg-forest/10 text-forest'
                                        }`}>
                                          {teacher.firstName?.charAt(0)}
                                        </div>

                                        <div className="truncate">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-deep dark:text-dark-text truncate">
                                              {teacher.firstName} {teacher.lastName}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-muted dark:text-dark-text-muted truncate">
                                            {teacher.department || 'General'} · {substitutionsToday} sub{substitutionsToday !== 1 ? 's' : ''} today
                                          </p>
                                          <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-sage dark:bg-emerald-500/20 text-forest dark:text-emerald-400 font-semibold mt-0.5">
                                            {badgeText}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all shrink-0 ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-white dark:bg-dark-card border border-border dark:border-dark-border text-deep hover:bg-forest hover:text-white'
                                        }`}
                                      >
                                        {isSelected ? 'Assigned ✓' : 'Assign'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* OPTIONAL EXPANDABLE BUSY TEACHERS LIST */}
                            {isBusyExpanded && busyTeachers.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-border dark:border-dark-border space-y-1.5">
                                <p className="text-[11px] font-bold text-rose-500 uppercase">
                                  Unavailable Teachers ({busyTeachers.length})
                                </p>
                                {busyTeachers.map(({ teacher, busyReason }) => (
                                  <div
                                    key={teacher._id}
                                    className="p-2 rounded bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-[11px] opacity-75"
                                  >
                                    <div>
                                      <span className="font-bold text-deep dark:text-dark-text mr-2">
                                        {teacher.firstName} {teacher.lastName}
                                      </span>
                                      <span className="text-rose-500 font-semibold">BUSY</span>
                                    </div>
                                    <span className="text-muted dark:text-dark-text-muted">{busyReason}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MODAL FOOTER BUTTONS FOR STEP 1 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-dark-border">
                  <Button variant="ghost" onClick={() => setApprovalModalLeave(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setIsConfirmingApproval(true)}
                    disabled={!isAllAssigned || lecturesLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    {affectedLectures.length === 0
                      ? 'Approve Leave'
                      : `Proceed to Confirm (${assignedCount}/${affectedLectures.length} Assigned)`}
                  </Button>
                </div>
              </div>
            ) : (
              /* STEP 2: FINAL CONFIRMATION SUMMARY */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-forest/5 dark:bg-emerald-500/10 border border-forest/20 dark:border-emerald-500/20 space-y-2">
                  <h4 className="text-sm font-bold text-forest dark:text-emerald-400">
                    Confirm Leave Approval & Substitutions
                  </h4>
                  <p className="text-xs text-deep dark:text-dark-text">
                    You are approving leave for <strong>{approvalModalLeave.requester?.name}</strong>. The backend will atomically validate teacher availability and assign the following substitutes:
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {affectedLectures.map((slot) => {
                    const subTeacher = selectedSubstitutes[slot.lectureKey];
                    return (
                      <div
                        key={slot.lectureKey}
                        className="p-3 rounded-lg border border-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-deep dark:text-dark-text">
                            {slot.startTime} – {slot.endTime} · {slot.subject?.name} (Class {slot.schoolClass?.name})
                          </p>
                          <p className="text-muted dark:text-dark-text-muted mt-0.5">
                            Original: {slot.originalTeacher?.firstName} {slot.originalTeacher?.lastName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-muted dark:text-dark-text-muted block">Replacement</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {subTeacher?.firstName} {subTeacher?.lastName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-dark-border">
                  <Button variant="ghost" onClick={() => setIsConfirmingApproval(false)}>
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleConfirmAndApprove}
                    loading={approving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Approve Leave & Assign {affectedLectures.length} Substitutions
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* REJECT LEAVE MODAL (NO SUBSTITUTES SHOWN) */}
      <Modal isOpen={!!rejectOpenLeave} onClose={() => setRejectOpenLeave(null)} title="Reject Leave Request">
        {rejectOpenLeave && (
          <form onSubmit={handleRejectLeaveSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-semibold">
              Rejecting leave for {rejectOpenLeave.requester?.name}. No substitute teacher assignments are required.
            </div>

            <div>
              <label className="block text-xs font-semibold text-deep dark:text-dark-text mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="State the reason for rejecting this leave application..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-xl text-sm text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border dark:border-dark-border">
              <Button variant="ghost" type="button" onClick={() => setRejectOpenLeave(null)}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" loading={rejecting}>
                Confirm Rejection
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* VIEW LEAVE DETAILS MODAL */}
      <Modal
        isOpen={!!selectedLeaveDetails}
        onClose={() => setSelectedLeaveDetails(null)}
        title="Leave Application Details"
      >
        {selectedLeaveDetails && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface dark:bg-dark-elevated border border-border dark:border-dark-border">
              <div>
                <h4 className="text-sm font-bold text-deep dark:text-dark-text">
                  {selectedLeaveDetails.leave?.requester?.name}
                </h4>
                <p className="text-xs text-muted dark:text-dark-text-muted capitalize">
                  {selectedLeaveDetails.leave?.requesterModel} · {selectedLeaveDetails.leave?.type} Leave
                </p>
              </div>
              <Badge color={statusColors[selectedLeaveDetails.leave?.status] || 'gray'}>
                {selectedLeaveDetails.leave?.status}
              </Badge>
            </div>

            <div className="space-y-2 text-xs text-deep dark:text-dark-text">
              <p>
                <strong>Date Range:</strong> {new Date(selectedLeaveDetails.leave?.startDate).toLocaleDateString()} – {new Date(selectedLeaveDetails.leave?.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Reason:</strong> {selectedLeaveDetails.leave?.reason}
              </p>
              {selectedLeaveDetails.leave?.rejectionReason && (
                <p className="text-rose-500 font-semibold">
                  <strong>Rejection Reason:</strong> {selectedLeaveDetails.leave?.rejectionReason}
                </p>
              )}
            </div>

            {selectedLeaveDetails.substitutions?.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border dark:border-dark-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-deep dark:text-dark-text">
                  Assigned Lecture Coverages ({selectedLeaveDetails.substitutions.length})
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedLeaveDetails.substitutions.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-3 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-deep dark:text-dark-text">
                          Class {sub.schoolClass?.name || ''} - {sub.section?.name || ''} · {sub.subject?.name || 'Lecture'}
                        </p>
                        <p className="text-muted dark:text-dark-text-muted mt-0.5">
                          {new Date(sub.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · Period {sub.periodNo} ({sub.startTime} – {sub.endTime})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-muted block">Substitute</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> {sub.substituteTeacher?.firstName} {sub.substituteTeacher?.lastName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
