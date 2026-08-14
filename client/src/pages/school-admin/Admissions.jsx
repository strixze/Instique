import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Eye, FileCheck, CheckCircle2, XCircle, UserPlus,
  Building2, CreditCard, Receipt, ArrowRight, Upload, Clock,
  ChevronRight, Filter, RotateCcw, FileText, X, Trash2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { admissionApi } from '../../api/admission.api';
import { academicApi } from '../../api/academic.api';
import { feeApi } from '../../api/fee.api';

/* ──────────────────────── Constants ──────────────────────── */

const WORKFLOW_STATUSES = [
  { value: 'submitted', label: 'Submitted', color: 'gray', icon: FileText },
  { value: 'document_verification', label: 'Doc Verification', color: 'info', icon: FileCheck },
  { value: 'under_review', label: 'Under Review', color: 'warning', icon: Clock },
  { value: 'approved', label: 'Approved', color: 'success', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', color: 'danger', icon: XCircle },
  { value: 'class_allocated', label: 'Class Allocated', color: 'primary', icon: Building2 },
  { value: 'fee_assigned', label: 'Fee Assigned', color: 'info', icon: CreditCard },
  { value: 'payment_pending', label: 'Payment Pending', color: 'warning', icon: Receipt },
  { value: 'partially_paid', label: 'Partially Paid', color: 'warning', icon: Receipt },
  { value: 'paid', label: 'Paid', color: 'success', icon: Receipt },
  { value: 'student_created', label: 'Enrolled', color: 'success', icon: UserPlus },
];

const statusColorMap = Object.fromEntries(WORKFLOW_STATUSES.map(s => [s.value, s.color]));
const statusLabelMap = Object.fromEntries(WORKFLOW_STATUSES.map(s => [s.value, s.label]));

const emptyForm = {
  firstName: '', middleName: '', lastName: '',
  dateOfBirth: '', gender: 'male', bloodGroup: '', aadhaarId: '',
  address: '', city: '', state: '', pincode: '',
  previousSchool: '', previousClass: '',
  applyingForClass: '', academicSession: '',
  parentPhone: '', parentEmail: '',
  father: { name: '', phone: '', email: '', occupation: '' },
  mother: { name: '', phone: '', email: '', occupation: '' },
  guardian: { name: '', relation: '', phone: '', email: '' },
};

/* ──────────────────────── Main Component ──────────────────────── */

export default function Admissions() {
  // List state
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Lookup data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formStep, setFormStep] = useState(0); // 0: student, 1: parent, 2: academic

  // Detail view state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action modals state
  const [actionModal, setActionModal] = useState(null); // 'allocate' | 'fee' | 'payment' | null
  const [actionSaving, setActionSaving] = useState(false);

  // Allocate form
  const [allocateForm, setAllocateForm] = useState({ assignedClassId: '', assignedSectionId: '' });
  // Fee form
  const [feeForm, setFeeForm] = useState({ feeStructureId: '', discountName: '', discountValue: '' });
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '', paymentMethod: 'cash', referenceNo: '', paymentDate: '', notes: ''
  });

  /* ──────────────────────── Data Fetching ──────────────────────── */

  useEffect(() => {
    Promise.all([
      academicApi.getClasses({ limit: 100 }),
      academicApi.getAcademicYears({ limit: 100 }),
      feeApi.getStructures({ limit: 100 }),
    ]).then(([classRes, yearRes, feeRes]) => {
      setClasses(classRes.data || []);
      setYears(yearRes.data || []);
      setFeeStructures(feeRes.data || []);
      // Default form academic session to current year
      const currentYear = yearRes.data?.find(y => y.isCurrent);
      if (currentYear) {
        setForm(f => ({ ...f, academicSession: currentYear._id }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = { page, limit: 10, search: search || undefined };
        if (statusFilter) params.workflowStatus = statusFilter;
        const res = await admissionApi.getAll(params);
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
  }, [page, search, reload, statusFilter]);

  // Load sections when allocateForm.assignedClassId changes
  useEffect(() => {
    if (allocateForm.assignedClassId) {
      academicApi.getSections({ schoolClass: allocateForm.assignedClassId, limit: 100 })
        .then(res => setSections(res.data || []))
        .catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [allocateForm.assignedClassId]);

  /* ──────────────────────── Helpers ──────────────────────── */

  const classMap = Object.fromEntries(classes.map(c => [c._id, c.name]));
  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setNestedField = (parent, key, value) => setForm(f => ({
    ...f, [parent]: { ...f[parent], [key]: value }
  }));

  const resetCreateForm = () => {
    const currentYear = years.find(y => y.isCurrent);
    setForm({ ...emptyForm, academicSession: currentYear?._id || '' });
    setFormStep(0);
    setCreateOpen(false);
  };

  const triggerReload = () => {
    setLoading(true);
    setReload(r => r + 1);
  };

  /* ──────────────────────── Create Application ──────────────────────── */

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.parentPhone) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!form.applyingForClass) {
      toast.error('Please select a class');
      return;
    }
    if (!form.academicSession) {
      toast.error('Please select an academic session');
      return;
    }
    setCreateSaving(true);
    try {
      await admissionApi.create({
        ...form,
        father: form.father?.name ? form.father : undefined,
        mother: form.mother?.name ? form.mother : undefined,
        guardian: form.guardian?.name ? form.guardian : undefined,
      });
      toast.success('Admission application created');
      resetCreateForm();
      setPage(1);
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to create admission');
    } finally {
      setCreateSaving(false);
    }
  };

  /* ──────────────────────── Detail View ──────────────────────── */

  const openDetail = async (admission) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await admissionApi.getById(admission._id);
      setSelectedAdmission(res.data);
    } catch (e) {
      toast.error('Failed to load admission details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedAdmission?._id) return;
    try {
      const res = await admissionApi.getById(selectedAdmission._id);
      setSelectedAdmission(res.data);
    } catch { /* ignore */ }
  };

  /* ──────────────────────── Document Verification ──────────────────────── */

  const handleVerifyDocument = async (docId, status, rejectionReason) => {
    try {
      await admissionApi.updateDocumentStatus(selectedAdmission._id, docId, { status, rejectionReason });
      toast.success(`Document ${status}`);
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to update document');
    }
  };

  const onVerifyDoc = (doc) => {
    handleVerifyDocument(doc._id, 'verified');
  };

  const onRejectDoc = async (doc) => {
    const { value: reason } = await Swal.fire({
      title: 'Rejection Reason',
      input: 'text',
      inputLabel: `Why is "${doc.name}" being rejected?`,
      inputPlaceholder: 'Enter reason...',
      showCancelButton: true,
      inputValidator: (val) => !val && 'Please enter a reason',
    });
    if (reason) {
      handleVerifyDocument(doc._id, 'rejected', reason);
    }
  };

  /* ──────────────────────── Status Update ──────────────────────── */

  const handleStatusUpdate = async (newStatus) => {
    let remarks = '';
    if (newStatus === 'rejected') {
      const { value } = await Swal.fire({
        title: 'Rejection Reason',
        input: 'textarea',
        inputLabel: 'Please provide a reason for rejection',
        showCancelButton: true,
        inputValidator: v => !v && 'Reason is required',
      });
      if (!value) return;
      remarks = value;
    }
    try {
      await admissionApi.updateStatus(selectedAdmission._id, { workflowStatus: newStatus, remarks });
      toast.success(`Status updated to ${statusLabelMap[newStatus]}`);
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to update status');
    }
  };

  /* ──────────────────────── Allocate Class ──────────────────────── */

  const handleAllocate = async () => {
    if (!allocateForm.assignedClassId || !allocateForm.assignedSectionId) {
      toast.error('Please select both class and section');
      return;
    }
    setActionSaving(true);
    try {
      await admissionApi.allocateClassSection(selectedAdmission._id, allocateForm);
      toast.success('Class and section allocated');
      setActionModal(null);
      setAllocateForm({ assignedClassId: '', assignedSectionId: '' });
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to allocate class');
    } finally {
      setActionSaving(false);
    }
  };

  /* ──────────────────────── Assign Fee ──────────────────────── */

  const handleAssignFee = async () => {
    if (!feeForm.feeStructureId) {
      toast.error('Please select a fee structure');
      return;
    }
    setActionSaving(true);
    try {
      await admissionApi.assignFeeStructure(selectedAdmission._id, {
        feeStructureId: feeForm.feeStructureId,
        discountName: feeForm.discountName,
        discountValue: feeForm.discountValue
      });
      toast.success('Fee structure assigned');
      setActionModal(null);
      setFeeForm({ feeStructureId: '', discountName: '', discountValue: '' });
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to assign fee');
    } finally {
      setActionSaving(false);
    }
  };

  /* ──────────────────────── Record Payment ──────────────────────── */

  const handleRecordPayment = async () => {
    if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    setActionSaving(true);
    try {
      await admissionApi.recordManualPayment(selectedAdmission._id, {
        ...paymentForm,
        amountPaid: Number(paymentForm.amountPaid),
      });
      toast.success('Payment recorded');
      setActionModal(null);
      setPaymentForm({ amountPaid: '', paymentMethod: 'cash', referenceNo: '', paymentDate: '', notes: '' });
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to record payment');
    } finally {
      setActionSaving(false);
    }
  };

  /* ──────────────────────── Confirm Admission ──────────────────────── */

  const handleConfirmAdmission = async () => {
    const result = await Swal.fire({
      title: 'Confirm Admission',
      text: 'This will create a Student record, generate a Student ID and Roll Number. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm Admission',
      confirmButtonColor: '#2D6A4F',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await admissionApi.confirmAdmission(selectedAdmission._id);
      const student = res.data?.student;
      toast.success(`Admission confirmed! Student ID: ${student?.admissionNo}, Roll No: ${student?.rollNo}`);
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to confirm admission');
    }
  };

  /* ──────────────────────── Table Columns ──────────────────────── */

  const columns = [
    { key: 'applicationNo', label: 'App No', sortable: true, render: r => (
      <span className="font-mono text-xs font-semibold text-forest">{r.applicationNo}</span>
    )},
    { key: 'applicantName', label: 'Applicant', render: r => (
      <span className="font-medium text-deep">{r.applicantName}</span>
    )},
    { key: 'gender', label: 'Gender', render: r => <span className="capitalize">{r.gender}</span> },
    { key: 'applyingForClass', label: 'Class', render: r => r.applyingForClass?.name || classMap[r.applyingForClass] || '—' },
    { key: 'workflowStatus', label: 'Status', render: r => (
      <Badge color={statusColorMap[r.workflowStatus] || 'gray'}>
        {statusLabelMap[r.workflowStatus] || r.workflowStatus?.replace(/_/g, ' ')}
      </Badge>
    )},
    { key: 'createdAt', label: 'Applied', render: r => r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—' },
    { key: 'actions', label: '', render: r => (
      <Button variant="ghost" size="sm" onClick={() => openDetail(r)}>
        <Eye size={14} className="mr-1" /> View
      </Button>
    )},
  ];

  /* ──────────────────────── Workflow Progress Bar ──────────────────────── */

  const WorkflowProgress = ({ status }) => {
    const steps = ['submitted', 'document_verification', 'class_allocated', 'fee_assigned', 'paid', 'student_created'];
    const stepLabels = ['Applied', 'Docs Verified', 'Class Allocated', 'Fees Assigned', 'Paid (Installment)', 'Enrolled'];

    const statusToStepMap = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      document_verification: 1,
      class_allocated: 2,
      fee_assigned: 3,
      payment_pending: 3,
      partially_paid: 4,
      paid: 4,
      admitted: 5,
      student_created: 5
    };
    const currentIdx = statusToStepMap[status] ?? 0;
    const isRejected = status === 'rejected';

    return (
      <div className="flex items-center gap-0.5 mb-6">
        {steps.map((step, i) => {
          const isComplete = currentIdx >= i;
          const isCurrent = currentIdx === i;
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isRejected ? 'bg-danger-light text-danger-text' :
                  isComplete ? 'bg-forest text-white' :
                  'bg-surface text-muted'
                } ${isCurrent ? 'ring-2 ring-forest/30 ring-offset-2' : ''}`}>
                  {isRejected && i === currentIdx ? '✕' : isComplete ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center leading-tight ${isComplete ? 'text-forest font-medium' : 'text-muted'}`}>
                  {stepLabels[i]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mt-[-14px] ${currentIdx > i ? 'bg-forest' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ──────────────────────── Action Buttons for Detail View ──────────────────────── */

  const getAvailableActions = useCallback(() => {
    if (!selectedAdmission) return [];
    const s = selectedAdmission.workflowStatus;
    const actions = [];

    if (s === 'submitted') {
      actions.push({ label: 'Move to Document Verification', status: 'document_verification', variant: 'secondary', icon: FileCheck });
    }
    if (s === 'submitted' || s === 'document_verification') {
      actions.push({ label: 'Move to Review', status: 'under_review', variant: 'secondary', icon: Clock });
    }
    if (['submitted', 'document_verification', 'under_review', 'approved', 'class_allocated'].includes(s)) {
      actions.push({ label: 'Allocate Class & Section', action: 'allocate', variant: 'primary', icon: Building2 });
    }
    if (s === 'class_allocated' || s === 'fee_assigned') {
      actions.push({ label: 'Assign Fee Structure', action: 'fee', variant: 'primary', icon: CreditCard });
    }
    if (['fee_assigned', 'payment_pending', 'partially_paid'].includes(s)) {
      actions.push({ label: 'Record Payment', action: 'payment', variant: 'primary', icon: Receipt });
    }
    if (s === 'paid' || s === 'partially_paid') {
      actions.push({ label: 'Confirm Admission & Create Student', action: 'confirm', variant: 'primary', icon: UserPlus });
    }

    return actions;
  }, [selectedAdmission]);

  /* ──────────────────────── Create Form Steps ──────────────────────── */

  const formStepTitles = ['Student Information', 'Parent / Guardian', 'Academic Details'];

  const renderFormStep = () => {
    switch (formStep) {
      case 0:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name *" value={form.firstName} onChange={e => setField('firstName', e.target.value)} placeholder="First name" />
            <Input label="Middle Name" value={form.middleName} onChange={e => setField('middleName', e.target.value)} placeholder="Middle name" />
            <Input label="Last Name *" value={form.lastName} onChange={e => setField('lastName', e.target.value)} placeholder="Last name" />
            <Input label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} />
            <Select label="Gender *" options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} value={form.gender} onChange={e => setField('gender', e.target.value)} />
            <Input label="Blood Group" value={form.bloodGroup} onChange={e => setField('bloodGroup', e.target.value)} placeholder="e.g. O+" />
            <Input label="Aadhaar Number" value={form.aadhaarId} onChange={e => setField('aadhaarId', e.target.value)} placeholder="12-digit Aadhaar" />
            <Input label="Address" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Residential address" />
            <Input label="City" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="City" />
            <Input label="State" value={form.state} onChange={e => setField('state', e.target.value)} placeholder="State" />
            <Input label="Pincode" value={form.pincode} onChange={e => setField('pincode', e.target.value)} placeholder="Pincode" />
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <Input label="Primary Contact Phone *" value={form.parentPhone} onChange={e => setField('parentPhone', e.target.value)} placeholder="+91 90000 00000" />
            <Input label="Primary Contact Email" type="email" value={form.parentEmail} onChange={e => setField('parentEmail', e.target.value)} placeholder="email@example.com" />

            <div className="border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-deep flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-forest" /> Father</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.father.name} onChange={e => setNestedField('father', 'name', e.target.value)} placeholder="Father's name" />
                <Input label="Phone" value={form.father.phone} onChange={e => setNestedField('father', 'phone', e.target.value)} placeholder="Phone" />
                <Input label="Email" value={form.father.email} onChange={e => setNestedField('father', 'email', e.target.value)} placeholder="Email" />
                <Input label="Occupation" value={form.father.occupation} onChange={e => setNestedField('father', 'occupation', e.target.value)} placeholder="Occupation" />
              </div>
            </div>

            <div className="border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-deep flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-forest" /> Mother</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.mother.name} onChange={e => setNestedField('mother', 'name', e.target.value)} placeholder="Mother's name" />
                <Input label="Phone" value={form.mother.phone} onChange={e => setNestedField('mother', 'phone', e.target.value)} placeholder="Phone" />
                <Input label="Email" value={form.mother.email} onChange={e => setNestedField('mother', 'email', e.target.value)} placeholder="Email" />
                <Input label="Occupation" value={form.mother.occupation} onChange={e => setNestedField('mother', 'occupation', e.target.value)} placeholder="Occupation" />
              </div>
            </div>

            <div className="border border-border rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-deep flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-forest" /> Guardian (if different)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.guardian.name} onChange={e => setNestedField('guardian', 'name', e.target.value)} placeholder="Guardian's name" />
                <Input label="Relation" value={form.guardian.relation} onChange={e => setNestedField('guardian', 'relation', e.target.value)} placeholder="e.g. Uncle" />
                <Input label="Phone" value={form.guardian.phone} onChange={e => setNestedField('guardian', 'phone', e.target.value)} placeholder="Phone" />
                <Input label="Email" value={form.guardian.email} onChange={e => setNestedField('guardian', 'email', e.target.value)} placeholder="Email" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Applying for Class *" options={classes.map(c => ({ value: c._id, label: c.name }))} value={form.applyingForClass} onChange={e => setField('applyingForClass', e.target.value)} placeholder="Select class" />
            <Select label="Academic Session *" options={years.map(y => ({ value: y._id, label: y.name }))} value={form.academicSession} onChange={e => setField('academicSession', e.target.value)} placeholder="Select session" />
            <Input label="Previous School" value={form.previousSchool} onChange={e => setField('previousSchool', e.target.value)} placeholder="Previous school name" />
            <Input label="Previous Class" value={form.previousClass} onChange={e => setField('previousClass', e.target.value)} placeholder="Previous class" />
          </div>
        );
      default: return null;
    }
  };

  /* ──────────────────────── Render ──────────────────────── */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Manage admission applications through the enrollment workflow"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-2" /> New Application
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter size={14} />
          <span>Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${!statusFilter ? 'bg-forest text-white' : 'bg-surface text-secondary hover:bg-sage-soft'}`}
            onClick={() => { setStatusFilter(''); setPage(1); setLoading(true); }}
          >
            All
          </button>
          {WORKFLOW_STATUSES.map(ws => (
            <button
              key={ws.value}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${statusFilter === ws.value ? 'bg-forest text-white' : 'bg-surface text-secondary hover:bg-sage-soft'}`}
              onClick={() => { setStatusFilter(ws.value); setPage(1); setLoading(true); }}
            >
              {ws.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={p => { setLoading(true); setPage(p); }}
        onSearch={s => { setLoading(true); setSearch(s); setPage(1); }}
        searchPlaceholder="Search by applicant name or application no..."
      />

      {/* ── Create Application Modal (Multi-step) ── */}
      <Modal isOpen={createOpen} onClose={resetCreateForm} title="New Admission Application" size="xl">
        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {formStepTitles.map((title, i) => (
            <div key={title} className="flex items-center">
              <button
                onClick={() => setFormStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${formStep === i ? 'bg-forest text-white' : formStep > i ? 'bg-sage-soft text-forest' : 'text-muted'}`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${formStep === i ? 'bg-white/20' : formStep > i ? 'bg-forest text-white' : 'bg-surface'}`}>
                  {formStep > i ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{title}</span>
              </button>
              {i < formStepTitles.length - 1 && <ChevronRight size={14} className="mx-1 text-muted" />}
            </div>
          ))}
        </div>

        {renderFormStep()}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={formStep > 0 ? () => setFormStep(s => s - 1) : resetCreateForm}>
            {formStep > 0 ? '← Back' : 'Cancel'}
          </Button>
          <div className="flex gap-3">
            {formStep < 2 ? (
              <Button onClick={() => setFormStep(s => s + 1)}>
                Next <ArrowRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreate} loading={createSaving}>
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Detail View Modal ── */}
      <Modal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedAdmission(null); }} title={`Application — ${selectedAdmission?.applicationNo || ''}`} size="xl">
        {detailLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-sage-soft rounded-lg animate-pulse" />)}
          </div>
        ) : selectedAdmission && (
          <div className="space-y-6">
            {/* Workflow Progress */}
            <WorkflowProgress status={selectedAdmission.workflowStatus} />

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <Badge color={statusColorMap[selectedAdmission.workflowStatus] || 'gray'}>
                {statusLabelMap[selectedAdmission.workflowStatus] || selectedAdmission.workflowStatus}
              </Badge>
              {selectedAdmission.studentId && (
                <Badge color="success">
                  Student ID: {selectedAdmission.studentId.admissionNo} | Roll #{selectedAdmission.studentId.rollNo}
                </Badge>
              )}
            </div>

            {/* Student Info */}
            <Card>
              <h3 className="text-sm font-semibold text-deep mb-3">Student Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted">Name:</span> <span className="font-medium text-deep">{selectedAdmission.applicantName}</span></div>
                <div><span className="text-muted">DOB:</span> {selectedAdmission.dateOfBirth ? new Date(selectedAdmission.dateOfBirth).toLocaleDateString('en-IN') : '—'}</div>
                <div><span className="text-muted">Gender:</span> <span className="capitalize">{selectedAdmission.gender}</span></div>
                {selectedAdmission.bloodGroup && <div><span className="text-muted">Blood Group:</span> {selectedAdmission.bloodGroup}</div>}
                {selectedAdmission.aadhaarId && <div><span className="text-muted">Aadhaar:</span> {selectedAdmission.aadhaarId}</div>}
                {selectedAdmission.address && <div className="col-span-2"><span className="text-muted">Address:</span> {[selectedAdmission.address, selectedAdmission.city, selectedAdmission.state, selectedAdmission.pincode].filter(Boolean).join(', ')}</div>}
              </div>
            </Card>

            {/* Parent Info */}
            <Card>
              <h3 className="text-sm font-semibold text-deep mb-3">Parent / Guardian</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {selectedAdmission.father?.name && (
                  <div className="border border-border rounded-lg p-3">
                    <span className="text-xs font-semibold text-muted uppercase">Father</span>
                    <div className="mt-1 font-medium text-deep">{selectedAdmission.father.name}</div>
                    {selectedAdmission.father.phone && <div className="text-muted">{selectedAdmission.father.phone}</div>}
                  </div>
                )}
                {selectedAdmission.mother?.name && (
                  <div className="border border-border rounded-lg p-3">
                    <span className="text-xs font-semibold text-muted uppercase">Mother</span>
                    <div className="mt-1 font-medium text-deep">{selectedAdmission.mother.name}</div>
                    {selectedAdmission.mother.phone && <div className="text-muted">{selectedAdmission.mother.phone}</div>}
                  </div>
                )}
              </div>
            </Card>

            {/* Academic */}
            <Card>
              <h3 className="text-sm font-semibold text-deep mb-3">Academic Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted">Applying for:</span> <span className="font-medium">{selectedAdmission.applyingForClass?.name || '—'}</span></div>
                <div><span className="text-muted">Session:</span> {selectedAdmission.academicSession?.name || '—'}</div>
                {selectedAdmission.previousSchool && <div><span className="text-muted">Prev School:</span> {selectedAdmission.previousSchool}</div>}
                {selectedAdmission.assignedClass && <div><span className="text-muted">Assigned Class:</span> <span className="font-medium text-forest">{selectedAdmission.assignedClass?.name}</span></div>}
                {selectedAdmission.assignedSection && <div><span className="text-muted">Assigned Section:</span> <span className="font-medium text-forest">{selectedAdmission.assignedSection?.name}</span></div>}
              </div>
            </Card>

            {/* Documents */}
            {selectedAdmission.documents?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-deep mb-3">Documents</h3>
                <div className="space-y-2">
                  {selectedAdmission.documents.map((doc, i) => (
                    <div key={doc._id || i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-muted" />
                        <div>
                          <div className="text-sm font-medium text-deep">{doc.name}</div>
                          <div className="text-xs text-muted">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={doc.status === 'verified' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'}>
                          {doc.status}
                        </Badge>
                        {doc.status !== 'verified' && doc.status !== 'rejected' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => onVerifyDoc(doc)}>
                              <CheckCircle2 size={14} className="text-success" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onRejectDoc(doc)}>
                              <XCircle size={14} className="text-danger" />
                            </Button>
                          </>
                        )}
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <span className="text-xs text-danger">{doc.rejectionReason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Fee Info */}
            {selectedAdmission.feeStructure && (
              <Card>
                <h3 className="text-sm font-semibold text-deep mb-3">Fee Details</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-muted">Fee Structure:</span> <span className="font-medium">{selectedAdmission.feeStructure.name}</span></div>
                  <div><span className="text-muted">Total Amount:</span> <span className="font-semibold">₹{selectedAdmission.feeStructure.totalAmount?.toLocaleString('en-IN')}</span></div>
                  {selectedAdmission.feeDiscount?.value > 0 && (
                    <div><span className="text-muted">Discount:</span> <span className="text-success font-medium">₹{selectedAdmission.feeDiscount.value} ({selectedAdmission.feeDiscount.name})</span></div>
                  )}
                  {selectedAdmission.feeTransactions?.length > 0 && (
                    <>
                      <div><span className="text-muted">Paid:</span> <span className="font-semibold text-forest">₹{selectedAdmission.feeTransactions[0].paidAmount?.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-muted">Balance:</span> <span className={`font-semibold ${selectedAdmission.feeTransactions[0].balance > 0 ? 'text-danger' : 'text-forest'}`}>₹{selectedAdmission.feeTransactions[0].balance?.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-muted">Payment Status:</span> <Badge color={selectedAdmission.feeTransactions[0].status === 'paid' ? 'success' : 'warning'}>{selectedAdmission.feeTransactions[0].status}</Badge></div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* History Timeline */}
            {selectedAdmission.history?.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-deep mb-3">Audit Trail</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {[...selectedAdmission.history].reverse().map((h, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-forest mt-1.5 shrink-0" />
                      <div>
                        <div className="font-medium text-deep">
                          {statusLabelMap[h.status] || h.status}
                          <span className="text-muted font-normal ml-2">{h.updatedAt ? new Date(h.updatedAt).toLocaleString('en-IN') : ''}</span>
                        </div>
                        {h.remarks && <div className="text-muted text-xs mt-0.5">{h.remarks}</div>}
                        {h.updatedBy && <div className="text-xs text-secondary">by {h.updatedBy.firstName || h.updatedBy.email || 'System'}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            {selectedAdmission.workflowStatus !== 'student_created' && selectedAdmission.workflowStatus !== 'rejected' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {getAvailableActions().map((act, i) => {
                  const Icon = act.icon;
                  return (
                    <Button
                      key={i}
                      variant={act.variant}
                      size="sm"
                      onClick={() => {
                        if (act.action === 'allocate') setActionModal('allocate');
                        else if (act.action === 'fee') setActionModal('fee');
                        else if (act.action === 'payment') setActionModal('payment');
                        else if (act.action === 'confirm') handleConfirmAdmission();
                        else handleStatusUpdate(act.status);
                      }}
                    >
                      <Icon size={14} className="mr-1" /> {act.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Allocate Class Modal ── */}
      <Modal isOpen={actionModal === 'allocate'} onClose={() => setActionModal(null)} title="Allocate Class & Section">
        <div className="space-y-4">
          <Select
            label="Class *"
            options={classes.map(c => ({ value: c._id, label: c.name }))}
            value={allocateForm.assignedClassId}
            onChange={e => setAllocateForm(f => ({ ...f, assignedClassId: e.target.value, assignedSectionId: '' }))}
            placeholder="Select class"
          />
          <Select
            label="Section *"
            options={sections.map(s => ({ value: s._id, label: `${s.name}${s.roomNo ? ` (Room ${s.roomNo})` : ''}${s.strength > 0 ? ` — Capacity: ${s.strength}` : ''}` }))}
            value={allocateForm.assignedSectionId}
            onChange={e => setAllocateForm(f => ({ ...f, assignedSectionId: e.target.value }))}
            placeholder={allocateForm.assignedClassId ? 'Select section' : 'Select a class first'}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button onClick={handleAllocate} loading={actionSaving}>Allocate</Button>
          </div>
        </div>
      </Modal>

      {/* ── Assign Fee Modal ── */}
      <Modal isOpen={actionModal === 'fee'} onClose={() => setActionModal(null)} title="Assign Fee Structure">
        <div className="space-y-4">
          <Select
            label="Fee Structure *"
            options={feeStructures.map(f => ({ value: f._id, label: `${f.name} — ₹${f.totalAmount?.toLocaleString('en-IN') || 0}` }))}
            value={feeForm.feeStructureId}
            onChange={e => setFeeForm(f => ({ ...f, feeStructureId: e.target.value }))}
            placeholder="Select fee structure"
          />
          <Input label="Discount / Concession Name" value={feeForm.discountName} onChange={e => setFeeForm(f => ({ ...f, discountName: e.target.value }))} placeholder="e.g. Sibling discount, Staff ward" />
          <Input label="Discount Amount (₹)" type="number" value={feeForm.discountValue} onChange={e => setFeeForm(f => ({ ...f, discountValue: e.target.value }))} placeholder="0" />

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button onClick={handleAssignFee} loading={actionSaving}>Assign Fee</Button>
          </div>
        </div>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal isOpen={actionModal === 'payment'} onClose={() => setActionModal(null)} title="Record Manual Payment">
        <div className="space-y-4">
          {selectedAdmission?.feeStructure && (
            <div className="bg-sage-soft border border-border rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Total Fee:</span>
                <span className="font-semibold">₹{selectedAdmission.feeStructure.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              {selectedAdmission.feeDiscount?.value > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Discount:</span>
                  <span className="text-success">-₹{selectedAdmission.feeDiscount.value}</span>
                </div>
              )}
              {selectedAdmission.feeTransactions?.[0] && (
                <>
                  <div className="flex justify-between"><span className="text-muted">Already Paid:</span><span>₹{selectedAdmission.feeTransactions[0].paidAmount?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between border-t border-border mt-1 pt-1"><span className="text-muted font-medium">Balance Due:</span><span className="font-bold text-danger">₹{selectedAdmission.feeTransactions[0].balance?.toLocaleString('en-IN')}</span></div>
                </>
              )}
            </div>
          )}
          <Input label="Amount Paid (₹) *" type="number" value={paymentForm.amountPaid} onChange={e => setPaymentForm(f => ({ ...f, amountPaid: e.target.value }))} placeholder="Enter amount" />
          <Select
            label="Payment Method *"
            options={[{value:'cash',label:'Cash'},{value:'cheque',label:'Cheque'},{value:'bank_transfer',label:'Bank Transfer'},{value:'other',label:'Other'}]}
            value={paymentForm.paymentMethod}
            onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))}
          />
          <Input label="Reference / Receipt No" value={paymentForm.referenceNo} onChange={e => setPaymentForm(f => ({ ...f, referenceNo: e.target.value }))} placeholder="Optional" />
          <Input label="Payment Date" type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} />
          <Input label="Notes" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button onClick={handleRecordPayment} loading={actionSaving}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
