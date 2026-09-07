import { useEffect, useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Clock,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  DollarSign,
  Bell,
  Eye,
  MessageSquare,
  Award,
  FileText,
  Palette,
  Layers,
  Volume2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Badge from '../../components/ui/Badge';
import SoundSettings from '../../components/ui/SoundSettings';
import { settingApi } from '../../api/setting.api';

const TABS = [
  { id: 'general', label: 'School Info', icon: Building2, desc: 'School profile, address, timezone & currency' },
  { id: 'timings', label: 'Timings & Hours', icon: Clock, desc: 'School schedule, period lengths & working days' },
  { id: 'academic', label: 'Academics & Grading', icon: GraduationCap, desc: 'Grading scale, passing marks & teacher limits' },
  { id: 'attendance', label: 'Attendance Rules', icon: ClipboardCheck, desc: 'Thresholds, late penalties & edit permissions' },
  { id: 'leave', label: 'Leave Policies', icon: Calendar, desc: 'Student & teacher leave duration, approval & certificates' },
  { id: 'fees', label: 'Fee Rules', icon: DollarSign, desc: 'Due dates, late fee charges, grace days & receipts' },
  { id: 'notifications', label: 'Notification Matrix', icon: Bell, desc: 'Trigger rules per event and recipient role' },
  { id: 'visibility', label: 'Access & Visibility', icon: Eye, desc: 'Parent portal modules & teacher privileges' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, desc: 'Notice rules, complaints & meeting bookings' },
  { id: 'recognition', label: 'Recognition & Points', icon: Award, desc: 'Reward categories, point values & visibility' },
  { id: 'documents', label: 'Documents', icon: FileText, desc: 'Allowed file formats, size limits & document checklists' },
  { id: 'branding', label: 'Branding & Theme', icon: Palette, desc: 'School logo, colors & report card / receipt headers' },
  { id: 'features', label: 'Features & Modules', icon: Layers, desc: 'Enable or disable functional modules across Instique' },
  { id: 'sound', label: 'Sound & UI Effects', icon: Volume2, desc: 'Sound effects and audio feedback preferences' },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 0, label: 'Sun', full: 'Sunday' },
];

const NOTIFICATION_EVENTS = [
  { key: 'studentAbsent', label: 'Student Absent Alert', desc: 'When a student is recorded absent during attendance' },
  { key: 'leaveRequested', label: 'Leave Request Submitted', desc: 'When a parent or teacher requests a leave' },
  { key: 'leaveApproved', label: 'Leave Approved', desc: 'When leave request is approved by approver' },
  { key: 'leaveRejected', label: 'Leave Rejected', desc: 'When leave request is rejected' },
  { key: 'homeworkAssigned', label: 'New Homework Assigned', desc: 'When teacher publishes new homework assignment' },
  { key: 'feeDue', label: 'Fee Payment Reminder', desc: 'Upcoming fee invoice due date reminder' },
  { key: 'feeOverdue', label: 'Fee Overdue Alert', desc: 'Notice after fee due date passes' },
  { key: 'examPublished', label: 'Exam Results Published', desc: 'When exam marks and report cards are released' },
  { key: 'noticePublished', label: 'Circular / Notice Broadcast', desc: 'When school publishes an official bulletin notice' },
  { key: 'eventPublished', label: 'Calendar Event Published', desc: 'When school calendar event is announced' },
];

