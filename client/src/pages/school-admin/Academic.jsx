import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit2, Upload } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { academicApi } from '../../api/academic.api';
import { teacherApi } from '../../api/teacher.api';
import BulkImportModal from '../../components/ui/BulkImportModal';

function AcademicYears() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await academicApi.getAcademicYears({ page, limit: 10, search: search || undefined });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load academic years');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
 const resetAndClose = () => { setForm({ name: '', startDate: '', endDate: '', isCurrent: false }); setOpen(false); };

 const handleCreate = async () => {
 if (!form.name || !form.startDate || !form.endDate) { toast.error('Please fill all required fields'); return; }
 setSaving(true);
 try {
 await academicApi.createAcademicYear({ ...form, isCurrent: form.isCurrent });
 toast.success('Academic year created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create academic year');
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = (row) => {
 Swal.fire({
 title: 'Delete academic year?',
 text: `${row.name} will be permanently removed.`,
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await academicApi.deleteAcademicYear(row._id);
 toast.success('Academic year deleted');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete academic year');
 }
 });
 };

 const columns = [
 { key: 'name', label: 'Name', sortable: true, render: (r) => <span className="font-medium text-deep">{r.name}</span> },
 { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
 { key: 'endDate', label: 'End', render: (r) => new Date(r.endDate).toLocaleDateString() },
 { key: 'isCurrent', label: 'Status', render: (r) => r.isCurrent ? <Badge color="success">Current</Badge> : <Badge color="gray">Previous</Badge> },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"title="Delete">
 <Trash2 size={16} />
 </button>
 ),
 },
 ];

 return (
 <>
 <PageHeader
 title="Academic Structure"
 description="Manage academic years, classes, sections, and subjects"
 action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Add Academic Year</Button>}
 />
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search academic years..."/>
 <Modal isOpen={open} onClose={resetAndClose} title="Add Academic Year">
 <div className="space-y-4">
 <Input label="Name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="2026-2027"/>
 <Input label="Start date *"type="date"value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
 <Input label="End date *"type="date"value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
 <label className="flex items-center gap-2 text-sm text-secondary">
 <input type="checkbox"checked={form.isCurrent} onChange={(e) => setField('isCurrent', e.target.checked)} className="w-4 h-4 accent-forest"/>
 Set as current academic year
 </label>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving}>Create</Button>
 </div>
 </Modal>
 </>
 );
}

