import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, Plus,
  Filter, FileText, ChevronDown, RefreshCw, X, ShieldAlert,
  Paperclip, ExternalLink, ArrowRight, Ban, Check, Users, Sparkles
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { parentApi } from '../../api/parent.api';
import { leaveApi } from '../../api/leave.api';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'gray',
};

const statusLabels = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const leaveTypeOptions = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'other', label: 'Other' },
];

const leaveTypeLabels = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  personal: 'Personal Leave',
  emergency: 'Emergency Leave',
  vacation: 'Vacation Leave',
  earned: 'Earned Leave',
  other: 'Other',
};

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e - s);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export default function ParentLeaves() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Children State
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childrenLoading, setChildrenLoading] = useState(true);

  // Leaves State
  const [leaves, setLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Apply Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'sick',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    documentName: '',
    documentUrl: '',
  });

  // Details Modal State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // 1. Fetch authenticated parent's linked children
  const fetchChildren = useCallback(async () => {
    setChildrenLoading(true);
    try {
      const res = await parentApi.getMyChildren();
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChildId((prev) => {
          const exists = kids.some((k) => (k.id || k._id) === prev);
          const defaultId = kids[0].id || kids[0]._id;
          return exists ? prev : defaultId;
        });
      } else {
        setSelectedChildId('');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load children');
      setChildren([]);
    } finally {
      setChildrenLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // 2. Fetch leaves for the selected child
  const fetchLeaves = useCallback(async () => {
    if (!selectedChildId) {
      setLeaves([]);
      setLeavesLoading(false);
      return;
    }

    setLeavesLoading(true);
    try {
      const params = {
        studentId: selectedChildId,
        limit: 50,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const res = await leaveApi.getAll(params);
      setLeaves(res.data || []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load leave requests');
      setLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  }, [selectedChildId, statusFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Open apply modal with preselected child
  const handleOpenApply = () => {
    setFormData({
      studentId: selectedChildId || (children[0]?.id || children[0]?._id || ''),
      type: 'sick',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      documentName: '',
      documentUrl: '',
    });
    setIsApplyOpen(true);
  };

  // Auto-open apply modal if navigated with ?apply=true
  useEffect(() => {
    if (searchParams.get('apply') === 'true' && children.length > 0 && !isApplyOpen) {
      handleOpenApply();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('apply');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, children, isApplyOpen, setSearchParams]);

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();

    if (!formData.studentId) {
      toast.error('Please select a child');
      return;
    }
    if (!formData.reason || !formData.reason.trim()) {
      toast.error('Please enter a reason for the leave');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        studentId: formData.studentId,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      };

      if (formData.documentUrl) {
        payload.document = {
          name: formData.documentName || 'Attachment',
          url: formData.documentUrl,
        };
      }

      await leaveApi.create(payload);
      toast.success('Leave application submitted to the Class Teacher');
      setIsApplyOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Pending Leave Request
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) return;

    setCancellingId(leaveId);
    try {
      await leaveApi.cancel(leaveId, 'Cancelled by parent');
      toast.success('Leave request cancelled');
      if (selectedLeave?._id === leaveId) {
        setSelectedLeave(null);
      }
      fetchLeaves();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel leave request');
    } finally {
      setCancellingId(null);
    }
  };

  const selectedChild = children.find((c) => (c.id || c._id) === selectedChildId);

  // Statistics
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Student Leave Management"
        description="Apply for leave on behalf of your children and track Class Teacher approvals"
        action={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenApply}
            disabled={childrenLoading || children.length === 0}
          >
            Apply for Leave
          </Button>
        }
      />

      {/* Child Switcher Banner */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {selectedChild?.firstName?.[0] || 'C'}
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Selected Child
              </p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {selectedChild?.name || 'Select Child'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedChild?.class} • Section {selectedChild?.section} • Roll No: {selectedChild?.rollNo || '—'}
              </p>
            </div>
          </div>

          {/* Child Dropdown */}
          <div className="w-full sm:w-64">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Child
            </label>
            <Select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              disabled={childrenLoading || children.length === 0}
              options={children.map((c) => ({
                value: c.id || c._id,
                label: `${c.name} (${c.class} - ${c.section})`,
              }))}
              className="w-full bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Applications</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{leaves.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-amber-200 dark:border-amber-900/40">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending Review</p>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-emerald-200 dark:border-emerald-900/40">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Approved</p>
            <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{approvedCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-rose-200 dark:border-rose-900/40">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Rejected</p>
            <p className="text-xl font-bold text-rose-900 dark:text-rose-100">{rejectedCount}</p>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Requests' : statusLabels[tab] || tab}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLeaves}
          icon={<RefreshCw size={14} className={leavesLoading ? 'animate-spin' : ''} />}
        >
          Refresh
        </Button>
      </div>

      {/* Leaves List / Cards */}
      {leavesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      ) : leaves.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Calendar size={32} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No leave applications found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {statusFilter !== 'all'
                ? `There are no ${statusFilter} leave requests for ${selectedChild?.name || 'this child'}.`
                : `You have not submitted any leave applications for ${selectedChild?.name || 'this child'} yet.`}
            </p>
          </div>
          {statusFilter === 'all' && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenApply}>
              Apply for Leave
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => {
            const days = calculateDays(leave.startDate, leave.endDate);
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';
            const isRejected = leave.status === 'rejected';

            return (
              <Card
                key={leave._id}
                className="p-5 hover:shadow-md transition-shadow border-border"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {leaveTypeLabels[leave.type] || leave.type}
                      </span>
                      <Badge variant={statusColors[leave.status] || 'gray'}>
                        {statusLabels[leave.status] || leave.status}
                      </Badge>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {days} {days === 1 ? 'Day' : 'Days'}
                      </span>
                    </div>

                    {/* Date range */}
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <Calendar size={15} className="text-emerald-600" />
                      <span>
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </span>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Reason:</span> {leave.reason}
                    </p>

                    {/* Reviewer / Approver Notes */}
                    {isApproved && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs space-y-1 text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Approved by {leave.approvedBy?.name || 'Class Teacher'}</span>
                          {leave.approvedAt && <span>on {formatDate(leave.approvedAt)}</span>}
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-400 pl-5">
                          Attendance is officially marked as "On Leave" for these dates.
                        </p>
                      </div>
                    )}

                    {isRejected && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs space-y-1 text-rose-800 dark:text-rose-300">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <XCircle size={14} className="text-rose-600" />
                          <span>Rejected by {leave.rejectedBy?.name || 'Class Teacher'}</span>
                          {leave.rejectedAt && <span>on {formatDate(leave.rejectedAt)}</span>}
                        </div>
                        {leave.rejectionReason && (
                          <p className="text-rose-700 dark:text-rose-400 pl-5">
                            <span className="font-bold">Reason:</span> {leave.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        <Clock size={13} />
                        <span>Awaiting review by Class Teacher ({leave.approverTeacher ? `${leave.approverTeacher.firstName} ${leave.approverTeacher.lastName}` : 'Assigned Teacher'})</span>
                      </div>
                    )}

                    {/* Document link if attached */}
                    {leave.document?.url && (
                      <div className="pt-1">
                        <a
                          href={leave.document.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline"
                        >
                          <Paperclip size={13} />
                          <span>Attachment: {leave.document.name || 'Medical / Leave Document'}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div className="flex sm:flex-col items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                    <span className="text-xs text-slate-400">
                      Applied on {formatDate(leave.createdAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLeave(leave)}
                      >
                        Details
                      </Button>

                      {isPending && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={cancellingId === leave._id}
                          onClick={() => handleCancelLeave(leave._id)}
                        >
                          {cancellingId === leave._id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- APPLY FOR LEAVE MODAL --- */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Apply for Student Leave"
        subtitle="This request will be routed directly to your child's Class Teacher for approval"
        size="lg"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4">
          {/* Child Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Child <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
              options={[
                { value: '', label: 'Select Child', disabled: true },
                ...children.map((c) => ({
                  value: c.id || c._id,
                  label: `${c.name} — Class ${c.class} (Section ${c.section})`,
                })),
              ]}
              className="w-full"
            />
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              options={leaveTypeOptions}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duration info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Total Duration:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {calculateDays(formData.startDate, formData.endDate)} Day(s)
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="Provide reason for leave (e.g. Medical illness, family function, travel)..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          {/* Document Attachment URL (Optional) */}
          <div className="space-y-2 border-t border-border pt-3">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Document Attachment (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Document name (e.g. Doctor Certificate)"
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
              />
              <Input
                placeholder="Attachment link / URL"
                value={formData.documentUrl}
                onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsApplyOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- LEAVE DETAILS MODAL --- */}
      {selectedLeave && (
        <Modal
          isOpen={Boolean(selectedLeave)}
          onClose={() => setSelectedLeave(null)}
          title="Leave Request Details"
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="font-semibold text-slate-500">Status</span>
              <Badge variant={statusColors[selectedLeave.status] || 'gray'}>
                {statusLabels[selectedLeave.status] || selectedLeave.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border">
              <div>
                <span className="text-xs text-slate-400 block">Child</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedLeave.student?.firstName} {selectedLeave.student?.lastName}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Class & Section</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedLeave.student?.currentClass?.name || 'Class'} • {selectedLeave.student?.currentSection?.name || 'Section'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border">
              <div>
                <span className="text-xs text-slate-400 block">Leave Type</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {leaveTypeLabels[selectedLeave.type] || selectedLeave.type}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Duration</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {calculateDays(selectedLeave.startDate, selectedLeave.endDate)} Days
                </span>
              </div>
            </div>

            <div className="pb-2 border-b border-border">
              <span className="text-xs text-slate-400 block">Date Range</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatDate(selectedLeave.startDate)} – {formatDate(selectedLeave.endDate)}
              </span>
            </div>

            <div className="pb-2 border-b border-border">
              <span className="text-xs text-slate-400 block">Reason</span>
              <p className="text-slate-700 dark:text-slate-300 mt-1">
                {selectedLeave.reason}
              </p>
            </div>

            {selectedLeave.rejectionReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-800 dark:text-rose-300">
                <span className="font-bold block text-xs uppercase tracking-wider">Rejection Reason:</span>
                <p className="mt-1">{selectedLeave.rejectionReason}</p>
              </div>
            )}

            {selectedLeave.auditTrail && selectedLeave.auditTrail.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  History Log
                </span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedLeave.auditTrail.map((log, idx) => (
                    <div key={idx} className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                        {log.notes && <p className="text-slate-500">{log.notes}</p>}
                      </div>
                      <span className="text-slate-400 whitespace-nowrap pl-2">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setSelectedLeave(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
