import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Send, Trophy, ClipboardCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { examApi } from '../../api/exam.api';
import { academicApi } from '../../api/academic.api';

const statusColors = {
 upcoming: 'info',
 ongoing: 'warning',
 completed: 'gray',
 published: 'success',
};

export default function Exams() {
 const navigate = useNavigate();
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);
 const [classes, setClasses] = useState([]);
 const [years, setYears] = useState([]);
 const [subjects, setSubjects] = useState([]);

 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({
 name: '', type: 'unit_test', academicYear: '', schoolClass: '',
 startDate: '', endDate: '',
 subjectRows: [{ subject: '', maxMarks: 100, passMarks: 33 }],
 });

 const [marksFor, setMarksFor] = useState(null);
 const [marks, setMarks] = useState([]);
 const [marksLoading, setMarksLoading] = useState(false);

 useEffect(() => {
 academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
 academicApi.getAcademicYears({ limit: 100 }).then((res) => setYears(res.data)).catch(() => {});
 academicApi.getSubjects({ limit: 100 }).then((res) => setSubjects(res.data)).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await examApi.getAll({ page, limit: 10, search: search || undefined });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load exams');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

 const updateRow = (index, key, value) => {
 setForm((f) => {
 const rows = [...f.subjectRows];
 rows[index] = { ...rows[index], [key]: value };
 return { ...f, subjectRows: rows };
 });
 };

 const addRow = () => setForm((f) => ({ ...f, subjectRows: [...f.subjectRows, { subject: '', maxMarks: 100, passMarks: 33 }] }));
 const removeRow = (index) => setForm((f) => ({ ...f, subjectRows: f.subjectRows.filter((_, i) => i !== index) }));

 const resetAndClose = () => {
 setForm({ name: '', type: 'unit_test', academicYear: '', schoolClass: '', startDate: '', endDate: '', subjectRows: [{ subject: '', maxMarks: 100, passMarks: 33 }] });
 setOpen(false);
 };

 const handleCreate = async () => {
 if (!form.name || !form.academicYear || !form.schoolClass || !form.startDate || !form.endDate) {
 toast.error('Please fill all required fields');
 return;
 }
 const subjectRows = form.subjectRows.filter((r) => r.subject);
 if (subjectRows.length === 0) {
 toast.error('Add at least one subject to the exam');
 return;
 }
 setSaving(true);
 try {
 await examApi.create({
 name: form.name,
 type: form.type,
 academicYear: form.academicYear,
 schoolClass: form.schoolClass,
 startDate: form.startDate,
 endDate: form.endDate,
 subjects: subjectRows.map((r) => ({
 subject: r.subject,
 maxMarks: Number(r.maxMarks) || 100,
 passMarks: Number(r.passMarks) || 33,
 })),
 });
 toast.success('Exam created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create exam');
 } finally {
 setSaving(false);
 }
 };

 const handlePublish = async (exam) => {
 try {
 await examApi.publishResults(exam._id);
 toast.success('Results published');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to publish results');
 }
 };

 const handleDelete = (exam) => {
 Swal.fire({
 title: 'Delete exam?',
 text: `${exam.name} and its marks will be permanently removed.`,
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await examApi.delete(exam._id);
 toast.success('Exam deleted');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete exam');
 }
 });
 };

 const openMarks = async (exam) => {
 setMarksFor(exam);
 setMarks([]);
 setMarksLoading(true);
 try {
 const res = await examApi.getMarksByExam(exam._id);
 setMarks(res.data);
 } catch (e) {
 toast.error(e?.message || 'Failed to load marks');
 } finally {
 setMarksLoading(false);
 }
 };

 const columns = [
 { key: 'name', label: 'Exam', sortable: true, render: (r) => <span className="font-medium text-deep">{r.name}</span> },
 { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type.replace('_', ' ')}</span> },
 { key: 'schoolClass', label: 'Class', render: (r) => classMap[r.schoolClass] || '—' },
 { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
 { key: 'endDate', label: 'End', render: (r) => new Date(r.endDate).toLocaleDateString() },
 { key: 'status', label: 'Status', render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge> },
 {
  key: 'actions',
  label: '',
  render: (r) => (
  <div className="flex items-center gap-1">
  <button onClick={() => navigate(`/marks-entry?examId=${r._id}`)} className="p-2 text-muted hover:text-forest rounded-lg hover:bg-sage-soft transition-colors" title="Marks Entry">
  <ClipboardCheck size={16} />
  </button>
  <button onClick={() => openMarks(r)} className="p-2 text-muted hover:text-forest rounded-lg hover:bg-sage-soft transition-colors" title="View marks summary">
  <Trophy size={16} />
  </button>
  {r.status !== 'published' && (
  <button onClick={() => handlePublish(r)} className="p-2 text-muted hover:text-success rounded-lg hover:bg-success-light transition-colors" title="Publish results">
  <Send size={16} />
  </button>
  )}
  <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors" title="Delete">
  <Trash2 size={16} />
  </button>
  </div>
  ),
  },
  ];

 const subjectOptions = subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` }));

 return (
 <div className="space-y-6">
 <PageHeader
 title="Examinations"
 description="Create exams, manage schedules, and publish results"
 action={
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => navigate('/marks-entry')}>
        <ClipboardCheck size={16} className="mr-2" />Marks Entry
      </Button>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-2" />Create Exam
      </Button>
    </div>
  }
 />

 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search exams..."/>

 <Modal isOpen={open} onClose={resetAndClose} title="Create Exam"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="Exam name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Midterm 2026"/>
 <Select
 label="Type"
 options={[
 { value: 'midterm', label: 'Midterm' },
 { value: 'final', label: 'Final' },
 { value: 'quarterly', label: 'Quarterly' },
 { value: 'half_yearly', label: 'Half Yearly' },
 { value: 'weekly', label: 'Weekly' },
 { value: 'unit_test', label: 'Unit Test' },
 ]}
 value={form.type}
 onChange={(e) => setField('type', e.target.value)}
 />
 <Select
 label="Academic year *"
 placeholder="Select Academic Year"
 options={years.map((y) => ({ value: y._id, label: y.name }))}
 value={form.academicYear}
 onChange={(e) => setField('academicYear', e.target.value)}
 />
 <Select
 label="Class *"
 placeholder="Select Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={form.schoolClass}
 onChange={(e) => setField('schoolClass', e.target.value)}
 />
 <Input label="Start date *"type="date"value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
 <Input label="End date *"type="date"value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
 </div>

 <div className="mt-6">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-medium text-secondary">Subjects *</h3>
 <Button variant="outline"size="sm"onClick={addRow}><Plus size={14} className="mr-1"/>Add Subject</Button>
 </div>
 <div className="space-y-3">
 {form.subjectRows.map((row, index) => (
 <div key={index} className="flex items-end gap-2">
 <div className="flex-1">
 <Select
 label={index === 0 ? 'Subject' : undefined}
 placeholder="Select Subject"
 options={subjectOptions}
 value={row.subject}
 onChange={(e) => updateRow(index, 'subject', e.target.value)}
 />
 </div>
 <div className="w-24">
 <Input label={index === 0 ? 'Max' : undefined} type="number"value={row.maxMarks} onChange={(e) => updateRow(index, 'maxMarks', e.target.value)} />
 </div>
 <div className="w-24">
 <Input label={index === 0 ? 'Pass' : undefined} type="number"value={row.passMarks} onChange={(e) => updateRow(index, 'passMarks', e.target.value)} />
 </div>
 <button onClick={() => removeRow(index)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors">
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving}>Create Exam</Button>
 </div>
 </Modal>

 <Modal isOpen={!!marksFor} onClose={() => setMarksFor(null)} title={`Marks — ${marksFor?.name || ''}`} size="lg">
 {marksLoading ? (
 <div className="h-32 flex items-center justify-center text-muted">Loading marks...</div>
 ) : marks.length === 0 ? (
 <p className="text-center text-muted py-8">No marks have been entered for this exam yet.</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Student</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Subject</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Marks</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Grade</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {marks.map((m) => (
 <tr key={m._id}>
 <td className="px-3 py-2 text-deep">{m.student?.firstName} {m.student?.lastName}</td>
 <td className="px-3 py-2 text-secondary">{m.subject?.name}</td>
 <td className="px-3 py-2 text-secondary">{m.marksObtained} / {m.maxMarks}</td>
 <td className="px-3 py-2"><Badge color={m.grade === 'F' ? 'danger' : 'success'}>{m.grade}</Badge></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </Modal>
 </div>
 );
}