function Classes() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);
 const [years, setYears] = useState([]);
 const [teachers, setTeachers] = useState([]);
 const [allSubjects, setAllSubjects] = useState([]);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [form, setForm] = useState({ name: '', academicYear: '', classTeacher: '', subjects: [] });
 const [bulkOpen, setBulkOpen] = useState(false);

 useEffect(() => {
 academicApi.getAcademicYears({ limit: 100 }).then((res) => {
 const fetchedYears = res.data || [];
 setYears(fetchedYears);
 if (fetchedYears.length > 0) {
 const defaultYear = fetchedYears.find((y) => y.isCurrent)?._id || fetchedYears[0]._id;
 setForm((f) => ({ ...f, academicYear: f.academicYear || defaultYear }));
 }
 }).catch(() => {});
 teacherApi.getAll({ limit: 100 }).then((res) => setTeachers(res.data || [])).catch(() => {});
 academicApi.getSubjects({ limit: 100 }).then((res) => setAllSubjects(res.data || [])).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await academicApi.getClasses({ page, limit: 10, search: search || undefined });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load classes');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));
 const teacherMap = Object.fromEntries(teachers.map((t) => [t._id, `${t.firstName} ${t.lastName}`]));
 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

 const toggleSubject = (subjectId) => {
 setForm((f) => {
 const current = f.subjects || [];
 if (current.includes(subjectId)) {
 return { ...f, subjects: current.filter(id => id !== subjectId) };
 } else {
 return { ...f, subjects: [...current, subjectId] };
 }
 });
 };

 const resetAndClose = () => {
 const defaultYear = years.find((y) => y.isCurrent)?._id || years[0]?._id || '';
 setForm({ name: '', academicYear: defaultYear, classTeacher: '', subjects: [] });
 setEditingId(null);
 setOpen(false);
 };

 const handleEdit = (row) => {
 setEditingId(row._id);
 setForm({
 name: row.name,
 academicYear: row.academicYear,
 classTeacher: row.classTeacher || '',
 subjects: Array.isArray(row.subjects) ? row.subjects.map(s => s._id || s) : [],
 });
 setOpen(true);
 };

 const handleSave = async () => {
 if (!form.name || !form.academicYear) { toast.error('Class name and academic year are required'); return; }
 setSaving(true);
 try {
 const payload = {
 name: form.name,
 academicYear: form.academicYear,
 classTeacher: form.classTeacher || undefined,
 subjects: form.subjects,
 };

 if (editingId) {
 await academicApi.updateClass(editingId, payload);
 toast.success('Class updated successfully');
 } else {
 await academicApi.createClass(payload);
 toast.success('Class created successfully');
 }
 resetAndClose();
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to save class');
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = (row) => {
 Swal.fire({
 title: 'Delete class?',
 text: `${row.name} and its sections will be permanently removed.`,
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await academicApi.deleteClass(row._id);
 toast.success('Class deleted');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete class');
 }
 });
 };

 const columns = [
 { key: 'name', label: 'Class', sortable: true, render: (r) => <span className="font-medium text-deep">{r.name}</span> },
 { key: 'academicYear', label: 'Academic Year', render: (r) => yearMap[r.academicYear] || '—' },
 { key: 'classTeacher', label: 'Class Teacher', render: (r) => teacherMap[r.classTeacher] || '—' },
 { key: 'sections', label: 'Sections', render: (r) => Array.isArray(r.sections) ? r.sections.length : '—' },
 { key: 'subjects', label: 'Subjects', render: (r) => Array.isArray(r.subjects) ? r.subjects.length : '—' },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <div className="flex items-center gap-1">
 <button onClick={() => handleEdit(r)} className="p-2 text-muted hover:text-forest rounded-lg hover:bg-sage-soft transition-colors"title="Edit">
 <Edit2 size={16} />
 </button>
 <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"title="Delete">
 <Trash2 size={16} />
 </button>
 </div>
 ),
 },
 ];

 return (
 <>
 <PageHeader
 title="Classes"
 description="Define classes and assign subjects for the current academic year"
 action={
 <div className="flex items-center gap-2">
 <Button variant="outline"size="sm"onClick={() => setBulkOpen(true)}><Upload size={14} className="mr-1.5"/>Bulk Import</Button>
 <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Add Class</Button>
 </div>
 }
 />
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search classes..."/>
 <Modal isOpen={open} onClose={resetAndClose} title={editingId ? 'Edit Class' : 'Add Class'} size="lg">
 <div className="space-y-4">
 {years.length === 0 && (
 <div className="p-3 text-sm rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
 No academic years found. Please create an Academic Year first in the Academic Years tab.
 </div>
 )}
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="Class name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Grade 8"/>
 <Select
 label="Academic year *"
 placeholder="Select Academic Year"
 options={years.map((y) => ({ value: y._id, label: y.name }))}
 value={form.academicYear}
 onChange={(e) => setField('academicYear', e.target.value)}
 />
 </div>

 <Select
 label="Class teacher"
 placeholder="Select Class Teacher (Optional)"
 options={teachers.map((t) => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))}
 value={form.classTeacher}
 onChange={(e) => setField('classTeacher', e.target.value)}
 />

 {/* Multi-Subject Selection */}
 <div className="mt-6">
 <label className="text-sm font-medium text-secondary mb-2 block">Assigned Subjects (select multiple)</label>
 {allSubjects.length === 0 ? (
 <p className="text-sm text-muted">No subjects found. Create subjects in the Subjects section first.</p>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-white/60 border border-border rounded-xl">
 {allSubjects.map((subject) => {
 const isSelected = form.subjects.includes(subject._id);
 return (
 <button
 key={subject._id}
 type="button"
 onClick={() => toggleSubject(subject._id)}
 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
 isSelected
 ? 'bg-sage border-forest text-forest'
 : 'bg-white border-border text-muted hover:border-border hover:text-secondary'
 }`}
 >
 <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
 isSelected ? 'bg-forest border-forest text-white' : 'border-border'
 }`}>
 {isSelected && '✓'}
 </span>
 {subject.name}
 </button>
 );
 })}
 </div>
 )}
 {form.subjects.length > 0 && (
 <p className="text-xs text-muted mt-1.5">{form.subjects.length} subject{form.subjects.length > 1 ? 's' : ''} selected</p>
 )}
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleSave} loading={saving} disabled={years.length === 0}>{editingId ? 'Update' : 'Create'}</Button>
 </div>
 </Modal>

 <BulkImportModal
 isOpen={bulkOpen}
 onClose={() => setBulkOpen(false)}
 entityType="classes"
 onSuccess={() => { setLoading(true); setReload((r) => r + 1); }}
 />
 </>
 );
}

