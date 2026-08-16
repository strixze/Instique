import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Wallet, Upload, ArrowRight } from 'lucide-react';
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
 const [sort, setSort] = useState('-createdAt');
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
 installments: [100],
 });

 useEffect(() => {
 academicApi.getAcademicYears({ limit: 100 }).then((res) => {
 setYears(res.data);
 if (res.data?.length > 0) {
 setForm((f) => ({ ...f, academicYear: f.academicYear || res.data[0]._id }));
 }
 }).catch(() => {});
 academicApi.getClasses({ limit: 100 }).then((res) => {
 setClasses(res.data);
 if (res.data?.length > 0) {
 setForm((f) => ({ ...f, schoolClass: f.schoolClass || res.data[0]._id }));
 }
 }).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await feeApi.getStructures({ page, limit: 10, search: search || undefined, sort });
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
 }, [page, search, reload, sort]);

 const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));
 const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
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
 setForm({
 name: '',
 academicYear: years[0]?._id || '',
 schoolClass: classes[0]?._id || '',
 lateFeePerDay: 0,
 categories: [{ name: '', type: 'tuition', amount: 100, frequency: 'monthly' }],
 installments: [100],
 });
 setOpen(false);
 };

 const instSum = form.installments.reduce((s, v) => s + v, 0);
 const isValidInst = Math.round(instSum) === 100;

 const handleInstChange = (idx, val) => {
 setForm(f => {
 const next = [...f.installments];
 next[idx] = Number(val) || 0;
 return { ...f, installments: next };
 });
 };
 const addInst = () => setForm(f => ({ ...f, installments: [...f.installments, 0] }));
 const removeInst = (idx) => setForm(f => ({ ...f, installments: f.installments.filter((_, i) => i !== idx) }));

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
 if (!isValidInst) {
 toast.error('Installment percentages must sum to exactly 100%');
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
 installments: form.installments,
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

 const handleImportFile = async (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 
 const formData = new FormData();
 formData.append('file', file);

 const loadToast = toast.loading('Uploading and processing file...');
 try {
 const res = await feeApi.importStructures(formData);
 toast.dismiss(loadToast);
 
 const { savedCount, errors } = res.data || {};
 
 if (errors && errors.length > 0) {
 Swal.fire({
 title: `Imported ${savedCount} structures with ${errors.length} warning(s)`,
 html: `<div class="text-left text-xs text-red-400 max-h-60 overflow-y-auto space-y-1 bg-white/80 p-3 rounded-lg border border-border font-mono">${errors.map(err => `<div>• ${err}</div>`).join('')}</div>`,
 icon: 'warning',
 confirmButtonText: 'OK',
 confirmButtonColor: '#4f46e5'
 });
 } else {
 toast.success(`Successfully imported ${savedCount} fee structures`);
 }
 
 setLoading(true);
 setReload(r => r + 1);
 } catch (err) {
 toast.dismiss(loadToast);
 toast.error(err?.message || 'Failed to import file');
 } finally {
 e.target.value = '';
 }
 };

 const columns = [
 { key: 'name', label: 'Structure', sortable: true, render: (r) => <span className="font-medium text-deep">{r.name}</span> },
 { key: 'academicYear', label: 'Academic Year', sortable: true, render: (r) => r.academicYear?.name || yearMap[r.academicYear?._id || r.academicYear] || '—' },
 {
 key: 'schoolClass',
 label: 'Class',
 sortable: true,
 render: (r) => {
 if (!Array.isArray(r.schoolClass) || r.schoolClass.length === 0) return '—';
 return r.schoolClass.map((c) => c?.name || classMap[c?._id || c] || '—').join(', ');
 },
 },
 { key: 'categories', label: 'Categories', render: (r) => Array.isArray(r.categories) ? r.categories.length : '—' },
 { key: 'totalAmount', label: 'Total Amount', render: (r) => <span className="text-forest">₹{r.totalAmount?.toLocaleString()}</span> },
 { key: 'lateFeePerDay', label: 'Late Fee / Day', render: (r) => `₹${r.lateFeePerDay || 0}` },
 { key: 'isActive', label: 'Status', sortable: true, render: (r) => <Badge color={r.isActive ? 'success' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
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
 title="Fee Structures"
 description="Define fee categories and amounts per class"
 action={
 <div className="flex gap-2">
 <label className="flex items-center gap-2 px-4 py-2 bg-white border border-border hover:border-border rounded-lg text-sm font-medium text-deep cursor-pointer transition-colors">
 <Upload size={16} />
 Import Excel/CSV
 <input
 type="file"
 accept=".xlsx,.xls,.csv"
 className="hidden"
 onChange={handleImportFile}
 />
 </label>
 <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Add Structure</Button>
 </div>
 }
 />
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} onSort={(field, order) => { setSort(`${order === 'desc' ? '-' : ''}${field}`); setPage(1); setLoading(true); }} searchPlaceholder="Search structures..."/>
 <Modal isOpen={open} onClose={resetAndClose} title="Add Fee Structure"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Input label="Name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Annual Fees 2026"/>
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
 <Input label="Late fee per day"type="number"className="mt-4"value={form.lateFeePerDay} onChange={(e) => setField('lateFeePerDay', e.target.value)} />

 <div className="mt-6">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-medium text-secondary">Categories *</h3>
 <Button variant="outline"size="sm"onClick={addCategory}><Plus size={14} className="mr-1"/>Add Category</Button>
 </div>
 <div className="space-y-3">
 {form.categories.map((cat, index) => (
 <div key={index} className="flex items-end gap-2">
 <div className="flex-1">
 <Input label={index === 0 ? 'Name' : undefined} value={cat.name} onChange={(e) => updateCategory(index, 'name', e.target.value)} placeholder="Tuition"/>
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
 <Input label={index === 0 ? 'Amount' : undefined} type="number"value={cat.amount} onChange={(e) => updateCategory(index, 'amount', e.target.value)} />
 </div>
 <button onClick={() => removeCategory(index)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors">
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Installments Section */}
 <div className="mt-6">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-medium text-secondary">Installments (in %)</h3>
 <Button variant="outline" size="sm" onClick={addInst}><Plus size={14} className="mr-1"/>Add Installment</Button>
 </div>
 <div className="space-y-2">
 {form.installments.map((pct, idx) => (
 <div key={idx} className="flex items-center gap-2">
 <div className="relative flex-1">
 <Input
 type="number"
 value={pct === 0 ? '' : pct}
 onChange={(e) => handleInstChange(idx, e.target.value)}
 placeholder={`Installment ${idx + 1}`}
 className="pr-8"
 />
 <span className="absolute right-3 top-[9px] text-sm text-muted">%</span>
 </div>
 {form.installments.length > 1 && (
 <button onClick={() => removeInst(idx)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"><Trash2 size={16}/></button>
 )}
 </div>
 ))}
 </div>
 <div className="flex items-center gap-2 mt-3 p-2 rounded-lg border text-xs font-medium" style={{ borderColor: isValidInst ? '#22c55e33' : '#ef444433', background: isValidInst ? '#f0fdf4' : '#fef2f2', color: isValidInst ? '#166534' : '#991b1b' }}>
 <span>Total: {instSum}%</span>
 {isValidInst ? <span>✓ Valid</span> : <span>⚠ Must equal 100%</span>}
 <span className="ml-auto flex items-center gap-1">{form.installments.map((p, i) => (<span key={i} className="flex items-center gap-1">{p}%{i < form.installments.length - 1 && <ArrowRight size={10}/>}</span>))}</span>
 </div>
 </div>

 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving} disabled={!isValidInst}>Create Structure</Button>
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
 const [sort, setSort] = useState('-createdAt');
 const [reload, setReload] = useState(0);
 const [students, setStudents] = useState([]);
 const [structures, setStructures] = useState([]);
 const [years, setYears] = useState([]);
 const [open, setOpen] = useState(false);
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState({ student: '', feeStructure: '', academicYear: '', amount: '', paidAmount: '', paymentMethod: 'cash', transactionId: '', remarks: '' });

 useEffect(() => {
 studentApi.getAll({ limit: 100 }).then((res) => {
 setStudents(res.data);
 if (res.data?.length > 0) {
 setForm((f) => ({ ...f, student: f.student || res.data[0]._id }));
 }
 }).catch(() => {});
 
 feeApi.getStructures({ limit: 100 }).then((res) => {
 setStructures(res.data);
 if (res.data?.length > 0) {
 setForm((f) => ({ ...f, feeStructure: f.feeStructure || res.data[0]._id }));
 }
 }).catch(() => {});
 
 academicApi.getAcademicYears({ limit: 100 }).then((res) => {
 setYears(res.data);
 if (res.data?.length > 0) {
 setForm((f) => ({ ...f, academicYear: f.academicYear || res.data[0]._id }));
 }
 }).catch(() => {});
 }, []);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await feeApi.getTransactions({ page, limit: 10, search: search || undefined, sort });
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
 }, [page, search, reload, sort]);

 const studentMap = Object.fromEntries(students.map((s) => [s._id, `${s.firstName} ${s.lastName}`]));
 const structureMap = Object.fromEntries(structures.map((s) => [s._id, s.name]));
 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
 const resetAndClose = () => {
 setForm({
 student: students[0]?._id || '',
 feeStructure: structures[0]?._id || '',
 academicYear: years[0]?._id || '',
 amount: '',
 paidAmount: '',
 paymentMethod: 'cash',
 transactionId: '',
 remarks: '',
 });
 setOpen(false);
 };

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
 { key: 'student', label: 'Student', render: (r) => r.student ? (typeof r.student === 'object' ? `${r.student.firstName} ${r.student.lastName}` : studentMap[r.student] || '—') : '—' },
 { key: 'feeStructure', label: 'Structure', render: (r) => r.feeStructure ? (typeof r.feeStructure === 'object' ? r.feeStructure.name : structureMap[r.feeStructure] || '—') : '—' },
 { key: 'amount', label: 'Amount', sortable: true, render: (r) => `₹${r.amount?.toLocaleString()}` },
 { key: 'paidAmount', label: 'Paid', sortable: true, render: (r) => <span className="text-success-text">₹{r.paidAmount?.toLocaleString()}</span> },
 { key: 'balance', label: 'Balance', sortable: true, render: (r) => <span className="text-danger-text">₹{r.balance?.toLocaleString()}</span> },
 { key: 'status', label: 'Status', sortable: true, render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge> },
 { key: 'paymentDate', label: 'Payment Date', sortable: true, render: (r) => r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '—' },
 ];

 return (
 <>
 <PageHeader
 title="Fee Transactions"
 description="Track payments and outstanding balances"
 action={<Button onClick={() => setOpen(true)}><Wallet size={16} className="mr-2"/>Record Payment</Button>}
 />
 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} onSort={(field, order) => { setSort(`${order === 'desc' ? '-' : ''}${field}`); setPage(1); setLoading(true); }} searchPlaceholder="Search transactions..."/>
 <Modal isOpen={open} onClose={resetAndClose} title="Record Payment"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Select label="Student *"options={students.map((s) => ({ value: s._id, label: `${s.firstName} ${s.lastName}` }))} value={form.student} onChange={(e) => setField('student', e.target.value)} />
 <Select label="Fee structure *"options={structures.map((s) => ({ value: s._id, label: s.name }))} value={form.feeStructure} onChange={(e) => setField('feeStructure', e.target.value)} />
 <Select label="Academic year *"options={years.map((y) => ({ value: y._id, label: y.name }))} value={form.academicYear} onChange={(e) => setField('academicYear', e.target.value)} />
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
 <Input label="Total amount *"type="number"value={form.amount} onChange={(e) => setField('amount', e.target.value)} />
 <Input label="Amount paid *"type="number"value={form.paidAmount} onChange={(e) => setField('paidAmount', e.target.value)} />
 <Input label="Transaction ID"value={form.transactionId} onChange={(e) => setField('transactionId', e.target.value)} />
 <Input label="Remarks"value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleRecord} loading={saving}>Record Payment</Button>
 </div>
 </Modal>
 </>
 );
}

