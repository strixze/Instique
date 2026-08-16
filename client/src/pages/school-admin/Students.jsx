import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Upload, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { studentApi } from '../../api/student.api';
import { academicApi } from '../../api/academic.api';
import { feeApi } from '../../api/fee.api';
import BulkImportModal from '../../components/ui/BulkImportModal';

const emptyForm = {
 firstName: '',
 lastName: '',
 admissionNo: '',
 gender: 'male',
 dateOfBirth: '',
 currentClass: '',
 currentSection: '',
 phone: '',
 email: '',
 feeStructure: '',
};

export default function Students() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [sort, setSort] = useState('-createdAt');
 const [reload, setReload] = useState(0);
 const [classes, setClasses] = useState([]);
 const [sections, setSections] = useState([]);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState(emptyForm);
 const [bulkOpen, setBulkOpen] = useState(false);
 const [feeStructures, setFeeStructures] = useState([]);

 useEffect(() => {
 academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
 academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
 feeApi.getStructures({ limit: 100 }).then((res) => setFeeStructures(res.data)).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await studentApi.getAll({ page, limit: 10, search: search || undefined, sort });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load students');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload, sort]);

 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
 const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));

 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

 const resetAndClose = () => { setForm(emptyForm); setOpen(false); };

 const handleCreate = async () => {
 if (!form.firstName || !form.lastName || !form.admissionNo || !form.dateOfBirth) {
 toast.error('Please fill all required fields');
 return;
 }
 setSaving(true);
 try {
 await studentApi.create({
 firstName: form.firstName,
 lastName: form.lastName,
 admissionNo: form.admissionNo,
 gender: form.gender,
 dateOfBirth: form.dateOfBirth,
 currentClass: form.currentClass || undefined,
 currentSection: form.currentSection || undefined,
 contact: { phone: form.phone || undefined, email: form.email || undefined },
 feeStructure: form.feeStructure || undefined,
 });
 toast.success('Student created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create student');
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = (student) => {
 Swal.fire({
 title: 'Delete student?',
 text: `${student.firstName} ${student.lastName} will be permanently removed.`,
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await studentApi.delete(student._id);
 toast.success('Student deleted');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete student');
 }
 });
 };

 const columns = [
 { key: 'admissionNo', label: 'Admission No', sortable: true },
 { key: 'firstName', label: 'Name', sortable: true, render: (r) => <span className="font-medium text-deep">{r.firstName} {r.lastName}</span> },
 { key: 'gender', label: 'Gender', sortable: true, render: (r) => <span className="capitalize">{r.gender}</span> },
 { key: 'currentClass', label: 'Class', sortable: true, render: (r) => classMap[r.currentClass] || '—' },
 { key: 'currentSection', label: 'Section', sortable: true, render: (r) => sectionMap[r.currentSection] || '—' },
 { key: 'status', label: 'Status', sortable: true, render: (r) => <Badge color={r.status === 'active' ? 'success' : 'gray'}>{r.status}</Badge> },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <button
 onClick={() => handleDelete(r)}
 className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"
 title="Delete student"
 >
 <Trash2 size={16} />
 </button>
 ),
 },
 ];

 const classOptions = classes.map((c) => ({ value: c._id, label: c.name }));
 const sectionOptions = sections
 .filter((s) => !form.currentClass || s.schoolClass === form.currentClass)
 .map((s) => ({ value: s._id, label: s.name }));

 return (
 <div className="space-y-6">
 <PageHeader
 title="Students"
 description="Manage student records and information"
 action={
 <div className="flex items-center gap-2">
 <Button variant="outline"onClick={() => setBulkOpen(true)}><Upload size={16} className="mr-2"/>Bulk Import</Button>
 <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Add Student</Button>
 </div>
 }
 />

 <DataTable
 columns={columns}
 data={data}
 loading={loading}
 meta={meta}
 onPageChange={(p) => { setLoading(true); setPage(p); }}
 onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }}
 onSort={(field, order) => { setSort(`${order === 'desc' ? '-' : ''}${field}`); setPage(1); setLoading(true); }}
 searchPlaceholder="Search by name or admission no..."
 />

 <Modal isOpen={open} onClose={resetAndClose} title="Add Student"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="First name *"value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="John"/>
 <Input label="Last name *"value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Doe"/>
 <Input label="Admission no *"value={form.admissionNo} onChange={(e) => setField('admissionNo', e.target.value)} placeholder="ADM-2026-001"/>
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
 <Input label="Date of birth *"type="date"value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
 <Select
 label="Class"
 options={classOptions}
 value={form.currentClass}
 onChange={(e) => { setField('currentClass', e.target.value); setField('currentSection', ''); }}
 />
 <Select
 label="Section"
 options={sectionOptions}
 value={form.currentSection}
 onChange={(e) => setField('currentSection', e.target.value)}
 />
 <Input label="Phone"value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 90000 00000"/>
 <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="student@school.edu"/>
 <Select
 label="Fee Structure"
 options={[{ value: '', label: 'None' }, ...feeStructures.map(f => ({ value: f._id, label: `${f.name} — ₹${f.totalAmount?.toLocaleString('en-IN') || 0}` }))]}
 value={form.feeStructure}
 onChange={(e) => setField('feeStructure', e.target.value)}
 />
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving}>Create Student</Button>
 </div>
 </Modal>

 <BulkImportModal
 isOpen={bulkOpen}
 onClose={() => setBulkOpen(false)}
 entityType="students"
 onSuccess={() => { setLoading(true); setReload((r) => r + 1); }}
 />
 </div>
 );
}