function Sections() {
 const [data, setData] = useState([]);
 const [meta, setMeta] = useState(null);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [reload, setReload] = useState(0);
 const [classes, setClasses] = useState([]);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ name: '', schoolClass: '', roomNo: '', strength: '' });
 const [bulkOpen, setBulkOpen] = useState(false);

 useEffect(() => {
 academicApi.getClasses({ limit: 100 }).then((res) => {
 const fetchedClasses = res.data || [];
 setClasses(fetchedClasses);
 if (fetchedClasses.length > 0) {
 setForm((f) => ({ ...f, schoolClass: f.schoolClass || fetchedClasses[0]._id }));
 }
 }).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await academicApi.getSections({ page, limit: 10, search: search || undefined });
 if (!active) return;
 setData(res.data);
 setMeta(res.meta);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load sections');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, [page, search, reload]);

 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
 const resetAndClose = () => {
 const defaultClass = classes[0]?._id || '';
 setForm({ name: '', schoolClass: defaultClass, roomNo: '', strength: '' });
 setOpen(false);
 };

 const handleCreate = async () => {
 if (!form.name || !form.schoolClass) { toast.error('Section name and class are required'); return; }
 setSaving(true);
 try {
 await academicApi.createSection({ 
    name: form.name, 
    schoolClass: form.schoolClass, 
    roomNo: form.roomNo || undefined, 
    strength: form.strength ? Number(form.strength) : undefined 
 });
 toast.success('Section created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create section');
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = (row) => {
 Swal.fire({
 title: 'Delete section?',
 text: `Section ${row.name} will be permanently removed.`,
 icon: 'warning',
 showCancelButton: true,
 confirmButtonText: 'Delete',
 cancelButtonText: 'Cancel',
 confirmButtonColor: '#dc2626',
 }).then(async (result) => {
 if (!result.isConfirmed) return;
 try {
 await academicApi.deleteSection(row._id);
 toast.success('Section deleted');
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to delete section');
 }
 });
 };

 const columns = [
 { key: 'name', label: 'Section', sortable: true, render: (r) => <span className="font-medium text-deep">{r.name}</span> },
 { key: 'schoolClass', label: 'Class', render: (r) => classMap[r.schoolClass] || '—' },
 { key: 'roomNo', label: 'Room No', render: (r) => r.roomNo || '—' },
 { key: 'strength', label: 'Strength', render: (r) => r.strength ?? '—' },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"title="Delete">
 <Trash2 size={16} />
 </button>
 ),
 },
 ];

 return (
 <>
 <PageHeader
 title="Sections"
 description="Define sections within each class"
 action={
 <div className="flex items-center gap-2">
 <Button variant="outline"size="sm"onClick={() => setBulkOpen(true)}><Upload size={14} className="mr-1.5"/>Bulk Import</Button>
 <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Add Section</Button>
 </div>
 }
 />
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search sections..."/>
 <Modal isOpen={open} onClose={resetAndClose} title="Add Section">
 <div className="space-y-4">
 {classes.length === 0 && (
 <div className="p-3 text-sm rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
 No classes found. Please create a Class first in the Classes tab.
 </div>
 )}
 <Input label="Section name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="A"/>
 <Select
 label="Class *"
 placeholder="Select Class"
 options={classes.map((c) => ({ value: c._id, label: c.name }))}
 value={form.schoolClass}
 onChange={(e) => setField('schoolClass', e.target.value)}
 />
 <Input label="Room no"value={form.roomNo} onChange={(e) => setField('roomNo', e.target.value)} placeholder="201"/>
 <Input label="Strength / Capacity" type="number" value={form.strength} onChange={(e) => setField('strength', e.target.value)} placeholder="40"/>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving} disabled={classes.length === 0}>Create</Button>
 </div>
 </Modal>

 <BulkImportModal
 isOpen={bulkOpen}
 onClose={() => setBulkOpen(false)}
 entityType="sections"
 onSuccess={() => { setLoading(true); setReload((r) => r + 1); }}
 />
 </>
 );
}

