import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus, Eye, FileCheck, CheckCircle2, XCircle, UserPlus,
  Building2, CreditCard, Receipt, ArrowRight, Upload, Clock,
  ChevronRight, Filter, RotateCcw, FileText, X, Trash2,
  Users, CheckCheck, Sparkles, MoreVertical, Search, Calendar as CalendarIcon,
  ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { admissionApi } from '../../api/admission.api';
import { academicApi } from '../../api/academic.api';
import { feeApi } from '../../api/fee.api';
import UserAvatar from '../../components/ui/UserAvatar';

/* ──────────────────────── Constants ──────────────────────── */

const WORKFLOW_STATUS_PILLS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'document_verification', label: 'Doc Verification' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'class_allocated', label: 'Class Allocated' },
  { value: 'fee_assigned', label: 'Fee Assigned' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'student_created', label: 'Enrolled' },
];

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

// Format relative time helper
function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Get applicant initials helper
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'AP';
}

export default function Admissions() {
  // Main list state
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);

  // Filters state matching visual reference
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Stats KPI state
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    enrolled: 0,
    rejected: 0,
  });

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

  // Action Dropdown state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ──────────────────────── Data Fetching ──────────────────────── */

  useEffect(() => {
    Promise.all([
      academicApi.getClasses({ limit: 100 }).catch(() => ({ data: [] })),
      academicApi.getAcademicYears({ limit: 100 }).catch(() => ({ data: [] })),
      feeApi.getStructures({ limit: 100 }).catch(() => ({ data: [] })),
    ]).then(([classRes, yearRes, feeRes]) => {
      setClasses(classRes.data || []);
      setYears(yearRes.data || []);
      setFeeStructures(feeRes.data || []);
      const currentYear = yearRes.data?.find(y => y.isCurrent);
      if (currentYear) {
        setForm(f => ({ ...f, academicSession: currentYear._id }));
      }
    });
  }, []);

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await admissionApi.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, reload]);

  // Load Admissions List
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const params = {
          page,
          limit: 10,
          search: search || undefined,
          sort: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
        };
        if (statusFilter && statusFilter !== 'all') {
          params.workflowStatus = statusFilter;
        }
        if (classFilter) {
          params.applyingForClass = classFilter;
        }
        if (genderFilter && genderFilter !== 'all') {
          params.gender = genderFilter;
        }

        // Date filter handling
        if (dateRangeFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          params.startDate = today;
          params.endDate = today;
        } else if (dateRangeFilter === 'this_week') {
          const now = new Date();
          const firstDay = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
          params.startDate = firstDay;
        } else if (dateRangeFilter === 'this_month') {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          params.startDate = firstDay;
        }

        const res = await admissionApi.getAll(params);
        if (!active) return;
        setData(res.data || []);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load admissions');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, statusFilter, classFilter, genderFilter, dateRangeFilter, sortField, sortOrder]);

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

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('');
    setGenderFilter('all');
    setDateRangeFilter('');
    setPage(1);
    setLoading(true);
  };

  const countActiveFilters = () => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (classFilter) count++;
    if (genderFilter && genderFilter !== 'all') count++;
    if (dateRangeFilter) count++;
    if (search) count++;
    return count;
  };

  /* ──────────────────────── Sorting ──────────────────────── */

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  /* ──────────────────────── Status Badge Rendering ──────────────────────── */

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'student_created':
      case 'admitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Enrolled
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Partially Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case 'class_allocated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Class Allocated
          </span>
        );
      case 'fee_assigned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            Fee Assigned
          </span>
        );
      case 'payment_pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Payment Pending
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case 'document_verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Doc Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Submitted
          </span>
        );
    }
  };

  /* ──────────────────────── Gender Icon Rendering ──────────────────────── */

  const renderGender = (gender) => {
    if (gender === 'female') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-pink-600 font-medium">
          <span className="text-pink-500 font-bold">♀</span> Female
        </span>
      );
    }
    if (gender === 'male') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
          <span className="text-blue-500 font-bold">♂</span> Male
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-medium">
        <span>⚧</span> {gender || 'Other'}
      </span>
    );
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

  /* ──────────────────────── Detail View & Workflow Actions ──────────────────────── */

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
    } catch {}
  };

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
      toast.success(`Status updated`);
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to update status');
    }
  };

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

  const [resendingEmail, setResendingEmail] = useState(false);

  const handleConfirmAdmission = async () => {
    const result = await Swal.fire({
      title: 'Confirm Admission',
      text: 'This will create a Student record, generate a Student ID and Roll Number, create the Parent Portal account, and send an activation email via Brevo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm Admission',
      confirmButtonColor: '#6C5CE7',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await admissionApi.confirmAdmission(selectedAdmission._id);
      const student = res.data?.student;
      const emailSent = res.data?.activationEmailSent;
      if (emailSent) {
        toast.success(`Admission confirmed! Student ID: ${student?.admissionNo}. Activation email sent to parent.`);
      } else {
        toast.success(`Admission confirmed! Student ID: ${student?.admissionNo}. (Note: Activation email failed, you can resend it).`);
      }
      await refreshDetail();
      triggerReload();
    } catch (e) {
      toast.error(e?.message || 'Failed to confirm admission');
    }
  };

  const handleResendActivationEmail = async () => {
    if (!selectedAdmission?._id) return;
    setResendingEmail(true);
    try {
      const res = await admissionApi.resendActivationEmail(selectedAdmission._id);
      toast.success(res?.message || 'Activation email sent successfully to parent');
    } catch (e) {
      toast.error(e?.message || 'Failed to resend activation email');
    } finally {
      setResendingEmail(false);
    }
  };


  const getPercentage = (count) => {
    if (!stats.total || stats.total === 0) return '0.00%';
    return `${((count / stats.total) * 100).toFixed(2)}%`;
  };

  /* ──────────────────────── Create Form Step Renderer ──────────────────────── */

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
          <div className="space-y-5">
            <Input label="Primary Contact Phone *" value={form.parentPhone} onChange={e => setField('parentPhone', e.target.value)} placeholder="+91 90000 00000" />
            <Input label="Primary Contact Email" type="email" value={form.parentEmail} onChange={e => setField('parentEmail', e.target.value)} placeholder="email@example.com" />

            <div className="border border-border rounded-xl p-3.5 space-y-3 bg-surface/30">
              <h4 className="text-xs font-bold text-deep flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-forest" /> Father Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.father.name} onChange={e => setNestedField('father', 'name', e.target.value)} placeholder="Father's name" />
                <Input label="Phone" value={form.father.phone} onChange={e => setNestedField('father', 'phone', e.target.value)} placeholder="Phone" />
                <Input label="Email" value={form.father.email} onChange={e => setNestedField('father', 'email', e.target.value)} placeholder="Email" />
                <Input label="Occupation" value={form.father.occupation} onChange={e => setNestedField('father', 'occupation', e.target.value)} placeholder="Occupation" />
              </div>
            </div>

            <div className="border border-border rounded-xl p-3.5 space-y-3 bg-surface/30">
              <h4 className="text-xs font-bold text-deep flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-forest" /> Mother Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={form.mother.name} onChange={e => setNestedField('mother', 'name', e.target.value)} placeholder="Mother's name" />
                <Input label="Phone" value={form.mother.phone} onChange={e => setNestedField('mother', 'phone', e.target.value)} placeholder="Phone" />
                <Input label="Email" value={form.mother.email} onChange={e => setNestedField('mother', 'email', e.target.value)} placeholder="Email" />
                <Input label="Occupation" value={form.mother.occupation} onChange={e => setNestedField('mother', 'occupation', e.target.value)} placeholder="Occupation" />
              </div>
            </div>

            <div className="border border-border rounded-xl p-3.5 space-y-3 bg-surface/30">
              <h4 className="text-xs font-bold text-deep flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-forest" /> Guardian (if different)
              </h4>
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

  /* ──────────────────────── Render ──────────────────────── */

  return (
    <div className="space-y-5 pb-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-deep tracking-tight">Admissions</h1>
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            Manage admission applications through the enrollment workflow.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus size={15} /> New Application
          </Button>
        </div>
      </div>

      {/* ── Row 1: Top 6 Summary KPI Cards (Exact match to reference) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Applications */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-forest-soft text-forest flex items-center justify-center mb-2">
            <Users size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Total Applications</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.total}
          </p>
          <p className="text-[10px] text-muted mt-1">This Academic Year</p>
        </div>

        {/* Submitted */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <FileText size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Submitted</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.submitted}
          </p>
          <p className="text-[10px] text-muted mt-1">{getPercentage(stats.submitted)}</p>
        </div>

        {/* Under Review */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Sparkles size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Under Review</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.underReview}
          </p>
          <p className="text-[10px] text-muted mt-1">{getPercentage(stats.underReview)}</p>
        </div>

        {/* Approved */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCheck size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Approved</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.approved}
          </p>
          <p className="text-[10px] text-muted mt-1">{getPercentage(stats.approved)}</p>
        </div>

        {/* Enrolled */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
            <UserPlus size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Enrolled</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.enrolled}
          </p>
          <p className="text-[10px] text-muted mt-1">{getPercentage(stats.enrolled)}</p>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs hover:shadow-card transition-shadow">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <XCircle size={16} />
          </div>
          <p className="text-[11px] font-semibold text-secondary">Rejected</p>
          <p className="text-xl sm:text-2xl font-bold text-deep leading-tight mt-0.5">
            {stats.rejected}
          </p>
          <p className="text-[10px] text-muted mt-1">{getPercentage(stats.rejected)}</p>
        </div>
      </div>

      {/* ── Row 2: Comprehensive Filter Toolbar ── */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by applicant name or application no..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="font-semibold text-muted text-[11px]">Class</span>
              <select
                value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Gender Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="font-semibold text-muted text-[11px]">Gender</span>
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="all">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="font-semibold text-muted text-[11px]">Date Range</span>
              <div className="relative">
                <select
                  value={dateRangeFilter}
                  onChange={(e) => { setDateRangeFilter(e.target.value); setPage(1); }}
                  className="pl-7 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                >
                  <option value="">Select Range</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
                <CalendarIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-secondary"
            >
              <RotateCcw size={13} className="mr-1 text-muted" /> Reset
            </Button>

            {/* Filters Count Button */}
            <Button
              size="sm"
              variant="primary"
              className="text-xs gap-1.5"
            >
              <Filter size={13} /> Filters
              {countActiveFilters() > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
                  {countActiveFilters()}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Status Horizontal Filter Pills (Exact Match) */}
        <div className="pt-2 border-t border-border/70 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-secondary text-xs mr-1">Filter by status:</span>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {WORKFLOW_STATUS_PILLS.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  onClick={() => { setStatusFilter(pill.value); setPage(1); }}
                  className={`px-3 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-forest text-white font-semibold shadow-2xs'
                      : 'bg-white border border-border text-secondary hover:bg-surface hover:text-deep font-medium'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: High-Density Data Table ── */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/70">
                <th
                  onClick={() => handleSort('applicationNo')}
                  className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>APPLICATION NO.</span>
                    <SortIcon field="applicationNo" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('applicantName')}
                  className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>APPLICANT</span>
                    <SortIcon field="applicantName" />
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                  GENDER
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                  CLASS
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                  STATUS
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:text-deep select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>APPLIED ON</span>
                    <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-white">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-3.5 py-3">
                      <div className="h-5 bg-surface rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-muted">
                    No admission applications found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const guardianName = row.father?.name
                    ? `${row.father.name} (Father)`
                    : row.mother?.name
                    ? `${row.mother.name} (Mother)`
                    : row.guardian?.name
                    ? `${row.guardian.name} (Guardian)`
                    : '';

                  const appliedDate = row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';

                  const relativeTime = formatRelativeTime(row.createdAt);

                  return (
                    <tr key={row._id} className="hover:bg-surface/50 transition-colors">
                      {/* Application No */}
                      <td className="px-3.5 py-2.5 font-bold text-xs text-deep font-mono">
                        {row.applicationNo}
                      </td>

                      {/* Applicant */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            type="student"
                            gender={row.gender}
                            id={row._id}
                            admissionNo={row.applicationNo}
                            name={row.applicantName}
                            size="sm"
                            className="shrink-0 ring-1 ring-border/50"
                          />
                          <div>
                            <p className="font-bold text-xs text-deep leading-tight">
                              {row.applicantName}
                            </p>
                            {guardianName && (
                              <p className="text-[11px] text-muted leading-tight mt-0.5">
                                {guardianName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="px-3.5 py-2.5">
                        {renderGender(row.gender)}
                      </td>

                      {/* Class */}
                      <td className="px-3.5 py-2.5 text-xs text-secondary font-medium">
                        {row.applyingForClass?.name || classMap[row.applyingForClass] || '—'}
                      </td>

                      {/* Status Badge */}
                      <td className="px-3.5 py-2.5">
                        {renderStatusBadge(row.workflowStatus)}
                      </td>

                      {/* Applied On */}
                      <td className="px-3.5 py-2.5">
                        <p className="font-medium text-deep text-xs leading-tight">{appliedDate}</p>
                        <p className="text-[11px] text-muted leading-tight mt-0.5">{relativeTime}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-2.5 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => openDetail(row)}
                            className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors"
                            title="View application details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* 3-Dots Dropdown Trigger */}
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === row._id ? null : row._id)}
                            className="p-1.5 text-muted hover:text-deep hover:bg-surface border border-border rounded-lg transition-colors"
                            title="More actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>

                        {/* Action Dropdown Menu */}
                        {activeMenuId === row._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-4 top-10 w-44 bg-white border border-border rounded-xl shadow-dropdown z-40 py-1 text-left animate-scale-in"
                          >
                            <button
                              onClick={() => { setActiveMenuId(null); openDetail(row); }}
                              className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2"
                            >
                              <Eye size={13} className="text-muted" /> View Details
                            </button>

                            {row.workflowStatus !== 'student_created' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedAdmission(row);
                                    setAllocateForm({ assignedClassId: row.applyingForClass?._id || '', assignedSectionId: '' });
                                    setActionModal('allocate');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2"
                                >
                                  <Building2 size={13} className="text-muted" /> Allocate Class
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedAdmission(row);
                                    setActionModal('fee');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2"
                                >
                                  <CreditCard size={13} className="text-muted" /> Assign Fee
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedAdmission(row);
                                    setActionModal('payment');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-deep hover:bg-surface flex items-center gap-2"
                                >
                                  <Receipt size={13} className="text-muted" /> Record Payment
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {meta && (
          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-surface/30">
            <span className="text-xs text-muted">
              Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !meta.hasPrevPage}
                onClick={() => setPage(meta.page - 1)}
                className="p-1 px-2 text-xs"
              >
                <ChevronLeft size={14} />
              </Button>

              {/* Page Numbers */}
              {Array.from({ length: meta.totalPages || 1 }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${
                    meta.page === pageNum
                      ? 'bg-forest text-white'
                      : 'bg-white border border-border text-secondary hover:bg-surface'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={loading || !meta.hasNextPage}
                onClick={() => setPage(meta.page + 1)}
                className="p-1 px-2 text-xs"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Application Modal (Multi-step) ── */}
      <Modal isOpen={createOpen} onClose={resetCreateForm} title="New Admission Application" size="xl">
        <div className="flex items-center justify-between mb-5 px-2">
          {formStepTitles.map((title, i) => (
            <div key={title} className="flex items-center">
              <button
                onClick={() => setFormStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${formStep === i ? 'bg-forest text-white font-semibold' : formStep > i ? 'bg-forest-soft text-forest' : 'text-muted'}`}
              >
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${formStep === i ? 'bg-white/20 text-white' : formStep > i ? 'bg-forest text-white' : 'bg-surface'}`}>
                  {formStep > i ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{title}</span>
              </button>
              {i < formStepTitles.length - 1 && <ChevronRight size={13} className="mx-1 text-muted" />}
            </div>
          ))}
        </div>

        {renderFormStep()}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={formStep > 0 ? () => setFormStep(s => s - 1) : resetCreateForm}>
            {formStep > 0 ? '← Back' : 'Cancel'}
          </Button>
          <div className="flex gap-2">
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
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface rounded-lg animate-pulse" />)}
          </div>
        ) : selectedAdmission && (
          <div className="space-y-5">
            {/* Workflow Progress */}
            <WorkflowProgress status={selectedAdmission.workflowStatus} />

            {/* Status Badge & Student ID */}
            <div className="flex items-center gap-2.5">
              {renderStatusBadge(selectedAdmission.workflowStatus)}
              {selectedAdmission.studentId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Student ID: {selectedAdmission.studentId.admissionNo} | Roll #{selectedAdmission.studentId.rollNo}
                </span>
              )}
            </div>

            {/* Student Info */}
            <Card>
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-2.5">Student Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                <div><span className="text-muted">Name:</span> <span className="font-bold text-deep">{selectedAdmission.applicantName}</span></div>
                <div><span className="text-muted">DOB:</span> {selectedAdmission.dateOfBirth ? new Date(selectedAdmission.dateOfBirth).toLocaleDateString('en-IN') : '—'}</div>
                <div><span className="text-muted">Gender:</span> <span className="capitalize">{selectedAdmission.gender}</span></div>
                {selectedAdmission.bloodGroup && <div><span className="text-muted">Blood Group:</span> {selectedAdmission.bloodGroup}</div>}
                {selectedAdmission.aadhaarId && <div><span className="text-muted">Aadhaar:</span> {selectedAdmission.aadhaarId}</div>}
                {selectedAdmission.address && <div className="col-span-2"><span className="text-muted">Address:</span> {[selectedAdmission.address, selectedAdmission.city, selectedAdmission.state, selectedAdmission.pincode].filter(Boolean).join(', ')}</div>}
              </div>
            </Card>

            {/* Parent Info */}
            <Card>
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-2.5">Parent / Guardian</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedAdmission.father?.name && (
                  <div className="border border-border rounded-lg p-2.5 bg-surface/30">
                    <span className="text-[10px] font-bold text-muted uppercase">Father</span>
                    <div className="mt-0.5 font-bold text-deep">{selectedAdmission.father.name}</div>
                    {selectedAdmission.father.phone && <div className="text-muted">{selectedAdmission.father.phone}</div>}
                  </div>
                )}
                {selectedAdmission.mother?.name && (
                  <div className="border border-border rounded-lg p-2.5 bg-surface/30">
                    <span className="text-[10px] font-bold text-muted uppercase">Mother</span>
                    <div className="mt-0.5 font-bold text-deep">{selectedAdmission.mother.name}</div>
                    {selectedAdmission.mother.phone && <div className="text-muted">{selectedAdmission.mother.phone}</div>}
                  </div>
                )}
              </div>
            </Card>

            {/* Academic */}
            <Card>
              <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-2.5">Academic Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                <div><span className="text-muted">Applying for:</span> <span className="font-semibold text-deep">{selectedAdmission.applyingForClass?.name || '—'}</span></div>
                <div><span className="text-muted">Session:</span> {selectedAdmission.academicSession?.name || '—'}</div>
                {selectedAdmission.previousSchool && <div><span className="text-muted">Prev School:</span> {selectedAdmission.previousSchool}</div>}
                {selectedAdmission.assignedClass && <div><span className="text-muted">Assigned Class:</span> <span className="font-bold text-forest">{selectedAdmission.assignedClass?.name}</span></div>}
                {selectedAdmission.assignedSection && <div><span className="text-muted">Assigned Section:</span> <span className="font-bold text-forest">{selectedAdmission.assignedSection?.name}</span></div>}
              </div>
            </Card>

            {/* Documents */}
            {selectedAdmission.documents?.length > 0 && (
              <Card>
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-2.5">Documents</h3>
                <div className="space-y-2">
                  {selectedAdmission.documents.map((doc, i) => (
                    <div key={doc._id || i} className="flex items-center justify-between p-2.5 border border-border rounded-lg bg-surface/20 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-muted" />
                        <div>
                          <div className="font-semibold text-deep">{doc.name}</div>
                          <div className="text-[10px] text-muted">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={doc.status === 'verified' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'}>
                          {doc.status}
                        </Badge>
                        {doc.status !== 'verified' && doc.status !== 'rejected' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => onVerifyDoc(doc)} className="p-1">
                              <CheckCircle2 size={13} className="text-success" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onRejectDoc(doc)} className="p-1">
                              <XCircle size={13} className="text-danger" />
                            </Button>
                          </>
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
                <h3 className="text-xs font-bold text-deep uppercase tracking-wider mb-2.5">Fee Details</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div><span className="text-muted">Fee Structure:</span> <span className="font-semibold text-deep">{selectedAdmission.feeStructure.name}</span></div>
                  <div><span className="text-muted">Total Amount:</span> <span className="font-bold text-deep">₹{selectedAdmission.feeStructure.totalAmount?.toLocaleString('en-IN')}</span></div>
                  {selectedAdmission.feeTransactions?.length > 0 && (
                    <>
                      <div><span className="text-muted">Paid:</span> <span className="font-bold text-forest">₹{selectedAdmission.feeTransactions[0].paidAmount?.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-muted">Balance:</span> <span className={`font-bold ${selectedAdmission.feeTransactions[0].balance > 0 ? 'text-danger' : 'text-forest'}`}>₹{selectedAdmission.feeTransactions[0].balance?.toLocaleString('en-IN')}</span></div>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* Workflow Action Steps */}
            {selectedAdmission.workflowStatus !== 'student_created' && selectedAdmission.workflowStatus !== 'rejected' && (
              <div className="flex flex-wrap gap-2.5 pt-3 border-t border-border justify-between items-center w-full">
                <Button variant="outline" size="sm" onClick={() => handleStatusUpdate('rejected')} className="text-danger hover:bg-danger-light">
                  Reject Application
                </Button>

                <div className="flex items-center gap-2">
                  {selectedAdmission.workflowStatus === 'submitted' && (
                    <Button size="sm" onClick={() => handleStatusUpdate('document_verification')}>
                      Verify Documents →
                    </Button>
                  )}
                  {selectedAdmission.workflowStatus === 'document_verification' && (
                    <Button size="sm" onClick={() => setActionModal('allocate')}>
                      Allocate Class & Section →
                    </Button>
                  )}
                  {selectedAdmission.workflowStatus === 'class_allocated' && (
                    <Button size="sm" onClick={() => setActionModal('fee')}>
                      Assign Fee Structure →
                    </Button>
                  )}
                  {(selectedAdmission.workflowStatus === 'fee_assigned' || selectedAdmission.workflowStatus === 'payment_pending') && (
                    <Button size="sm" onClick={() => setActionModal('payment')}>
                      Record Fee Payment →
                    </Button>
                  )}
                  {(selectedAdmission.workflowStatus === 'paid' || selectedAdmission.workflowStatus === 'partially_paid') && (
                    <Button size="sm" onClick={handleConfirmAdmission}>
                      Confirm Admission (Enroll) →
                    </Button>
                  )}
                  {selectedAdmission.workflowStatus === 'student_created' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      loading={resendingEmail}
                      onClick={handleResendActivationEmail}
                      className="border-emerald-500/50 text-emerald-700 hover:bg-emerald-50"
                    >
                      Resend Parent Activation Email
                    </Button>
                  )}
                </div>
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
          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="ghost" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button size="sm" onClick={handleAllocate} loading={actionSaving}>Allocate</Button>
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

          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="ghost" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button size="sm" onClick={handleAssignFee} loading={actionSaving}>Assign Fee</Button>
          </div>
        </div>
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal isOpen={actionModal === 'payment'} onClose={() => setActionModal(null)} title="Record Manual Payment">
        <div className="space-y-4">
          {selectedAdmission?.feeStructure && (
            <div className="bg-forest-soft border border-border rounded-lg p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Total Fee:</span>
                <span className="font-bold text-deep">₹{selectedAdmission.feeStructure.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              {selectedAdmission.feeDiscount?.value > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-muted">Discount:</span>
                  <span className="text-forest font-semibold">-₹{selectedAdmission.feeDiscount.value}</span>
                </div>
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
          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="ghost" size="sm" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button size="sm" onClick={handleRecordPayment} loading={actionSaving}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
