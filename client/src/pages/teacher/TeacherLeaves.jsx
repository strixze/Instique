import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter,
  User, BookOpen, MapPin, RefreshCw, X, ShieldAlert, ArrowRight, ClipboardList,
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
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'substitutions'

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

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchSubstitutions();
  }, [fetchSubstitutions]);

  // Submit Leave Request
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

  // Cancel Pending Leave
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Pending</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Approved</p>
            <p className="text-xl font-bold text-deep dark:text-dark-text">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-muted dark:text-dark-text-muted font-medium uppercase">Rejected</p>
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
