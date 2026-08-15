import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { complaintApi } from '../../api/complaint.api';

const statusColors = {
 open: 'danger',
 in_progress: 'warning',
 resolved: 'success',
 closed: 'gray',
};

export default function Complaints() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
<<<<<<< HEAD
 const [sort, setSort] = useState('-createdAt');
=======
>>>>>>> ad3272f98243adbe43ffe771357689a90b09f452
 const [reload, setReload] = useState(0);
 const [processing, setProcessing] = useState(null);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ status: '', resolution: '' });

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
<<<<<<< HEAD
 const res = await complaintApi.getAll({ page, limit: 10, search: search || undefined, sort });
=======
 const res = await complaintApi.getAll({ page, limit: 10, search: search || undefined });
>>>>>>> ad3272f98243adbe43ffe771357689a90b09f452
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load complaints');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
<<<<<<< HEAD
 }, [page, search, reload, sort]);
=======
 }, [page, search, reload]);
>>>>>>> ad3272f98243adbe43ffe771357689a90b09f452

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

 const columns = [
 { key: 'subject', label: 'Subject', sortable: true, render: (r) => <span className="font-medium text-deep">{r.subject}</span> },
 { key: 'complainant', label: 'Complainant', render: (r) => r.isAnonymous ? <Badge color="gray">Anonymous</Badge> : (r.complainantName || '—') },
<<<<<<< HEAD
 { key: 'type', label: 'Type', sortable: true, render: (r) => <span className="capitalize">{r.type}</span> },
 { key: 'status', label: 'Status', sortable: true, render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status.replace('_', ' ')}</Badge> },
 { key: 'createdAt', label: 'Submitted', sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
=======
 { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
 { key: 'status', label: 'Status', render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status.replace('_', ' ')}</Badge> },
 { key: 'createdAt', label: 'Submitted', render: (r) => new Date(r.createdAt).toLocaleDateString() },
>>>>>>> ad3272f98243adbe43ffe771357689a90b09f452
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <Button variant="ghost"size="sm"onClick={() => openProcess(r)}>
 <CheckCircle2 size={16} className="mr-1"/>Process
 </Button>
 ),
 },
 ];

 return (
 <div className="space-y-6">
 <PageHeader title="Complaints & Feedback"description="Review and resolve complaints from students and parents"/>

<<<<<<< HEAD
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} onSort={(field, order) => { setSort(`${order === 'desc' ? '-' : ''}${field}`); setPage(1); setLoading(true); }} searchPlaceholder="Search complaints..."/>
=======
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search complaints..."/>
>>>>>>> ad3272f98243adbe43ffe771357689a90b09f452

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
 className="w-full px-3 py-2 bg-white border border-border rounded-lg text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-transparent min-h-24"
 value={form.resolution}
 onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
 placeholder="How was this resolved?"
 />
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={() => setProcessing(null)}>Cancel</Button>
 <Button onClick={handleProcess} loading={saving}>Update Complaint</Button>
 </div>
 </Modal>
 </div>
 );
}
