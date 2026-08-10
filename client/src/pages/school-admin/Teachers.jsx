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
import { teacherApi } from '../../api/teacher.api';
import { academicApi } from '../../api/academic.api';
import BulkImportModal from '../../components/ui/BulkImportModal';

const emptyForm = {
  firstName: '',
  lastName: '',
  employeeId: '',
  gender: 'male',
  dateOfBirth: '',
  department: '',
  phone: '',
  email: '',
  subjects: [],
};

export default function Teachers() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Subject data
  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    academicApi.getSubjects({ limit: 200 }).then((res) => setAllSubjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await teacherApi.getAll({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load teachers');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const subjectMap = Object.fromEntries(allSubjects.map((s) => [s._id, s.name]));

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const resetAndClose = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (teacher) => {
    setForm({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      employeeId: teacher.employeeId || '',
      gender: teacher.gender || 'male',
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      department: teacher.department || '',
      phone: teacher.contact?.phone || '',
      email: teacher.contact?.email || '',
      subjects: Array.isArray(teacher.subjects)
        ? teacher.subjects.map((s) => (typeof s === 'string' ? s : s._id || s))
        : [],
    });
    setEditId(teacher._id);
    setOpen(true);
  };

  const toggleSubject = (subjectId) => {
    setForm((f) => {
      const subjects = [...f.subjects];
      const idx = subjects.indexOf(subjectId);
      if (idx >= 0) {
        subjects.splice(idx, 1);
      } else {
        subjects.push(subjectId);
      }
      return { ...f, subjects };
    });
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.employeeId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        employeeId: form.employeeId,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        department: form.department || undefined,
        contact: { phone: form.phone || undefined, email: form.email || undefined },
        subjects: form.subjects,
      };

      if (editId) {
        await teacherApi.update(editId, payload);
        toast.success('Teacher updated');
      } else {
        await teacherApi.create(payload);
        toast.success('Teacher created');
      }
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (teacher) => {
    Swal.fire({
      title: 'Delete teacher?',
      text: `${teacher.firstName} ${teacher.lastName} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await teacherApi.delete(teacher._id);
        toast.success('Teacher deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete teacher');
      }
    });
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', sortable: true },
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium text-gray-200">{r.firstName} {r.lastName}</span> },
    { key: 'department', label: 'Department', render: (r) => r.department || '—' },
    {
      key: 'subjects',
      label: 'Subjects',
      render: (r) => {
        if (!Array.isArray(r.subjects) || r.subjects.length === 0) return <span className="text-gray-500">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {r.subjects.slice(0, 3).map((s, i) => {
              const name = typeof s === 'string' ? (subjectMap[s] || s) : (s.name || subjectMap[s._id] || '—');
              return <Badge key={i} color="info">{name}</Badge>;
            })}
            {r.subjects.length > 3 && <Badge color="gray">+{r.subjects.length - 3}</Badge>}
          </div>
        );
      },
    },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'active' ? 'success' : 'gray'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(r)}
            className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
            title="Edit teacher"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(r)}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Delete teacher"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles, subjects, and assignments"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}><Upload size={16} className="mr-2" />Bulk Import</Button>
            <Button onClick={openCreate}><Plus size={16} className="mr-2" />Add Teacher</Button>
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
        searchPlaceholder="Search by name or employee ID..."
      />

      <Modal isOpen={open} onClose={resetAndClose} title={editId ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name *" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Jane" />
          <Input label="Last name *" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Smith" />
          <Input label="Employee ID *" value={form.employeeId} onChange={(e) => setField('employeeId', e.target.value)} placeholder="TCH-001" disabled={!!editId} />
          <Select
            label="Gender"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            value={form.gender}
            onChange={(e) => setField('gender', e.target.value)}
          />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setField('dateOfBirth', e.target.value)} />
          <Input label="Department" value={form.department} onChange={(e) => setField('department', e.target.value)} placeholder="Science" />
          <Input label="Phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 90000 00000" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="teacher@school.edu" />
        </div>

        {/* Multi-Subject Selection */}
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Subjects (select multiple)</label>
          {allSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">No subjects found. Create subjects in the Academic section first.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-900/60 border border-gray-700 rounded-xl">
              {allSubjects.map((subject) => {
                const isSelected = form.subjects.includes(subject._id);
                return (
                  <button
                    key={subject._id}
                    type="button"
                    onClick={() => toggleSubject(subject._id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-600'
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
            <p className="text-xs text-gray-500 mt-1.5">{form.subjects.length} subject{form.subjects.length > 1 ? 's' : ''} selected</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{editId ? 'Update Teacher' : 'Create Teacher'}</Button>
        </div>
      </Modal>

      <BulkImportModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        entityType="teachers"
        onSuccess={() => { setLoading(true); setReload((r) => r + 1); }}
      />
    </div>
  );
}