const MODULE_DEFINITIONS = [
  { key: 'students', label: 'Students Directory', category: 'Academics' },
  { key: 'teachers', label: 'Teachers Directory', category: 'Academics' },
  { key: 'classes', label: 'Class & Section Management', category: 'Academics' },
  { key: 'syllabus', label: 'Syllabus Tracker', category: 'Academics' },
  { key: 'timetable', label: 'Timetable & Schedules', category: 'Academics' },
  { key: 'attendance', label: 'Daily Attendance', category: 'Academics' },
  { key: 'homework', label: 'Homework & Assignments', category: 'Academics' },
  { key: 'exams', label: 'Examinations', category: 'Examinations' },
  { key: 'marksEntry', label: 'Marks Entry', category: 'Examinations' },
  { key: 'leaderboard', label: 'Academic Leaderboard', category: 'Examinations' },
  { key: 'admissions', label: 'Admissions & Inquiries', category: 'Administration' },
  { key: 'fees', label: 'Fees & Invoicing', category: 'Administration' },
  { key: 'leaves', label: 'Leave Management', category: 'Administration' },
  { key: 'notices', label: 'Notices & Circulars', category: 'Administration' },
  { key: 'events', label: 'School Events Calendar', category: 'Communication' },
  { key: 'complaints', label: 'Complaints & Helpdesk', category: 'Communication' },
  { key: 'parentMeetings', label: 'Parent-Teacher Meetings', category: 'Communication' },
  { key: 'reports', label: 'Reports & Analytics', category: 'Reports' },
  { key: 'recognition', label: 'Student Recognition & Points', category: 'Engagement' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSettings, setInitialSettings] = useState(null);
  const [settings, setSettings] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await settingApi.get();
        const data = res.data?.data || res.data;
        if (active && data) {
          // Normalize features map if it was serialized as Map
          if (data.features && data.features.modules && data.features.modules instanceof Map) {
            data.features.modules = Object.fromEntries(data.features.modules);
          }
          setSettings(data);
          setInitialSettings(JSON.parse(JSON.stringify(data)));
        }
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load school settings');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const isDirty = useMemo(() => {
    if (!settings || !initialSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  const handleReset = () => {
    if (initialSettings) {
      setSettings(JSON.parse(JSON.stringify(initialSettings)));
      toast.success('Changes discarded');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingApi.update(settings);
      const updated = res.data?.data || res.data;
      setSettings(updated);
      setInitialSettings(JSON.parse(JSON.stringify(updated)));
      toast.success('Settings updated successfully');
    } catch (e) {
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Helper for deep setting
  const updateField = (path, value) => {
    setSettings((prev) => {
      const next = JSON.parse(JSON.stringify(prev || {}));
      const parts = path.split('.');
      let curr = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
      return next;
    });
  };

  // Bulletproof toggle helper that reliably flips booleans
  const handleToggleField = (path, val) => {
    let nextVal;
    if (typeof val === 'boolean') {
      nextVal = val;
    } else if (val && typeof val.target?.checked === 'boolean') {
      nextVal = val.target.checked;
    } else if (val && typeof val.checked === 'boolean') {
      nextVal = val.checked;
    } else {
      // Fallback: read current value from settings and invert
      const parts = path.split('.');
      let curr = settings;
      for (const p of parts) {
        curr = curr?.[p];
      }
      nextVal = !curr;
    }
    updateField(path, nextVal);
  };

  // Grading scale helpers
  const handleGradeChange = (index, key, val) => {
    const scale = [...(settings?.academic?.gradingScale || [])];
    scale[index] = { ...scale[index], [key]: key === 'minPercent' || key === 'maxPercent' || key === 'points' ? Number(val) : val };
    updateField('academic.gradingScale', scale);
  };

  const addGradeRow = () => {
    const scale = [...(settings?.academic?.gradingScale || [])];
    scale.push({ grade: 'New', minPercent: 0, maxPercent: 100, points: 1.0, status: 'Pass' });
    updateField('academic.gradingScale', scale);
  };

  const removeGradeRow = (index) => {
    const scale = (settings?.academic?.gradingScale || []).filter((_, i) => i !== index);
    updateField('academic.gradingScale', scale);
  };

  // Leave types helpers
  const handleLeaveTypeChange = (index, key, val) => {
    const types = [...(settings?.leave?.availableLeaveTypes || [])];
    const cleanVal = key === 'isPaid'
      ? (typeof val === 'boolean' ? val : val?.target?.checked ?? val?.checked ?? !types[index]?.[key])
      : (key === 'maxDaysPerYear' ? Number(val) : val);
    types[index] = { ...types[index], [key]: cleanVal };
    updateField('leave.availableLeaveTypes', types);
  };

  const addLeaveType = () => {
    const types = [...(settings?.leave?.availableLeaveTypes || [])];
    types.push({ key: `custom_${Date.now()}`, label: 'New Leave Type', isPaid: true, maxDaysPerYear: 10 });
    updateField('leave.availableLeaveTypes', types);
  };

  const removeLeaveType = (index) => {
    const types = (settings?.leave?.availableLeaveTypes || []).filter((_, i) => i !== index);
    updateField('leave.availableLeaveTypes', types);
  };

  // Recognition categories helpers
  const handleRecogChange = (index, key, val) => {
    const cats = [...(settings?.recognition?.categories || [])];
    cats[index] = { ...cats[index], [key]: key === 'points' ? Number(val) : val };
    updateField('recognition.categories', cats);
  };

  const addRecogCategory = () => {
    const cats = [...(settings?.recognition?.categories || [])];
    cats.push({ key: `award_${Date.now()}`, label: 'Special Achievement', points: 10 });
    updateField('recognition.categories', cats);
  };

  const removeRecogCategory = (index) => {
    const cats = (settings?.recognition?.categories || []).filter((_, i) => i !== index);
    updateField('recognition.categories', cats);
  };

  // Document checklist helpers
  const handleDocTypeChange = (index, key, val) => {
    const docs = [...(settings?.documents?.standardTypes || [])];
    const cleanVal = key === 'isMandatory'
      ? (typeof val === 'boolean' ? val : val?.target?.checked ?? val?.checked ?? !docs[index]?.[key])
      : val;
    docs[index] = { ...docs[index], [key]: cleanVal };
    updateField('documents.standardTypes', docs);
  };

  const addDocType = () => {
    const docs = [...(settings?.documents?.standardTypes || [])];
    docs.push({ name: 'New Required Document', isMandatory: false, appliesTo: 'student' });
    updateField('documents.standardTypes', docs);
  };

  const removeDocType = (index) => {
    const docs = (settings?.documents?.standardTypes || []).filter((_, i) => i !== index);
    updateField('documents.standardTypes', docs);
  };

  // Working days toggle helper
  const toggleWorkingDay = (dayId) => {
    const current = settings?.timings?.workingDays || [1, 2, 3, 4, 5, 6];
    const next = current.includes(dayId) ? current.filter((d) => d !== dayId) : [...current, dayId].sort();
    updateField('timings.workingDays', next);
  };

  // Payment methods toggle helper
  const togglePaymentMethod = (method) => {
    const current = settings?.fees?.paymentMethods || ['cash', 'online', 'cheque', 'bank_transfer', 'upi'];
    const next = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
    updateField('fees.paymentMethods', next);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="School Settings" description="Loading school configuration..." />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-96 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl animate-pulse" />
          <div className="md:col-span-3 h-96 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="School Settings" description="Configure school preferences" />
        <Card className="p-8 text-center text-muted">
          <AlertCircle size={36} className="mx-auto mb-2 text-danger opacity-70" />
          <p className="font-semibold text-deep dark:text-dark-text">Failed to retrieve settings.</p>
          <p className="text-xs text-muted mt-1">Please check your network connection or session privileges.</p>
        </Card>
      </div>
    );
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="flex flex-col gap-4 lg:gap-5 lg:h-[calc(100vh-6.75rem)] lg:max-h-[calc(100vh-6.75rem)] lg:overflow-hidden">
      {/* Top Header with Sticky Action Toolbar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-dark-surface p-4 sm:p-5 rounded-2xl border border-border dark:border-dark-border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-forest-soft dark:bg-emerald-500/10 text-forest dark:text-emerald-400">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight">School Settings</h1>
                {isDirty && (
                  <Badge variant="warning" className="animate-pulse">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted dark:text-dark-text-muted mt-0.5">
                Configure operational policies, timings, rules and feature visibility
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving} className="text-muted hover:text-deep">
              <RotateCcw size={14} className="mr-1.5" /> Discard
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} className="shadow-sm">
            <Save size={15} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2 lg:space-y-0 lg:h-full lg:min-h-0 lg:flex lg:flex-col">
          {/* Mobile Tab Carousel / Scroller */}
          <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-forest text-white shadow-xs'
                      : 'bg-white dark:bg-dark-surface text-secondary dark:text-dark-text-secondary border border-border dark:border-dark-border hover:bg-surface'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Navigation List */}
          <div className="hidden lg:flex lg:flex-col lg:h-full bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-2.5 shadow-xs overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-bold text-muted dark:text-dark-text-muted uppercase tracking-wider shrink-0">
              Configuration Sections
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1 pr-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-forest-soft dark:bg-emerald-500/10 text-forest dark:text-emerald-400 font-semibold'
                        : 'text-secondary dark:text-dark-text-secondary hover:bg-slate-50 dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 mt-0.5 ${isActive ? 'text-forest dark:text-emerald-400' : 'text-muted'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-snug">{tab.label}</p>
                      <p className="text-[11px] text-muted dark:text-dark-text-muted line-clamp-1 mt-0.5">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Tab Content Area (Only Selected Section Scrolls) */}
        <div className="lg:col-span-8 xl:col-span-9 lg:h-full lg:min-h-0 lg:flex lg:flex-col">
          <div ref={contentRef} className="flex-1 overflow-y-auto scrollbar-thin pr-2 pb-16 space-y-6">
          {/* Active Tab Banner */}
          <div className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-forest/10 dark:bg-emerald-500/15 text-forest dark:text-emerald-400">
                <activeTabMeta.icon size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-deep dark:text-dark-text">{activeTabMeta.label}</h2>
                <p className="text-xs text-muted dark:text-dark-text-muted">{activeTabMeta.desc}</p>
              </div>
            </div>
          </div>

          {/* 1. GENERAL SCHOOL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-forest" /> School Profile & Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="School Name"
                    value={settings.general?.schoolName || ''}
                    onChange={(e) => updateField('general.schoolName', e.target.value)}
                    placeholder="e.g. St. Xavier International Academy"
                  />
                  <Input
                    label="School Code / Registration No."
                    value={settings.general?.schoolCode || ''}
                    onChange={(e) => updateField('general.schoolCode', e.target.value)}
                    placeholder="e.g. SCH-1049"
                  />
                  <Input
                    label="Principal / Headmaster Name"
                    value={settings.general?.principalName || ''}
                    onChange={(e) => updateField('general.principalName', e.target.value)}
                    placeholder="Dr. Eleanor Vance"
                  />
                  <Input
                    label="Official Phone Number"
                    value={settings.general?.phone || ''}
                    onChange={(e) => updateField('general.phone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                  <Input
                    label="Official Contact Email"
                    type="email"
                    value={settings.general?.email || ''}
                    onChange={(e) => updateField('general.email', e.target.value)}
                    placeholder="admin@school.edu"
                  />
                  <Input
                    label="Official Website URL"
                    value={settings.general?.website || ''}
                    onChange={(e) => updateField('general.website', e.target.value)}
                    placeholder="https://www.school.edu"
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Campus Location & Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Street Address"
                      value={settings.general?.address?.street || ''}
                      onChange={(e) => updateField('general.address.street', e.target.value)}
                      placeholder="124 Greenfield Road, North Campus"
                    />
                  </div>
                  <Input
                    label="City / Town"
                    value={settings.general?.address?.city || ''}
                    onChange={(e) => updateField('general.address.city', e.target.value)}
                  />
                  <Input
                    label="State / Province"
                    value={settings.general?.address?.state || ''}
                    onChange={(e) => updateField('general.address.state', e.target.value)}
                  />
                  <Input
                    label="Postal / Zip Code"
                    value={settings.general?.address?.zip || ''}
                    onChange={(e) => updateField('general.address.zip', e.target.value)}
                  />
                  <Input
                    label="Country"
                    value={settings.general?.address?.country || 'India'}
                    onChange={(e) => updateField('general.address.country', e.target.value)}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Locale, Currency & Formats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Select
                    label="Timezone"
                    value={settings.general?.timezone || 'Asia/Kolkata'}
                    onChange={(e) => updateField('general.timezone', e.target.value)}
                    options={[
                      { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
                      { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
                      { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                      { value: 'America/New_York', label: 'America/New York (EST/EDT)' },
                      { value: 'UTC', label: 'Universal Time (UTC)' },
                    ]}
                  />
                  <Input
                    label="Currency Code"
                    value={settings.general?.currency || 'INR'}
                    onChange={(e) => updateField('general.currency', e.target.value)}
                  />
                  <Input
                    label="Currency Symbol"
                    value={settings.general?.currencySymbol || '₹'}
                    onChange={(e) => updateField('general.currencySymbol', e.target.value)}
                  />
                  <Select
                    label="Date Format"
                    value={settings.general?.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => updateField('general.dateFormat', e.target.value)}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 24/09/2026)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 09/24/2026)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-09-24)' },
                    ]}
                  />
                </div>
              </Card>
            </div>
          )}

          {/* 2. TIMINGS & SCHEDULE */}
          {activeTab === 'timings' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-forest" /> Daily Bell Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Input
                    label="School Start Time"
                    type="time"
                    value={settings.timings?.schoolStartTime || '08:00'}
                    onChange={(e) => updateField('timings.schoolStartTime', e.target.value)}
                  />
                  <Input
                    label="School End Time"
                    type="time"
                    value={settings.timings?.schoolEndTime || '14:30'}
                    onChange={(e) => updateField('timings.schoolEndTime', e.target.value)}
                  />
                  <Input
                    label="Periods Per Day"
                    type="number"
                    min="1"
                    max="15"
                    value={settings.timings?.periodsPerDay ?? 8}
                    onChange={(e) => updateField('timings.periodsPerDay', Number(e.target.value))}
                  />
                  <Input
                    label="Teaching Period (Minutes)"
                    type="number"
                    value={settings.timings?.periodDurationMinutes ?? 45}
                    onChange={(e) => updateField('timings.periodDurationMinutes', Number(e.target.value))}
                  />
                  <Input
                    label="Short Break (Minutes)"
                    type="number"
                    value={settings.timings?.breakDurationMinutes ?? 15}
                    onChange={(e) => updateField('timings.breakDurationMinutes', Number(e.target.value))}
                  />
                  <Input
                    label="Lunch Break (Minutes)"
                    type="number"
                    value={settings.timings?.lunchDurationMinutes ?? 30}
                    onChange={(e) => updateField('timings.lunchDurationMinutes', Number(e.target.value))}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-2">School Working Days</h3>
                <p className="text-xs text-muted mb-4">
                  Select days when regular classes are held. Non-working days are automatically treated as holidays in attendance and timetables.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isWorking = (settings.timings?.workingDays || [1, 2, 3, 4, 5, 6]).includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleWorkingDay(d.id)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isWorking
                            ? 'border-forest bg-forest-soft/60 dark:bg-emerald-500/10 text-forest dark:text-emerald-400 font-bold shadow-xs'
                            : 'border-border dark:border-dark-border bg-slate-50 dark:bg-dark-hover text-muted line-through'
                        }`}
                      >
                        <p className="text-sm">{d.label}</p>
                        <span className="text-[10px] block mt-0.5 opacity-80">{isWorking ? 'Active' : 'Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* 3. ACADEMICS & GRADING */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <GraduationCap size={16} className="text-forest" /> Academic Constraints
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Passing Mark Threshold (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.academic?.passingMarksPercent ?? 40}
                    onChange={(e) => updateField('academic.passingMarksPercent', Number(e.target.value))}
                    helperText="Minimum score needed to clear an exam"
                  />
                  <Input
                    label="Max Subjects Per Teacher"
                    type="number"
                    value={settings.academic?.maxSubjectsPerTeacher ?? 5}
                    onChange={(e) => updateField('academic.maxSubjectsPerTeacher', Number(e.target.value))}
                    helperText="Recommended ceiling during assignment"
                  />
                  <Input
                    label="Max Periods Per Day Per Teacher"
                    type="number"
                    value={settings.academic?.maxPeriodsPerDay ?? 8}
                    onChange={(e) => updateField('academic.maxPeriodsPerDay', Number(e.target.value))}
                    helperText="Workload constraint for timetable generation"
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-deep dark:text-dark-text">Grading Scale Definition</h3>
                    <p className="text-xs text-muted">Used when generating report cards and exam grade breakdowns</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addGradeRow}>
                    <Plus size={14} className="mr-1" /> Add Grade
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-dark-border text-muted uppercase">
                        <th className="py-2.5 px-3 text-left font-semibold">Grade</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Min %</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Max %</th>
                        <th className="py-2.5 px-3 text-left font-semibold">GPA Points</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Performance Label</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {(settings.academic?.gradingScale || []).map((g, idx) => (
                        <tr key={idx} className="hover:bg-surface/50 dark:hover:bg-dark-hover/40 transition-colors">
                          <td className="py-2 px-3">
                            <Input
                              value={g.grade}
                              onChange={(e) => handleGradeChange(idx, 'grade', e.target.value)}
                              className="w-20 font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={g.minPercent}
                              onChange={(e) => handleGradeChange(idx, 'minPercent', e.target.value)}
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={g.maxPercent}
                              onChange={(e) => handleGradeChange(idx, 'maxPercent', e.target.value)}
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={g.points}
                              onChange={(e) => handleGradeChange(idx, 'points', e.target.value)}
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={g.status || ''}
                              onChange={(e) => handleGradeChange(idx, 'status', e.target.value)}
                              className="w-36"
                              placeholder="e.g. Distinction"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeGradeRow(idx)}
                              className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                              title="Delete Grade"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 4. ATTENDANCE RULES */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <ClipboardCheck size={16} className="text-forest" /> Attendance Thresholds & Enforcement
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Minimum Required Attendance (%)"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.attendance?.minAttendancePercentage ?? 75}
                      onChange={(e) => updateField('attendance.minAttendancePercentage', Number(e.target.value))}
                      helperText="Students falling below this threshold are flagged for low attendance"
                    />
                    <div className="mt-3 p-3 bg-forest-soft/40 dark:bg-emerald-500/10 rounded-xl border border-forest/20 text-xs">
                      <span className="font-semibold text-forest dark:text-emerald-400">Policy Indicator: </span>
                      {settings.attendance?.minAttendancePercentage ?? 75}% or higher required for exam eligibility.
                    </div>
                  </div>

                  <Input
                    label="Late Arrival Grace Threshold (Minutes)"
                    type="number"
                    value={settings.attendance?.lateThresholdMinutes ?? 15}
                    onChange={(e) => updateField('attendance.lateThresholdMinutes', Number(e.target.value))}
                    helperText="Arrivals beyond this window after school start time are recorded as 'Late'"
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Teacher Attendance Modification Window</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="p-4 border border-border dark:border-dark-border rounded-xl">
                    <Switch
                      label="Allow Teachers to Edit Submitted Attendance"
                      checked={!!settings.attendance?.allowTeacherEdit}
                      onChange={(val) => handleToggleField('attendance.allowTeacherEdit', val)}
                    />
                    <p className="text-[11px] text-muted mt-2">
                      When disabled, only School Administrators can modify past attendance records.
                    </p>
                  </div>

                  <Input
                    label="Teacher Edit Window (Hours)"
                    type="number"
                    disabled={!settings.attendance?.allowTeacherEdit}
                    value={settings.attendance?.editWindowHours ?? 48}
                    onChange={(e) => updateField('attendance.editWindowHours', Number(e.target.value))}
                    helperText="Hours after attendance marking within which a teacher may adjust a record"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* 5. LEAVE POLICIES */}
          {activeTab === 'leave' && (
            <div className="space-y-6">
              {/* Student Leave Policy */}
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-forest" /> Student Leave Policies
                </h3>
                <p className="text-xs text-muted mb-4">
                  Governs how student leaves are submitted by parents and approved by school staff.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-border dark:border-dark-border rounded-xl">
                    <Switch
                      label="Mandate Parent Submission"
                      checked={!!settings.leave?.studentLeave?.requireParentSubmission}
                      onChange={(val) => handleToggleField('leave.studentLeave.requireParentSubmission', val)}
                    />
                    <p className="text-[11px] text-muted mt-1.5">
                      Only registered parents can apply for student leaves.
                    </p>
                  </div>

                  <Select
                    label="Default Leave Approver"
                    value={settings.leave?.studentLeave?.approver || 'class_teacher'}
                    onChange={(e) => updateField('leave.studentLeave.approver', e.target.value)}
                    options={[
                      { value: 'class_teacher', label: "Assigned Class Teacher (Recommended)" },
                      { value: 'school_admin', label: "School Administrator Only" },
                    ]}
                  />

                  <Input
                    label="Max Consecutive Days Allowed"
                    type="number"
                    value={settings.leave?.studentLeave?.maxConsecutiveDays ?? 15}
                    onChange={(e) => updateField('leave.studentLeave.maxConsecutiveDays', Number(e.target.value))}
                    helperText="System will prevent requests exceeding this duration"
                  />

                  <Input
                    label="Medical Certificate Required for Leaves >= (Days)"
                    type="number"
                    value={settings.leave?.studentLeave?.requireMedicalCertificateDays ?? 3}
                    onChange={(e) => updateField('leave.studentLeave.requireMedicalCertificateDays', Number(e.target.value))}
                    helperText="Upload of doctor certificate mandatory if duration reaches or exceeds this number"
                  />
                </div>
              </Card>

              {/* Teacher Leave Policy */}
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-1 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-forest" /> Teacher Leave Policies
                </h3>
                <p className="text-xs text-muted mb-4">
                  Governs teacher time-off, substitute lecture scheduling, and approval hierarchy.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Leave Approver for Teachers"
                    value={settings.leave?.teacherLeave?.approver || 'school_admin'}
                    onChange={(e) => updateField('leave.teacherLeave.approver', e.target.value)}
                    options={[
                      { value: 'school_admin', label: 'School Administrator' },
                      { value: 'principal', label: 'Principal / Headmaster' },
                    ]}
                  />

                  <Input
                    label="Max Consecutive Days for Teachers"
                    type="number"
                    value={settings.leave?.teacherLeave?.maxConsecutiveDays ?? 30}
                    onChange={(e) => updateField('leave.teacherLeave.maxConsecutiveDays', Number(e.target.value))}
                  />

                  <div className="p-4 border border-border dark:border-dark-border rounded-xl sm:col-span-2">
                    <Switch
                      label="Enforce Substitute Teacher Assignment Before Approval"
                      checked={!!settings.leave?.teacherLeave?.requireSubstituteAssignment}
                      onChange={(val) => handleToggleField('leave.teacherLeave.requireSubstituteAssignment', val)}
                    />
                    <p className="text-[11px] text-muted mt-1.5">
                      Ensures no timetable lectures are left unassigned when a teacher takes planned leave.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Leave Types Configuration */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-deep dark:text-dark-text">Available Leave Categories</h3>
                    <p className="text-xs text-muted">Configures the leave types visible in the drop-down selector</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addLeaveType}>
                    <Plus size={14} className="mr-1" /> Add Category
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-dark-border text-muted uppercase">
                        <th className="py-2.5 px-3 text-left font-semibold">Unique Key</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Display Label</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Paid Leave?</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Annual Quota (Days)</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {(settings.leave?.availableLeaveTypes || []).map((lt, idx) => (
                        <tr key={idx} className="hover:bg-surface/50 dark:hover:bg-dark-hover/40">
                          <td className="py-2 px-3">
                            <Input
                              value={lt.key}
                              onChange={(e) => handleLeaveTypeChange(idx, 'key', e.target.value)}
                              className="w-28 font-mono text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={lt.label}
                              onChange={(e) => handleLeaveTypeChange(idx, 'label', e.target.value)}
                              className="w-40"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!lt.isPaid}
                              onChange={(val) => handleLeaveTypeChange(idx, 'isPaid', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={lt.maxDaysPerYear}
                              onChange={(e) => handleLeaveTypeChange(idx, 'maxDaysPerYear', e.target.value)}
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeLeaveType(idx)}
                              className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                              title="Delete Leave Type"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 6. FEE RULES */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-forest" /> Billing & Late Fine Policies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Select
                    label="Billing Cycle Frequency"
                    value={settings.fees?.feeFrequency || 'monthly'}
                    onChange={(e) => updateField('fees.feeFrequency', e.target.value)}
                    options={[
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
                      { value: 'annual', label: 'Annual (Once a Year)' },
                    ]}
                  />

                  <Input
                    label="Default Due Day of the Month"
                    type="number"
                    min="1"
                    max="31"
                    value={settings.fees?.dueDayOfMonth ?? 10}
                    onChange={(e) => updateField('fees.dueDayOfMonth', Number(e.target.value))}
                    helperText="e.g. 10th of every billing month"
                  />

                  <Input
                    label="Late Fine Grace Period (Days)"
                    type="number"
                    value={settings.fees?.lateFeeGraceDays ?? 5}
                    onChange={(e) => updateField('fees.lateFeeGraceDays', Number(e.target.value))}
                    helperText="Days past due date before fine starts calculating"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border dark:border-dark-border items-center">
                  <div className="p-4 border border-border dark:border-dark-border rounded-xl">
                    <Switch
                      label="Enable Automated Late Fee Penalty"
                      checked={!!settings.fees?.lateFeeEnabled}
                      onChange={(val) => handleToggleField('fees.lateFeeEnabled', val)}
                    />
                    <p className="text-[11px] text-muted mt-1.5">
                      Automatically appends daily fine amount to overdue student invoices.
                    </p>
                  </div>

                  <Input
                    label="Late Fee Charge Per Day (₹)"
                    type="number"
                    disabled={!settings.fees?.lateFeeEnabled}
                    value={settings.fees?.lateFeePerDay ?? 10}
                    onChange={(e) => updateField('fees.lateFeePerDay', Number(e.target.value))}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-3">Accepted Payment Modes</h3>
                <p className="text-xs text-muted mb-4">
                  Select payment channels that front-office staff can record during fee collection:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'cash', label: 'Cash' },
                    { id: 'online', label: 'Online / Gateway' },
                    { id: 'cheque', label: 'Cheque' },
                    { id: 'bank_transfer', label: 'Bank Transfer (NEFT)' },
                    { id: 'upi', label: 'UPI / QR Code' },
                  ].map((pm) => {
                    const isChecked = (settings.fees?.paymentMethods || []).includes(pm.id);
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => togglePaymentMethod(pm.id)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isChecked
                            ? 'border-forest bg-forest-soft/60 dark:bg-emerald-500/10 text-forest dark:text-emerald-400 font-bold shadow-xs'
                            : 'border-border dark:border-dark-border bg-slate-50 dark:bg-dark-hover text-muted'
                        }`}
                      >
                        <p className="text-xs">{pm.label}</p>
                        <span className="text-[10px] block mt-0.5 opacity-80">{isChecked ? 'Accepted' : 'Disabled'}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Receipt Formatting</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Fee Receipt Prefix"
                    value={settings.fees?.receiptPrefix || 'REC'}
                    onChange={(e) => updateField('fees.receiptPrefix', e.target.value)}
                    helperText="e.g. REC-2026-0001"
                  />
                  <Input
                    label="Receipt Footnote / Terms"
                    value={settings.fees?.receiptNotes || ''}
                    onChange={(e) => updateField('fees.receiptNotes', e.target.value)}
                    placeholder="Thank you for your timely payment."
                  />
                </div>
              </Card>
            </div>
          )}

          {/* 7. NOTIFICATION MATRIX */}
          {activeTab === 'notifications' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-deep dark:text-dark-text flex items-center gap-2">
                    <Bell size={16} className="text-forest" /> Notification Dispatch Matrix
                  </h3>
                  <p className="text-xs text-muted">
                    Configure which stakeholders receive automated in-app and push notifications for specific events.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border dark:border-dark-border text-muted uppercase">
                      <th className="py-3 px-4 text-left font-semibold">Event Trigger</th>
                      <th className="py-3 px-4 text-center font-semibold w-28">Parents</th>
                      <th className="py-3 px-4 text-center font-semibold w-28">Teachers</th>
                      <th className="py-3 px-4 text-center font-semibold w-28">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                    {NOTIFICATION_EVENTS.map((event) => {
                      const rule = settings.notifications?.rules?.[event.key] || {};
                      return (
                        <tr key={event.key} className="hover:bg-surface/50 dark:hover:bg-dark-hover/40">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-deep dark:text-dark-text">{event.label}</p>
                            <p className="text-[11px] text-muted">{event.desc}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={!!rule.parent}
                                onChange={(val) => handleToggleField(`notifications.rules.${event.key}.parent`, val)}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={!!rule.teacher}
                                onChange={(val) => handleToggleField(`notifications.rules.${event.key}.teacher`, val)}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={!!rule.student}
                                onChange={(val) => handleToggleField(`notifications.rules.${event.key}.student`, val)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 8. ACCESS & VISIBILITY */}
          {activeTab === 'visibility' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-1 flex items-center gap-2">
                  <Eye size={16} className="text-forest" /> Parent Portal Visibility Toggles
                </h3>
                <p className="text-xs text-muted mb-4">
                  Control which operational data is visible when parents log into their portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'attendance', label: 'Attendance Records' },
                    { key: 'homework', label: 'Homework & Assignments' },
                    { key: 'marks', label: 'Exam Marks & Report Cards' },
                    { key: 'timetable', label: 'Class Timetable' },
                    { key: 'fees', label: 'Fee Invoices & Payments' },
                    { key: 'leaves', label: 'Leave Applications' },
                    { key: 'recognition', label: 'Student Recognition & Points' },
                    { key: 'documents', label: 'Student Documents' },
                    { key: 'teacherInfo', label: 'Class Teacher Profile' },
                  ].map((item) => {
                    const isVisible = settings.visibility?.parent?.[item.key] !== false;
                    return (
                      <div
                        key={item.key}
                        className="p-3.5 border border-border dark:border-dark-border rounded-xl flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-deep dark:text-dark-text">{item.label}</span>
                        <Switch
                          checked={isVisible}
                          onChange={(val) => handleToggleField(`visibility.parent.${item.key}`, val)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-1">Teacher Operational Privileges</h3>
                <p className="text-xs text-muted mb-4">
                  Configure special operational permissions granted to teachers across the school.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'canEditSubmittedAttendance', label: 'Can Edit Submitted Attendance (within window)' },
                    { key: 'canCreateHomework', label: 'Can Create and Publish Homework Assignments' },
                    { key: 'canPublishMarks', label: 'Can Publish Official Exam Results Directly' },
                    { key: 'canCreateNotices', label: 'Can Post Bulletins / School Notices' },
                    { key: 'canViewFeeInfo', label: 'Can View Student Fee Defaulter Lists' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="p-3.5 border border-border dark:border-dark-border rounded-xl flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-deep dark:text-dark-text">{item.label}</span>
                      <Switch
                        checked={!!settings.visibility?.teacherPolicy?.[item.key]}
                        onChange={(val) => handleToggleField(`visibility.teacherPolicy.${item.key}`, val)}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* 9. COMMUNICATION */}
          {activeTab === 'communication' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <MessageSquare size={16} className="text-forest" /> Notices & Circulars
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Who Can Publish Notices"
                    value={settings.communication?.notices?.whoCanCreate || 'admin_and_teacher'}
                    onChange={(e) => updateField('communication.notices.whoCanCreate', e.target.value)}
                    options={[
                      { value: 'admin_and_teacher', label: 'School Admin & Teachers' },
                      { value: 'admin_only', label: 'School Admin Only' },
                    ]}
                  />

                  <div className="p-4 border border-border dark:border-dark-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-deep dark:text-dark-text">Admin Approval for Teachers</p>
                      <p className="text-[11px] text-muted">Requires admin review before notice goes live</p>
                    </div>
                    <Switch
                      checked={!!settings.communication?.notices?.requireApprovalForTeachers}
                      onChange={(val) => handleToggleField('communication.notices.requireApprovalForTeachers', val)}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Complaints & Helpdesk</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Who Can File Complaints"
                    value={settings.communication?.complaints?.whoCanSubmit || 'parents_and_students'}
                    onChange={(e) => updateField('communication.complaints.whoCanSubmit', e.target.value)}
                    options={[
                      { value: 'parents_and_students', label: 'Parents and Students' },
                      { value: 'parents_only', label: 'Parents Only' },
                      { value: 'all', label: 'All Registered Users' },
                    ]}
                  />

                  <div className="p-4 border border-border dark:border-dark-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-deep dark:text-dark-text">Auto-Assign to School Admin</p>
                      <p className="text-[11px] text-muted">Direct newly logged tickets to administrator inbox</p>
                    </div>
                    <Switch
                      checked={settings.communication?.complaints?.autoAssignToAdmin !== false}
                      onChange={(val) => handleToggleField('communication.complaints.autoAssignToAdmin', val)}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Parent-Teacher Meeting Bookings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Default Meeting Slot (Minutes)"
                    type="number"
                    value={settings.communication?.parentMeetings?.defaultDurationMinutes ?? 30}
                    onChange={(e) => updateField('communication.parentMeetings.defaultDurationMinutes', Number(e.target.value))}
                  />
                  <Input
                    label="Advance Booking Notice (Days)"
                    type="number"
                    value={settings.communication?.parentMeetings?.advanceBookingDays ?? 7}
                    onChange={(e) => updateField('communication.parentMeetings.advanceBookingDays', Number(e.target.value))}
                    helperText="Max days in advance a meeting can be requested"
                  />
                  <div className="p-3.5 border border-border dark:border-dark-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-deep dark:text-dark-text">Parent Cancellation</p>
                      <p className="text-[11px] text-muted">Allow parents to cancel booked slot</p>
                    </div>
                    <Switch
                      checked={settings.communication?.parentMeetings?.allowParentCancellation !== false}
                      onChange={(val) => handleToggleField('communication.parentMeetings.allowParentCancellation', val)}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* 10. RECOGNITION & POINTS */}
          {activeTab === 'recognition' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <Award size={16} className="text-forest" /> Student Merit & Recognition System
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="p-3.5 border border-border dark:border-dark-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-deep dark:text-dark-text">System Active</p>
                      <p className="text-[11px] text-muted">Enable points and badges</p>
                    </div>
                    <Switch
                      checked={settings.recognition?.enabled !== false}
                      onChange={(val) => handleToggleField('recognition.enabled', val)}
                    />
                  </div>

                  <Select
                    label="Who Can Award Points"
                    value={settings.recognition?.whoCanAward || 'both'}
                    onChange={(e) => updateField('recognition.whoCanAward', e.target.value)}
                    options={[
                      { value: 'both', label: 'Teachers & School Admins' },
                      { value: 'teachers', label: 'Teachers Only' },
                      { value: 'admins', label: 'Admins Only' },
                    ]}
                  />

                  <div className="p-3.5 border border-border dark:border-dark-border rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-deep dark:text-dark-text">Parent Visibility</p>
                      <p className="text-[11px] text-muted">Parents view child badges</p>
                    </div>
                    <Switch
                      checked={settings.recognition?.visibleToParents !== false}
                      onChange={(val) => handleToggleField('recognition.visibleToParents', val)}
                    />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-deep dark:text-dark-text">Point Categories</h3>
                    <p className="text-xs text-muted">Predefined categories used when awarding student recognition points</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addRecogCategory}>
                    <Plus size={14} className="mr-1" /> Add Category
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-dark-border text-muted uppercase">
                        <th className="py-2.5 px-3 text-left font-semibold">Category Key</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Display Title</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Default Points</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {(settings.recognition?.categories || []).map((cat, idx) => (
                        <tr key={idx} className="hover:bg-surface/50 dark:hover:bg-dark-hover/40">
                          <td className="py-2 px-3">
                            <Input
                              value={cat.key}
                              onChange={(e) => handleRecogChange(idx, 'key', e.target.value)}
                              className="w-32 font-mono text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={cat.label}
                              onChange={(e) => handleRecogChange(idx, 'label', e.target.value)}
                              className="w-56"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              value={cat.points}
                              onChange={(e) => handleRecogChange(idx, 'points', e.target.value)}
                              className="w-24 font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeRecogCategory(idx)}
                              className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 11. DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-forest" /> Document Upload Parameters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Maximum File Size (MB)"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.documents?.maxFileSizeMB ?? 5}
                    onChange={(e) => updateField('documents.maxFileSizeMB', Number(e.target.value))}
                    helperText="Applies across admissions, leaves and general document uploads"
                  />

                  <Input
                    label="Allowed File Formats (comma separated)"
                    value={(settings.documents?.allowedFileTypes || ['pdf', 'jpg', 'jpeg', 'png']).join(', ')}
                    onChange={(e) => updateField('documents.allowedFileTypes', e.target.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))}
                    helperText="e.g. pdf, jpg, jpeg, png, docx"
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-deep dark:text-dark-text">Standard Document Requirements</h3>
                    <p className="text-xs text-muted">Required checklist displayed during student admission and teacher onboarding</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addDocType}>
                    <Plus size={14} className="mr-1" /> Add Document Type
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border dark:border-dark-border text-muted uppercase">
                        <th className="py-2.5 px-3 text-left font-semibold">Document Title</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Applies To</th>
                        <th className="py-2.5 px-3 text-left font-semibold">Mandatory?</th>
                        <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-dark-border/60">
                      {(settings.documents?.standardTypes || []).map((doc, idx) => (
                        <tr key={idx} className="hover:bg-surface/50 dark:hover:bg-dark-hover/40">
                          <td className="py-2 px-3">
                            <Input
                              value={doc.name}
                              onChange={(e) => handleDocTypeChange(idx, 'name', e.target.value)}
                              className="w-56"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Select
                              value={doc.appliesTo || 'student'}
                              onChange={(e) => handleDocTypeChange(idx, 'appliesTo', e.target.value)}
                              options={[
                                { value: 'student', label: 'Students' },
                                { value: 'teacher', label: 'Teachers' },
                                { value: 'all', label: 'All Stakeholders' },
                              ]}
                              className="w-36"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!doc.isMandatory}
                              onChange={(val) => handleDocTypeChange(idx, 'isMandatory', val)}
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeDocType(idx)}
                              className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                              title="Delete Document Type"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* 12. BRANDING & RECEIPTS */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                  <Palette size={16} className="text-forest" /> School Brand Colors & Identity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep dark:text-dark-text">Primary Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.branding?.primaryColor || '#059669'}
                        onChange={(e) => updateField('branding.primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border dark:border-dark-border p-0.5"
                      />
                      <Input
                        value={settings.branding?.primaryColor || '#059669'}
                        onChange={(e) => updateField('branding.primaryColor', e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-deep dark:text-dark-text">Secondary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.branding?.secondaryColor || '#0f172a'}
                        onChange={(e) => updateField('branding.secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border dark:border-dark-border p-0.5"
                      />
                      <Input
                        value={settings.branding?.secondaryColor || '#0f172a'}
                        onChange={(e) => updateField('branding.secondaryColor', e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="School Logo Image URL"
                      value={settings.branding?.logo || ''}
                      onChange={(e) => updateField('branding.logo', e.target.value)}
                      placeholder="https://example.com/school-logo.png"
                      helperText="Hosted URL of your school insignia or crest"
                    />
                    {settings.branding?.logo && (
                      <div className="mt-2.5 p-3 bg-surface rounded-xl flex items-center gap-3">
                        <img
                          src={settings.branding.logo}
                          alt="Logo Preview"
                          className="h-10 w-10 object-contain rounded-lg border bg-white"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="text-xs text-muted">Previewing brand logo</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4">Print Headers & Footers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Fee Receipt Header Message"
                    value={settings.branding?.feeReceiptHeader || ''}
                    onChange={(e) => updateField('branding.feeReceiptHeader', e.target.value)}
                    placeholder="e.g. Official Tuition Fee Invoice"
                  />
                  <Input
                    label="Fee Receipt Footer Note"
                    value={settings.branding?.feeReceiptFooter || ''}
                    onChange={(e) => updateField('branding.feeReceiptFooter', e.target.value)}
                    placeholder="e.g. Keep this receipt safe for future reference."
                  />
                  <Input
                    label="Report Card Header Subtitle"
                    value={settings.branding?.reportCardHeader || ''}
                    onChange={(e) => updateField('branding.reportCardHeader', e.target.value)}
                    placeholder="e.g. Annual Progress & Grade Assessment"
                  />
                  <Input
                    label="Report Card Footer Declaration"
                    value={settings.branding?.reportCardFooter || ''}
                    onChange={(e) => updateField('branding.reportCardFooter', e.target.value)}
                    placeholder="e.g. This is a computer generated certificate."
                  />
                </div>
              </Card>
            </div>
          )}

          {/* 13. FEATURES & MODULES TOGGLE */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-deep dark:text-dark-text flex items-center gap-2">
                      <Layers size={16} className="text-forest" /> Instique Module Enablement
                    </h3>
                    <p className="text-xs text-muted">
                      Disable modules your school does not utilize to streamline navigation for all staff and parents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {MODULE_DEFINITIONS.map((m) => {
                    const modulesMap = settings.features?.modules || {};
                    const isEnabled = modulesMap[m.key] !== false;

                    return (
                      <div
                        key={m.key}
                        className={`p-3.5 border rounded-xl flex items-center justify-between transition-colors ${
                          isEnabled
                            ? 'border-border dark:border-dark-border bg-white dark:bg-dark-surface'
                            : 'border-border/60 dark:border-dark-border/60 bg-slate-50 dark:bg-dark-hover/40 opacity-75'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                            {m.category}
                          </span>
                          <span className="text-xs font-semibold text-deep dark:text-dark-text truncate block">
                            {m.label}
                          </span>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onChange={(val) => handleToggleField(`features.modules.${m.key}`, val)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* 14. SOUND SETTINGS */}
          {activeTab === 'sound' && (
            <Card>
              <h3 className="text-sm font-bold text-deep dark:text-dark-text mb-4 flex items-center gap-2">
                <Volume2 size={16} className="text-forest" /> UI Audio Feedback
              </h3>
              <SoundSettings />
            </Card>
          )}

          {/* Bottom Save Changes Bar */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-muted" />
              <span className="text-xs text-muted">
                {isDirty ? 'You have unsaved changes in this session.' : 'All settings are up to date.'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {isDirty && (
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving} className="text-muted hover:text-deep">
                  <RotateCcw size={14} className="mr-1.5" /> Discard
                </Button>
              )}
              <Button onClick={handleSave} loading={saving} className="shadow-sm">
                <Save size={15} className="mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
