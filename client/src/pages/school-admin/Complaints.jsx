import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Plus, MessageSquare, Eye } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { complaintApi } from '../../api/complaint.api';
import { useUserStore } from '../../store/userStore';

const statusColors = {
  open: 'danger',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'gray',
};

export default function Complaints() {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === 'school_admin' || user?.role === 'teacher';

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Admin process modal
  const [processing, setProcessing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: '', resolution: '' });

  // Parent/Student create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    description: '',
    type: user?.role === 'parent' ? 'parent' : 'student',
    isAnonymous: false,
  });

  // View details modal
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await complaintApi.getAll({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load complaints');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const openProcess = (complaint) => {
    setProcessing(complaint);
    setForm({ status: complaint.status, resolution: complaint.resolution || '' });
  };

  const handleProcess = async () => {
    setSaving(true);
    try {
      await complaintApi.process(processing._id, {
        status: form.status,
        resolution: form.resolution || undefined,
      });
      toast.success('Complaint updated');
      setProcessing(null);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to update complaint');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    setCreateSaving(true);
    try {
      await complaintApi.create({
        subject: createForm.subject.trim(),
        description: createForm.description.trim(),
        type: user?.role === 'parent' ? 'parent' : 'student',
        isAnonymous: createForm.isAnonymous,
      });
      toast.success('Complaint / Feedback submitted successfully');
      setCreateOpen(false);
      setCreateForm({
        subject: '',
        description: '',
        type: user?.role === 'parent' ? 'parent' : 'student',
        isAnonymous: false,
      });
      setLoading(true);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to submit complaint');
    } finally {
      setCreateSaving(false);
    }
  };

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-deep block">{r.subject}</span>
          <span className="text-xs text-muted line-clamp-1">{r.description}</span>
        </div>
      ),
    },
    {
      key: 'complainant',
      label: 'Complainant',
      render: (r) => (
        r.isAnonymous ? (
          <Badge color="gray">Anonymous</Badge>
        ) : (
          <span className="text-xs font-medium text-slate-700">
            {r.complainantName || r.complainant?.name || (user?.role === 'parent' || user?.role === 'student' ? 'You' : '—')}
          </span>
        )
      ),
    },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize text-xs">{r.type}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status.replace('_', ' ')}</Badge> },
    { key: 'createdAt', label: 'Submitted', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewing(r)} title="View details">
            <Eye size={15} className="mr-1" /> View
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => openProcess(r)}>
              <CheckCircle2 size={15} className="mr-1" /> Process
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints & Feedback"
        description={isAdmin ? "Review and resolve feedback and complaints" : "Track and submit your inquiries, complaints, and suggestions"}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-2" /> New Complaint
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={(p) => { setLoading(true); setPage(p); }}
        onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
        searchPlaceholder="Search complaints..."
      />

      {/* ── Create Complaint Modal ── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Submit New Complaint / Feedback">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subject *"
            value={createForm.subject}
            onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. Bus transport delay or classroom issue"
            required
          />

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-transparent min-h-28 text-sm"
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe your issue or feedback in detail..."
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.isAnonymous}
              onChange={(e) => setCreateForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
              className="w-4 h-4 accent-forest"
            />
            Submit anonymously (school admin will not see your name)
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createSaving}>Submit Complaint</Button>
          </div>
        </form>
      </Modal>

      {/* ── View Complaint Modal ── */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing?.subject || 'Complaint Details'}>
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Description</span>
            <p className="text-sm text-deep mt-1 bg-slate-50 p-3 rounded-lg border border-border/80">
              {viewing?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted">Status:</span>
              <div className="mt-0.5">
                <Badge color={statusColors[viewing?.status] || 'gray'}>{viewing?.status?.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div>
              <span className="text-muted">Submitted Date:</span>
              <p className="font-semibold text-deep mt-0.5">{viewing ? new Date(viewing.createdAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          {viewing?.resolution && (
            <div className="pt-2 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Official Resolution</span>
              <p className="text-xs text-emerald-900 mt-1 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                {viewing.resolution}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewing(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* ── Admin Process Modal ── */}
      <Modal isOpen={!!processing} onClose={() => setProcessing(null)} title={`Process Complaint — ${processing?.subject || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-muted">{processing?.description}</p>
          <Select
            label="Status"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Resolution notes</label>
            <textarea
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-transparent min-h-24 text-sm"
              value={form.resolution}
              onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
              placeholder="How was this resolved?"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setProcessing(null)}>Cancel</Button>
          <Button onClick={handleProcess} loading={saving}>Update Complaint</Button>
        </div>
      </Modal>
    </div>
  );
}
