import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Pin, Send } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { noticeApi } from '../../api/notice.api';

const categoryColors = {
  general: 'gray',
  academic: 'info',
  event: 'primary',
  emergency: 'danger',
  holiday: 'warning',
  circular: 'gray',
};

const emptyForm = { title: '', content: '', category: 'general', scope: 'school', isPinned: false };

export default function Notices() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await noticeApi.getAll({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load notices');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm(emptyForm); setOpen(false); };

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      await noticeApi.create({
        title: form.title,
        content: form.content,
        category: form.category,
        scope: form.scope,
        isPinned: form.isPinned,
      });
      toast.success('Notice created');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to create notice');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (notice) => {
    const next = notice.status === 'published' ? 'draft' : 'published';
    try {
      await noticeApi.update(notice._id, { status: next });
      toast.success(`Notice ${next}`);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to update notice');
    }
  };

  const handleDelete = (notice) => {
    Swal.fire({
      title: 'Delete notice?',
      text: `"${notice.title}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await noticeApi.delete(notice._id);
        toast.success('Notice deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete notice');
      }
    });
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.isPinned && <Pin size={14} className="text-yellow-400 shrink-0" />}
          <span className="font-medium text-gray-200">{r.title}</span>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (r) => <Badge color={categoryColors[r.category] || 'gray'}>{r.category}</Badge> },
    { key: 'scope', label: 'Scope', render: (r) => <span className="capitalize">{r.scope}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'published' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'createdAt', label: 'Created', render: (r) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handlePublish(r)} className="p-2 text-gray-400 hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors" title={r.status === 'published' ? 'Unpublish' : 'Publish'}>
            <Send size={16} />
          </button>
          <button onClick={() => handleDelete(r)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Board"
        description="Create and manage school notices"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />New Notice</Button>}
      />

      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search notices..." />

      <Modal isOpen={open} onClose={resetAndClose} title="New Notice" size="lg">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="School holiday announcement" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={[
                { value: 'general', label: 'General' },
                { value: 'academic', label: 'Academic' },
                { value: 'event', label: 'Event' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'holiday', label: 'Holiday' },
                { value: 'circular', label: 'Circular' },
              ]}
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            />
            <Select
              label="Scope"
              options={[
                { value: 'school', label: 'School' },
                { value: 'class', label: 'Class' },
                { value: 'teacher', label: 'Teachers' },
                { value: 'student', label: 'Students' },
              ]}
              value={form.scope}
              onChange={(e) => setField('scope', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content *</label>
            <textarea
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-28"
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              placeholder="Notice content..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.isPinned} onChange={(e) => setField('isPinned', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            Pin this notice
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Notice</Button>
        </div>
      </Modal>
    </div>
  );
}
