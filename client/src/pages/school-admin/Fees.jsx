import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Wallet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { feeApi } from '../../api/fee.api';
import { academicApi } from '../../api/academic.api';
import { studentApi } from '../../api/student.api';

const statusColors = {
  paid: 'success',
  partial: 'warning',
  pending: 'info',
  overdue: 'danger',
  cancelled: 'gray',
};

function Structures() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    academicYear: '',
    schoolClass: '',
    lateFeePerDay: 0,
    categories: [{ name: '', type: 'tuition', amount: 100, frequency: 'monthly' }],
  });

  useEffect(() => {
    academicApi.getAcademicYears({ limit: 100 }).then((res) => setYears(res.data)).catch(() => {});
    academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await feeApi.getStructures({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load fee structures');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateCategory = (index, key, value) => {
    setForm((f) => {
      const categories = [...f.categories];
      categories[index] = { ...categories[index], [key]: value };
      return { ...f, categories };
    });
  };

  const addCategory = () => setForm((f) => ({ ...f, categories: [...f.categories, { name: '', type: 'tuition', amount: 100, frequency: 'monthly' }] }));
  const removeCategory = (index) => setForm((f) => ({ ...f, categories: f.categories.filter((_, i) => i !== index) }));

  const resetAndClose = () => {
    setForm({ name: '', academicYear: '', schoolClass: '', lateFeePerDay: 0, categories: [{ name: '', type: 'tuition', amount: 100, frequency: 'monthly' }] });
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.academicYear || !form.schoolClass) {
      toast.error('Name, academic year, and class are required');
      return;
    }
    const categories = form.categories.filter((c) => c.name && c.amount > 0);
    if (categories.length === 0) {
      toast.error('Add at least one fee category');
      return;
    }
    setSaving(true);
    try {
      await feeApi.createStructure({
        name: form.name,
        academicYear: form.academicYear,
        schoolClass: [form.schoolClass],
        lateFeePerDay: Number(form.lateFeePerDay) || 0,
        categories: categories.map((c) => ({
          name: c.name,
          type: c.type,
          amount: Number(c.amount),
          frequency: c.frequency,
        })),
      });
      toast.success('Fee structure created');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete fee structure?',
      text: `${row.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await feeApi.deleteStructure(row._id);
        toast.success('Fee structure deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete fee structure');
      }
    });
  };

  const columns = [
    { key: 'name', label: 'Structure', sortable: true, render: (r) => <span className="font-medium text-gray-200">{r.name}</span> },
    { key: 'academicYear', label: 'Academic Year', render: (r) => yearMap[r.academicYear] || '—' },
    { key: 'categories', label: 'Categories', render: (r) => Array.isArray(r.categories) ? r.categories.length : '—' },
    { key: 'totalAmount', label: 'Total Amount', render: (r) => <span className="text-indigo-300">₹{r.totalAmount?.toLocaleString()}</span> },
    { key: 'lateFeePerDay', label: 'Late Fee / Day', render: (r) => `₹${r.lateFeePerDay || 0}` },
    { key: 'isActive', label: 'Status', render: (r) => <Badge color={r.isActive ? 'success' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button onClick={() => handleDelete(r)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Fee Structures"
        description="Define fee categories and amounts per class"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Add Structure</Button>}
      />
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search structures..." />
      <Modal isOpen={open} onClose={resetAndClose} title="Add Fee Structure" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Name *" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Annual Fees 2026" />
          <Select
            label="Academic year *"
            options={years.map((y) => ({ value: y._id, label: y.name }))}
            value={form.academicYear}
            onChange={(e) => setField('academicYear', e.target.value)}
          />
          <Select
            label="Class *"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={form.schoolClass}
            onChange={(e) => setField('schoolClass', e.target.value)}
          />
        </div>
        <Input label="Late fee per day" type="number" className="mt-4" value={form.lateFeePerDay} onChange={(e) => setField('lateFeePerDay', e.target.value)} />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Categories *</h3>
            <Button variant="outline" size="sm" onClick={addCategory}><Plus size={14} className="mr-1" />Add Category</Button>
          </div>
          <div className="space-y-3">
            {form.categories.map((cat, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <Input label={index === 0 ? 'Name' : undefined} value={cat.name} onChange={(e) => updateCategory(index, 'name', e.target.value)} placeholder="Tuition" />
                </div>
                <div className="w-32">
                  <Select
                    label={index === 0 ? 'Type' : undefined}
                    options={[
                      { value: 'admission', label: 'Admission' },
                      { value: 'tuition', label: 'Tuition' },
                      { value: 'transport', label: 'Transport' },
                      { value: 'library', label: 'Library' },
                      { value: 'sports', label: 'Sports' },
                      { value: 'lab', label: 'Lab' },
                      { value: 'development', label: 'Development' },
                      { value: 'other', label: 'Other' },
                    ]}
                    value={cat.type}
                    onChange={(e) => updateCategory(index, 'type', e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <Input label={index === 0 ? 'Amount' : undefined} type="number" value={cat.amount} onChange={(e) => updateCategory(index, 'amount', e.target.value)} />
                </div>
                <button onClick={() => removeCategory(index)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>Create Structure</Button>
        </div>
      </Modal>
    </>
  );
}

function Transactions() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [years, setYears] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student: '', feeStructure: '', academicYear: '', amount: '', paidAmount: '', paymentMethod: 'cash', transactionId: '', remarks: '' });

  useEffect(() => {
    studentApi.getAll({ limit: 100 }).then((res) => setStudents(res.data)).catch(() => {});
    feeApi.getStructures({ limit: 100 }).then((res) => setStructures(res.data)).catch(() => {});
    academicApi.getAcademicYears({ limit: 100 }).then((res) => setYears(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await feeApi.getTransactions({ page, limit: 10 });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load transactions');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const studentMap = Object.fromEntries(students.map((s) => [s._id, `${s.firstName} ${s.lastName}`]));
  const structureMap = Object.fromEntries(structures.map((s) => [s._id, s.name]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm({ student: '', feeStructure: '', academicYear: '', amount: '', paidAmount: '', paymentMethod: 'cash', transactionId: '', remarks: '' }); setOpen(false); };

  const handleRecord = async () => {
    if (!form.student || !form.feeStructure || !form.academicYear || !form.amount || !form.paidAmount) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await feeApi.recordPayment({
        student: form.student,
        feeStructure: form.feeStructure,
        academicYear: form.academicYear,
        amount: Number(form.amount),
        paidAmount: Number(form.paidAmount),
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId || undefined,
        remarks: form.remarks || undefined,
      });
      toast.success('Payment recorded');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (r) => studentMap[r.student] || '—' },
    { key: 'feeStructure', label: 'Structure', render: (r) => structureMap[r.feeStructure] || '—' },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount?.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', render: (r) => <span className="text-green-300">₹{r.paidAmount?.toLocaleString()}</span> },
    { key: 'balance', label: 'Balance', render: (r) => <span className="text-red-300">₹{r.balance?.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge> },
    { key: 'paymentDate', label: 'Payment Date', render: (r) => r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—' },
  ];

  return (
    <>
      <PageHeader
        title="Fee Transactions"
        description="Track payments and outstanding balances"
        action={<Button onClick={() => setOpen(true)}><Wallet size={16} className="mr-2" />Record Payment</Button>}
      />
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search transactions..." />
      <Modal isOpen={open} onClose={resetAndClose} title="Record Payment" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Student *" options={students.map((s) => ({ value: s._id, label: `${s.firstName} ${s.lastName}` }))} value={form.student} onChange={(e) => setField('student', e.target.value)} />
          <Select label="Fee structure *" options={structures.map((s) => ({ value: s._id, label: s.name }))} value={form.feeStructure} onChange={(e) => setField('feeStructure', e.target.value)} />
          <Select label="Academic year *" options={years.map((y) => ({ value: y._id, label: y.name }))} value={form.academicYear} onChange={(e) => setField('academicYear', e.target.value)} />
          <Select
            label="Payment method *"
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'online', label: 'Online' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
            ]}
            value={form.paymentMethod}
            onChange={(e) => setField('paymentMethod', e.target.value)}
          />
          <Input label="Total amount *" type="number" value={form.amount} onChange={(e) => setField('amount', e.target.value)} />
          <Input label="Amount paid *" type="number" value={form.paidAmount} onChange={(e) => setField('paidAmount', e.target.value)} />
          <Input label="Transaction ID" value={form.transactionId} onChange={(e) => setField('transactionId', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleRecord} loading={saving}>Record Payment</Button>
        </div>
      </Modal>
    </>
  );
}

export default function Fees() {
  const [active, setActive] = useState('structures');
  const [report, setReport] = useState(null);

  useEffect(() => {
    feeApi.getReport().then((res) => setReport(res.data)).catch(() => {});
  }, [active]);

  return (
    <div className="space-y-6">
      <PageHeader title="Fees" description="Manage fee structures, payments, and collections" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-gray-800 border border-gray-700 rounded-xl">
          <p className="text-sm text-gray-400">Total Collected</p>
          <p className="text-2xl font-bold text-green-300 mt-1">₹{report?.totalCollected?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="p-5 bg-gray-800 border border-gray-700 rounded-xl">
          <p className="text-sm text-gray-400">Pending Payments</p>
          <p className="text-2xl font-bold text-red-300 mt-1">{report?.pendingCount ?? '-'}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-800 border border-gray-700 rounded-xl w-fit">
        <button
          onClick={() => setActive('structures')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === 'structures' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Structures
        </button>
        <button
          onClick={() => setActive('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === 'transactions' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
        >
          Transactions
        </button>
      </div>

      {active === 'structures' ? <Structures /> : <Transactions />}
    </div>
  );
}
