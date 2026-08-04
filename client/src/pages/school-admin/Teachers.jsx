import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { teacherApi } from '../../api/teacher.api';

const emptyForm = {
  firstName: '',
  lastName: '',
  employeeId: '',
  gender: 'male',
  dateOfBirth: '',
  department: '',
  phone: '',
  email: '',
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

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm(emptyForm); setOpen(false); };

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.employeeId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await teacherApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        employeeId: form.employeeId,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        department: form.department || undefined,
        contact: { phone: form.phone || undefined, email: form.email || undefined },
      });
      toast.success('Teacher created');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to create teacher');
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
    { key: 'subjects', label: 'Subjects', render: (r) => Array.isArray(r.subjects) ? r.subjects.length : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'active' ? 'success' : 'gray'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          onClick={() => handleDelete(r)}
          className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          title="Delete teacher"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher profiles and assignments"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Add Teacher</Button>}
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

      <Modal isOpen={open} onClose={resetAndClose} title="Add Teacher" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name *" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="Jane" />
          <Input label="Last name *" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Smith" />
          <Input label="Employee ID *" value={form.employeeId} onChange={(e) => setField('employeeId', e.target.value)} placeholder="TCH-001" />
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
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Teacher</Button>
        </div>
      </Modal>
    </div>
  );
}