function PendingFees() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [form, setForm] = useState({ amountPaid: '', paymentMethod: 'cash', remarks: '' });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await feeApi.getTransactions({ page, limit: 10, search: search || undefined, pendingOnly: 'true', sort });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load pending transactions');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, sort]);

  const handlePayClick = (tx) => {
    setSelectedTx(tx);
    setForm({
      amountPaid: tx.balance || 0,
      paymentMethod: 'cash',
      remarks: ''
    });
    setOpen(true);
  };

  const resetAndClose = () => {
    setSelectedTx(null);
    setForm({ amountPaid: '', paymentMethod: 'cash', remarks: '' });
    setOpen(false);
  };

  const handlePayment = async () => {
    if (!form.amountPaid) {
      toast.error('Please enter paid amount');
      return;
    }
    setSaving(true);
    try {
      await feeApi.payPendingFee(selectedTx._id, {
        amountPaid: Number(form.amountPaid),
        paymentMethod: form.paymentMethod,
        remarks: form.remarks || undefined
      });
      toast.success('Payment recorded successfully');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
      window.dispatchEvent(new CustomEvent('refreshFeeReport'));
    } catch (e) {
      toast.error(e?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (r) => r.student ? `${r.student.firstName} ${r.student.lastName} (${r.student.admissionNo})` : '—' },
    { key: 'feeStructure', label: 'Structure', render: (r) => r.feeStructure?.name || '—' },
    { key: 'amount', label: 'Total Amount', sortable: true, render: (r) => `₹${r.amount?.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', sortable: true, render: (r) => <span className="text-success-text font-medium">₹{r.paidAmount?.toLocaleString()}</span> },
    { key: 'balance', label: 'Pending Balance', sortable: true, render: (r) => <span className="text-danger-text font-bold">₹{r.balance?.toLocaleString()}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => handlePayClick(r)}>
          <Wallet size={14} className="mr-1"/> Pay
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Pending Fees"
        description="Track and pay outstanding fee balances for students"
      />
      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} onSort={(field, order) => { setSort(`${order === 'desc' ? '-' : ''}${field}`); setPage(1); setLoading(true); }} searchPlaceholder="Search pending fees..."/>
      
      <Modal isOpen={open} onClose={resetAndClose} title={selectedTx ? `Record Payment: ${selectedTx.student?.firstName} ${selectedTx.student?.lastName}` : 'Record Payment'} size="lg">
        {selectedTx && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-sage-soft border border-border rounded-xl text-center">
              <div>
                <span className="text-xs text-muted block uppercase">Total Fee</span>
                <span className="text-lg font-bold text-deep">₹{selectedTx.amount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-muted block uppercase">Already Paid</span>
                <span className="text-lg font-bold text-success-text">₹{selectedTx.paidAmount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-muted block uppercase">Pending Balance</span>
                <span className="text-lg font-bold text-danger-text">₹{selectedTx.balance?.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount to Pay *"
                type="number"
                value={form.amountPaid}
                onChange={(e) => setForm(f => ({ ...f, amountPaid: e.target.value }))}
                placeholder="Enter payment amount"
              />
              <Select
                label="Payment Method *"
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'cheque', label: 'Cheque' },
                  { value: 'online', label: 'Online' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                ]}
                value={form.paymentMethod}
                onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              />
              <div className="col-span-2">
                <Input
                  label="Remarks"
                  value={form.remarks}
                  onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="e.g. Next installment payment"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
              <Button onClick={handlePayment} loading={saving}>Record Payment</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Fees() {
  const [active, setActive] = useState('structures');
  const [report, setReport] = useState(null);
  const [reloadReport, setReloadReport] = useState(0);

  useEffect(() => {
    feeApi.getReport().then((res) => setReport(res.data)).catch(() => {});
  }, [active, reloadReport]);

  useEffect(() => {
    const handleRefresh = () => setReloadReport(r => r + 1);
    window.addEventListener('refreshFeeReport', handleRefresh);
    return () => window.removeEventListener('refreshFeeReport', handleRefresh);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Fees" description="Manage fee structures, payments, and collections"/>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-border rounded-xl">
          <p className="text-sm text-muted">Total Collected</p>
          <p className="text-2xl font-bold text-success-text mt-1">₹{report?.totalCollected?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="p-5 bg-white border border-border rounded-xl">
          <p className="text-sm text-muted">Total Pending Fees</p>
          <p className="text-2xl font-bold text-danger-text mt-1">₹{report?.totalPending?.toLocaleString() ?? '-'}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-white border border-border rounded-xl w-fit">
        <button
          onClick={() => setActive('structures')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === 'structures' ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
        >
          Structures
        </button>
        <button
          onClick={() => setActive('transactions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === 'transactions' ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActive('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === 'pending' ? 'bg-forest text-white' : 'text-muted hover:text-deep'}`}
        >
          Pending Fees
        </button>
      </div>

      {active === 'structures' ? <Structures /> : active === 'transactions' ? <Transactions /> : <PendingFees />}
    </div>
  );
}
