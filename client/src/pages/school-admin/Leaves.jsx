import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { leaveApi } from '../../api/leave.api';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'gray',
};

const typeLabels = {
  sick: 'Sick',
  personal: 'Personal',
  emergency: 'Emergency',
  vacation: 'Vacation',
  other: 'Other',
};

export default function Leaves() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [processing, setProcessing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await leaveApi.getAll({ page, limit: 10 });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load leave requests');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const handleApprove = async (leave) => {
    setProcessing(leave._id);
    try {
      await leaveApi.process(leave._id, { status: 'approved' });
      toast.success('Leave approved');
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to approve leave');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await leaveApi.process(rejectOpen._id, { status: 'rejected', rejectionReason: rejectionReason || undefined });
      toast.success('Leave rejected');
      setRejectOpen(null);
      setRejectionReason('');
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to reject leave');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'requester', label: 'Requester', render: (r) => <span className="font-medium text-gray-200">{r.requester?.name || r.requester || '—'}</span> },
    { key: 'requesterModel', label: 'Type', render: (r) => <Badge color="info">{r.requesterModel}</Badge> },
    { key: 'type', label: 'Leave Type', render: (r) => typeLabels[r.type] || r.type },
    { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End', render: (r) => new Date(r.endDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleApprove(r)}
              disabled={processing === r._id}
              className="p-2 text-gray-400 hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors disabled:opacity-50"
              title="Approve"
            >
              <Check size={16} />
            </button>
            <button onClick={() => setRejectOpen(r)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Reject">
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management" description="Review and process student and teacher leave requests" />

      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search leave requests..." />

      <Modal isOpen={!!rejectOpen} onClose={() => setRejectOpen(null)} title={`Reject Leave — ${rejectOpen?.requester?.name || ''}`}>
        <Input
          label="Rejection reason"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Reason for rejection"
        />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setRejectOpen(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleReject} loading={saving}>Reject Leave</Button>
        </div>
      </Modal>
    </div>
  );
}
