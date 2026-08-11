import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { admissionApi } from '../../api/admission.api';
import { academicApi } from '../../api/academic.api';

const emptyForm = {
 applicantName: '',
 dateOfBirth: '',
 gender: 'male',
 applyingForClass: '',
 parentName: '',
 parentPhone: '',
 parentEmail: '',
 address: '',
};

const statusColors = {
 submitted: 'gray',
 document_upload: 'info',
 verification: 'warning',
 approved: 'success',
 rejected: 'danger',
 fee_paid: 'primary',
 enrolled: 'success',
};

export default function Admissions() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);
 const [classes, setClasses] = useState([]);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState(emptyForm);
 const [updating, setUpdating] = useState(null);
 const [statusSaving, setStatusSaving] = useState(false);
 const [statusForm, setStatusForm] = useState({ workflowStatus: '', remarks: '' });

 useEffect(() => {
 academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await admissionApi.getAll({ page, limit: 10, search: search || undefined });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load admissions');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

 const resetAndClose = () => { setForm(emptyForm); setOpen(false); };

 const handleCreate = async () => {
 if (!form.applicantName || !form.dateOfBirth || !form.parentPhone) {
 toast.error('Please fill all required fields');
 return;
 }
 setSaving(true);
 try {
 await admissionApi.create({
 applicantName: form.applicantName,
 dateOfBirth: form.dateOfBirth,
 gender: form.gender,
 applyingForClass: form.applyingForClass || undefined,
 parentName: form.parentName || undefined,
 parentPhone: form.parentPhone,
 parentEmail: form.parentEmail || undefined,
 address: form.address || undefined,
 });
 toast.success('Admission application created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create admission');
 } finally {
 setSaving(false);
 }
 };

 const openStatusModal = (admission) => {
 setUpdating(admission);
 setStatusForm({ workflowStatus: admission.workflowStatus, remarks: admission.remarks || '' });
 };

 const handleStatusUpdate = async () => {
 setStatusSaving(true);
 try {
 await admissionApi.updateStatus(updating._id, statusForm);
 toast.success('Admission status updated');
 setUpdating(null);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to update admission status');
 } finally {
 setStatusSaving(false);
 }
 };

 const columns = [
 { key: 'applicationNo', label: 'Application No', sortable: true },
 { key: 'applicantName', label: 'Applicant', render: (r) => <span className="font-medium text-deep">{r.applicantName}</span> },
 { key: 'gender', label: 'Gender', render: (r) => <span className="capitalize">{r.gender}</span> },
 { key: 'applyingForClass', label: 'Applying For', render: (r) => classMap[r.applyingForClass] || '—' },
 { key: 'parentPhone', label: 'Parent Phone', render: (r) => r.parentPhone || '—' },
 { key: 'workflowStatus', label: 'Status', render: (r) => <Badge color={statusColors[r.workflowStatus] || 'gray'}>{r.workflowStatus.replace('_', ' ')}</Badge> },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <Button variant="ghost"size="sm"onClick={() => openStatusModal(r)}>Update Status</Button>
 ),
 },
 ];

 const workflowOptions = [
 { value: 'submitted', label: 'Submitted' },
 { value: 'document_upload', label: 'Document Upload' },
 { value: 'verification', label: 'Verification' },
 { value: 'approved', label: 'Approved' },
 { value: 'rejected', label: 'Rejected' },
 { value: 'fee_paid', label: 'Fee Paid' },
 { value: 'enrolled', label: 'Enrolled' },
 ];

 return (
 <div className="space-y-6">
 <PageHeader
 title="Admissions"
 description="Track admission applications through the enrollment workflow"
 action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>New Application</Button>}
 />

 <DataTable
 columns={columns}
 data={data}
 loading={loading}
 meta={meta}
 onPageChange={(p) => { setLoading(true); setPage(p); }}
 onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
 searchPlaceholder="Search by applicant or application no..."
 />

 <Modal isOpen={open} onClose={resetAndClose} title="New Admission Application"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="Applicant name *"value={form.applicantName} onChange={(e) => setField('applicantName', e.target.value)} placeholder="Student name"/>
 <Input label="Date of birth *"type="date"value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
 <Select
 label="Gender *"
 options={[
 { value: 'male', label: 'Male' },
 { value: 'female', label: 'Female' },
 { value: 'other', label: 'Other' },
 ]}
 value={form.gender}
 onChange={(e) => setField('gender', e.target.value)}
 />
 <Select
 label="Applying for class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={form.applyingForClass}
 onChange={(e) => setField('applyingForClass', e.target.value)}
 />
 <Input label="Parent name"value={form.parentName} onChange={(e) => setField('parentName', e.target.value)} placeholder="Guardian name"/>
 <Input label="Parent phone *"value={form.parentPhone} onChange={(e) => setField('parentPhone', e.target.value)} placeholder="+91 90000 00000"/>
 <Input label="Parent email"type="email"value={form.parentEmail} onChange={(e) => setField('parentEmail', e.target.value)} placeholder="parent@email.com"/>
 <Input label="Address"value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Home address"/>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving}>Create Application</Button>
 </div>
 </Modal>

 <Modal isOpen={!!updating} onClose={() => setUpdating(null)} title={`Update Status — ${updating?.applicantName || ''}`}>
 <Select
 label="Workflow status"
 options={workflowOptions}
 value={statusForm.workflowStatus}
 onChange={(e) => setStatusForm((f) => ({ ...f, workflowStatus: e.target.value }))}
 />
 <div className="mt-4">
 <Input label="Remarks"value={statusForm.remarks} onChange={(e) => setStatusForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Optional note"/>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={() => setUpdating(null)}>Cancel</Button>
 <Button onClick={handleStatusUpdate} loading={statusSaving}>Save Status</Button>
 </div>
 </Modal>
 </div>
 );
}