function Subjects() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'core', maxMarks: 100, passMarks: 33 });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ field: 'maxMarks', value: '' });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await academicApi.getSubjects({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load subjects');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  
  const resetAndClose = () => { 
    setForm({ name: '', code: '', type: 'core', maxMarks: 100, passMarks: 33 }); 
    setEditingId(null);
    setOpen(false); 
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      name: row.name,
      code: row.code,
      type: row.type || 'core',
      maxMarks: row.maxMarks ?? 100,
      passMarks: row.passMarks ?? 33,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Subject name and code are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        maxMarks: Number(form.maxMarks) || 100,
        passMarks: Number(form.passMarks) || 33,
      };

      if (editingId) {
        await academicApi.updateSubject(editingId, payload);
        toast.success('Subject updated');
      } else {
        await academicApi.createSubject(payload);
        toast.success('Subject created');
      }
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkEdit = async () => {
    if (!bulkEditForm.value) {
      toast.error('Please enter a value for bulk update');
      return;
    }
    setSaving(true);
    try {
      await academicApi.bulkEditSubjects({
        field: bulkEditForm.field,
        value: bulkEditForm.value,
      });
      toast.success('Subjects updated successfully');
      setBulkEditOpen(false);
      setBulkEditForm({ field: 'maxMarks', value: '' });
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to bulk update subjects');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete subject?',
      text: `${row.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await academicApi.deleteSubject(row._id);
        toast.success('Subject deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete subject');
      }
    });
  };

  const columns = [
    { key: 'code', label: 'Code', sortable: true, render: (r) => <span className="font-medium text-deep">{r.code}</span> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', render: (r) => <Badge color={r.type === 'core' ? 'primary' : 'gray'}>{r.type}</Badge> },
    { key: 'maxMarks', label: 'Max Marks', render: (r) => r.maxMarks ?? '—' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(r)} className="p-2 text-muted hover:text-forest rounded-lg hover:bg-sage-soft transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subjects"
        description="Manage the subjects offered by the school"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}><Upload size={14} className="mr-1.5" />Bulk Import</Button>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}><Edit2 size={14} className="mr-1.5" />Bulk Update</Button>
            <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Add Subject</Button>
          </div>
        }
      />
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search subjects..." />
      
      <Modal isOpen={open} onClose={resetAndClose} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Mathematics" />
          <Input label="Code *" value={form.code} onChange={(e) => setField('code', e.target.value)} placeholder="MATH" />
          <Select
            label="Type"
            options={[
              { value: 'core', label: 'Core' },
              { value: 'elective', label: 'Elective' },
              { value: 'co-curricular', label: 'Co-curricular' },
            ]}
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
          />
          <Input label="Max marks" type="number" value={form.maxMarks} onChange={(e) => setField('maxMarks', e.target.value)} />
          <Input label="Pass marks" type="number" value={form.passMarks} onChange={(e) => setField('passMarks', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editingId ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <Modal isOpen={bulkEditOpen} onClose={() => { setBulkEditOpen(false); setBulkEditForm({ field: 'maxMarks', value: '' }); }} title="Bulk Update Subjects">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            This will update the selected field for all subjects in the school database to the specified value.
          </p>
          <Select
            label="Field to update *"
            options={[
              { value: 'maxMarks', label: 'Max Marks' },
              { value: 'passMarks', label: 'Pass Marks' },
              { value: 'type', label: 'Type' },
            ]}
            value={bulkEditForm.field}
            onChange={(e) => setBulkEditForm({ field: e.target.value, value: '' })}
          />

          {bulkEditForm.field === 'type' ? (
            <Select
              label="New Value *"
              options={[
                { value: 'core', label: 'Core' },
                { value: 'elective', label: 'Elective' },
                { value: 'co-curricular', label: 'Co-curricular' },
              ]}
              value={bulkEditForm.value}
              onChange={(e) => setBulkEditForm({ ...bulkEditForm, value: e.target.value })}
            />
          ) : (
            <Input
              label="New Value *"
              type="number"
              placeholder={
                bulkEditForm.field === 'weeklyPeriods' ? 'e.g. 5' : 
                bulkEditForm.field === 'maxMarks' ? 'e.g. 100' : 'e.g. 33'
              }
              value={bulkEditForm.value}
              onChange={(e) => setBulkEditForm({ ...bulkEditForm, value: e.target.value })}
            />
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => { setBulkEditOpen(false); setBulkEditForm({ field: 'maxMarks', value: '' }); }}>Cancel</Button>
          <Button onClick={handleBulkEdit} loading={saving}>Update All</Button>
        </div>
      </Modal>

      <BulkImportModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        entityType="subjects"
        onSuccess={() => { setLoading(true); setReload((r) => r + 1); }}
      />
    </>
  );
}

const tabs = [
 { key: 'years', label: 'Academic Years' },
 { key: 'classes', label: 'Classes' },
 { key: 'sections', label: 'Sections' },
 { key: 'subjects', label: 'Subjects' },
];

export default function Academic() {
 const [active, setActive] = useState('years');

 return (
 <div className="space-y-6">
 <div className="flex gap-1 p-1 bg-white border border-border rounded-xl w-fit">
 {tabs.map((tab) => (
 <button
 key={tab.key}
 onClick={() => setActive(tab.key)}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === tab.key ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 {active === 'years' && <AcademicYears />}
 {active === 'classes' && <Classes />}
 {active === 'sections' && <Sections />}
 {active === 'subjects' && <Subjects />}
 </div>
 );
}
