import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Calendar as CalendarIcon, Plus, Search, Filter, RotateCcw,
  MoreVertical, MapPin, Clock, Users, Flag, Trophy, BookOpen,
  Palette, UserCheck, AlertCircle, CheckCircle2, ChevronLeft,
  ChevronRight, ArrowRight, Eye, Edit3, Trash2, Send, XCircle,
  FileText, Sparkles, Building, Layers
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import { eventApi } from '../../api/event.api';
import { academicApi } from '../../api/academic.api';
import { useUserStore } from '../../store/userStore';

// ── Event Types & Categories Config ──
const EVENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'academic', label: 'Academic', color: 'bg-amber-500', icon: BookOpen, lightBg: 'bg-amber-50 text-amber-600' },
  { value: 'sports', label: 'Sports', color: 'bg-orange-500', icon: Trophy, lightBg: 'bg-orange-50 text-orange-600' },
  { value: 'cultural', label: 'Cultural', color: 'bg-purple-500', icon: Palette, lightBg: 'bg-purple-50 text-purple-600' },
  { value: 'holiday', label: 'Holiday', color: 'bg-emerald-500', icon: CalendarIcon, lightBg: 'bg-emerald-50 text-emerald-600' },
  { value: 'ptm', label: 'Parent Meeting', color: 'bg-blue-500', icon: Users, lightBg: 'bg-blue-50 text-blue-600' },
  { value: 'competition', label: 'Competition', color: 'bg-rose-500', icon: Trophy, lightBg: 'bg-rose-50 text-rose-600' },
  { value: 'workshop', label: 'Workshop', color: 'bg-indigo-500', icon: Sparkles, lightBg: 'bg-indigo-50 text-indigo-600' },
  { value: 'seminar', label: 'Seminar', color: 'bg-teal-500', icon: FileText, lightBg: 'bg-teal-50 text-teal-600' },
  { value: 'celebration', label: 'Celebration', color: 'bg-pink-500', icon: Flag, lightBg: 'bg-pink-50 text-pink-600' },
  { value: 'school_trip', label: 'School Trip', color: 'bg-cyan-500', icon: MapPin, lightBg: 'bg-cyan-50 text-cyan-600' },
  { value: 'event', label: 'School Event', color: 'bg-forest', icon: Flag, lightBg: 'bg-emerald-50 text-forest' },
  { value: 'other', label: 'Other', color: 'bg-slate-500', icon: Layers, lightBg: 'bg-slate-100 text-slate-600' },
];

function getEventTypeInfo(typeKey) {
  const found = EVENT_TYPES.find((t) => t.value === typeKey);
  if (found) return found;
  return { value: typeKey, label: typeKey || 'Event', color: 'bg-forest', icon: Flag, lightBg: 'bg-emerald-50 text-forest' };
}

function getStatusBadge(status, startDate) {
  if (status === 'cancelled') return <Badge color="danger">Cancelled</Badge>;
  if (status === 'draft') return <Badge color="gray">Draft</Badge>;
  
  const isFuture = new Date(startDate) > new Date();
  if (isFuture) return <Badge color="warning">Scheduled</Badge>;
  return <Badge color="success">Published</Badge>;
}

export default function Events() {
  const user = useUserStore((s) => s.user);
  const isSchoolAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';

  // ── Main State ──
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    todayCount: 0,
    thisMonthCount: 0,
    pastCount: 0,
    categoryCounts: {},
  });
  const [classesList, setClassesList] = useState([]);

  // ── Filters & Tabs ──
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'draft' | 'cancelled'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // ── Modals State ──
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);

  // ── Calendar Month State ──
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // ── Form State ──
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'event',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '08:30 AM',
    endTime: '12:30 PM',
    isFullDay: false,
    location: '',
    organizer: '',
    audience: ['students', 'teachers', 'parents'],
    audienceScope: 'entire_school',
    targetClasses: [],
    status: 'published',
  });

  // Load Classes for selector
  useEffect(() => {
    academicApi.getClasses({ limit: 100 })
      .then((res) => setClassesList(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch Stats
  const fetchStats = () => {
    setStatsLoading(true);
    eventApi.getStats()
      .then((res) => setStats(res.data || {}))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  };

  // Fetch Events
  const fetchEvents = () => {
    setLoading(true);
    const params = {
      limit: 100,
      status: activeTab,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      audience: audienceFilter !== 'all' ? audienceFilter : undefined,
      dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
      search: search ? search : undefined,
    };

    eventApi.getAll(params)
      .then((res) => {
        setEvents(res.data || []);
      })
      .catch((e) => {
        toast.error(e?.message || 'Failed to load events');
        setEvents([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [activeTab, typeFilter, audienceFilter, dateRangeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setAudienceFilter('all');
    setDateRangeFilter('all');
    setSelectedCalendarDate(null);
    setActiveTab('upcoming');
    fetchEvents();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count++;
    if (typeFilter !== 'all') count++;
    if (audienceFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (selectedCalendarDate) count++;
    return count;
  }, [search, typeFilter, audienceFilter, dateRangeFilter, selectedCalendarDate]);

  // ── Client-side filter for selected calendar date & search ──
  const filteredEventsList = useMemo(() => {
    return events.filter((ev) => {
      // Calendar date filter
      if (selectedCalendarDate) {
        const evStart = new Date(ev.startDate).toDateString();
        const selDate = new Date(selectedCalendarDate).toDateString();
        if (evStart !== selDate) return false;
      }
      // Text Search
      if (search) {
        const q = search.toLowerCase();
        const t = (ev.title || '').toLowerCase();
        const loc = (ev.location || '').toLowerCase();
        const org = (ev.organizer || '').toLowerCase();
        const desc = (ev.description || '').toLowerCase();
        if (!t.includes(q) && !loc.includes(q) && !org.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [events, selectedCalendarDate, search]);

  // ── Open Create / Edit Form ──
  const openFormModal = (evToEdit = null) => {
    if (evToEdit) {
      setEditEvent(evToEdit);
      setForm({
        title: evToEdit.title || '',
        description: evToEdit.description || '',
        type: evToEdit.type || 'event',
        startDate: evToEdit.startDate ? new Date(evToEdit.startDate).toISOString().split('T')[0] : '',
        endDate: evToEdit.endDate ? new Date(evToEdit.endDate).toISOString().split('T')[0] : '',
        startTime: evToEdit.startTime || '08:30 AM',
        endTime: evToEdit.endTime || '12:30 PM',
        isFullDay: !!evToEdit.isFullDay,
        location: evToEdit.location || '',
        organizer: evToEdit.organizer || '',
        audience: evToEdit.audience || ['students', 'teachers', 'parents'],
        audienceScope: evToEdit.audienceScope || 'entire_school',
        targetClasses: evToEdit.targetClasses ? evToEdit.targetClasses.map((c) => c._id || c) : [],
        status: evToEdit.status || 'published',
      });
    } else {
      setEditEvent(null);
      setForm({
        title: '',
        description: '',
        type: 'event',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        startTime: '08:30 AM',
        endTime: '12:30 PM',
        isFullDay: false,
        location: '',
        organizer: '',
        audience: ['students', 'teachers', 'parents'],
        audienceScope: 'entire_school',
        targetClasses: [],
        status: 'published',
      });
    }
    setCreateModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!form.title.trim() || !form.startDate) {
      toast.error('Event title and start date are required');
      return;
    }
    setSaving(true);
    try {
      if (editEvent) {
        await eventApi.update(editEvent._id, form);
        toast.success('Event updated successfully');
      } else {
        await eventApi.create(form);
        toast.success('Event created successfully');
      }
      setCreateModalOpen(false);
      fetchEvents();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishEvent = async (evId) => {
    try {
      await eventApi.publish(evId);
      toast.success('Event published');
      fetchEvents();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to publish event');
    }
  };

  const handleCancelEvent = async (evId) => {
    try {
      await eventApi.cancel(evId);
      toast.success('Event cancelled');
      fetchEvents();
      fetchStats();
    } catch (e) {
      toast.error(e?.message || 'Failed to cancel event');
    }
  };

  const handleDeleteEvent = (ev) => {
    Swal.fire({
      title: 'Delete Event?',
      text: `Are you sure you want to delete "${ev.title}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete Event',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await eventApi.delete(ev._id);
        toast.success('Event deleted');
        fetchEvents();
        fetchStats();
      } catch (e) {
        toast.error(e?.message || 'Failed to delete event');
      }
    });
  };

  // ── Calendar Days Calculation ──
  const calendarMonthData = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Adjusted for Mon-Sun (Mon=0, Sun=6)
    const adjustedFirstDay = (firstDayIndex + 6) % 7;

    const days = [];
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
    }
    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      days.push({ day: n, isCurrentMonth: false, date: new Date(year, month + 1, n) });
    }
    return days;
  }, [currentCalendarDate]);

  const monthYearLabel = currentCalendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-forest" size={24} />
            Events
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Manage school events and important dates
          </p>
        </div>

        {isSchoolAdmin && (
          <Button
            onClick={() => openFormModal(null)}
            className="self-start sm:self-auto flex items-center gap-2 text-xs py-2 bg-forest hover:bg-forest/90 text-white font-semibold rounded-xl shadow-xs"
          >
            <Plus size={16} /> Create Event
          </Button>
        )}
      </div>

      {/* ── 2. Summary Statistics (4 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Events */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Upcoming Events</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.upcomingCount || 0}
            </div>
            <span className="text-[11px] text-secondary">Next 30 days</span>
          </div>
        </Card>

        {/* Card 2: Today's Events */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Today's Events</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.todayCount || 0}
            </div>
            <span className="text-[11px] text-secondary">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </Card>

        {/* Card 3: This Month */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">This Month</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.thisMonthCount || 0}
            </div>
            <span className="text-[11px] text-secondary">
              {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </Card>

        {/* Card 4: Past Events */}
        <Card padding={false} className="p-4 bg-white border border-border rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted block">Past Events</span>
            <div className="text-xl font-bold text-deep leading-tight my-0.5">
              {statsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : stats.pastCount || 0}
            </div>
            <span className="text-[11px] text-secondary">This Academic Year</span>
          </div>
        </Card>
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <Card padding={false} className="p-4 bg-white border border-border rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by title, location or organizer..."
              className="w-full text-xs bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Event Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Audience:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              <option value="all">All Audience</option>
              <option value="students">Students</option>
              <option value="parents">Parents</option>
              <option value="teachers">Teachers</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Date Range:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full sm:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="next_30_days">Next 30 Days</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="py-2 px-3 text-xs flex items-center gap-1 shrink-0"
            >
              <RotateCcw size={13} /> Reset
            </Button>
            <div className="px-3 py-2 bg-forest/10 border border-forest/20 text-forest rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5">
              <Filter size={13} /> Filters {activeFiltersCount}
            </div>
          </div>
        </form>
      </Card>

      {/* ── 4. Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: Event Tabs & Events List (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          <Card padding={false} className="bg-white border border-border rounded-xl overflow-hidden">
            {/* Tabs Bar */}
            <div className="flex items-center border-b border-border px-4 bg-surface/30">
              {[
                { key: 'upcoming', label: 'Upcoming Events' },
                { key: 'past', label: 'Past Events' },
                { key: 'draft', label: 'Drafts' },
                { key: 'cancelled', label: 'Cancelled' },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSelectedCalendarDate(null); }}
                    className={`py-3.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-forest text-forest font-bold'
                        : 'border-transparent text-secondary hover:text-deep'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Event List Container */}
            <div className="p-4">
              {selectedCalendarDate && (
                <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 text-forest rounded-lg text-xs flex items-center justify-between">
                  <span>Filtered for <strong>{new Date(selectedCalendarDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  <button onClick={() => setSelectedCalendarDate(null)} className="font-bold text-xs hover:underline">Clear Date Filter</button>
                </div>
              )}

              {loading ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-3 border-b border-border/50">
                      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEventsList.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarIcon size={36} className="mx-auto text-muted mb-2 opacity-50" />
                  <p className="text-sm font-bold text-deep">No events found</p>
                  <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                    {activeFiltersCount > 0
                      ? 'Try changing your search keywords or active filters.'
                      : `There are no scheduled events in the ${activeTab} tab.`}
                  </p>
                  {activeFiltersCount > 0 ? (
                    <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 text-xs">
                      Reset Filters
                    </Button>
                  ) : isSchoolAdmin && (
                    <Button size="sm" onClick={() => openFormModal(null)} className="mt-4 text-xs bg-forest text-white">
                      <Plus size={14} className="mr-1" /> Create Event
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredEventsList.map((ev) => {
                    const typeInfo = getEventTypeInfo(ev.type);
                    const TypeIcon = typeInfo.icon;
                    const startDateObj = new Date(ev.startDate);
                    const dayNum = startDateObj.getDate().toString().padStart(2, '0');
                    const monthStr = startDateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                    
                    const audienceText = ev.audience && ev.audience.length > 0
                      ? ev.audience.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')
                      : 'All School';

                    return (
                      <div key={ev._id} className="py-3.5 px-2 hover:bg-surface/40 transition-colors rounded-xl flex items-start gap-4">
                        {/* Date Badge (Left) */}
                        <div className="w-12 text-center shrink-0 pt-1">
                          <span className="text-lg font-black text-deep block leading-none">{dayNum}</span>
                          <span className="text-[10px] font-bold text-muted uppercase block tracking-wider mt-0.5">{monthStr}</span>
                        </div>

                        {/* Category Icon Box */}
                        <div className={`w-10 h-10 rounded-xl ${typeInfo.lightBg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                          <TypeIcon size={18} />
                        </div>

                        {/* Event Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              onClick={() => setViewEvent(ev)}
                              className="text-sm font-bold text-deep hover:text-forest transition-colors cursor-pointer truncate"
                            >
                              {ev.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                            <span className="font-medium text-secondary">{typeInfo.label}</span>
                            <span>•</span>
                            <span className="text-[11px] text-muted">{audienceText}</span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-[11px] text-secondary flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock size={13} className="text-muted" />
                              <span>{ev.isFullDay ? 'All Day' : `${ev.startTime || '09:00 AM'}${ev.endTime ? ` – ${ev.endTime}` : ''}`}</span>
                            </div>
                            {ev.location && (
                              <div className="flex items-center gap-1">
                                <MapPin size={13} className="text-muted" />
                                <span className="truncate max-w-[180px]">{ev.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 pt-1 hidden sm:block">
                          {getStatusBadge(ev.status, ev.startDate)}
                        </div>

                        {/* Three-Dot Actions Menu */}
                        <div className="relative shrink-0 pt-1">
                          <button
                            onClick={() => setActionMenuId(actionMenuId === ev._id ? null : ev._id)}
                            className="p-1.5 rounded-lg text-muted hover:text-deep hover:bg-surface transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {actionMenuId === ev._id && (
                            <div className="absolute right-0 top-8 w-40 bg-white border border-border rounded-xl shadow-lg z-20 py-1 text-xs">
                              <button
                                onClick={() => { setViewEvent(ev); setActionMenuId(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                              >
                                <Eye size={14} className="text-muted" /> View Details
                              </button>

                              {isSchoolAdmin && (
                                <>
                                  <button
                                    onClick={() => { openFormModal(ev); setActionMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-deep font-medium"
                                  >
                                    <Edit3 size={14} className="text-muted" /> Edit Event
                                  </button>

                                  {ev.status === 'draft' && (
                                    <button
                                      onClick={() => { handlePublishEvent(ev._id); setActionMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-forest font-medium"
                                    >
                                      <Send size={14} /> Publish Event
                                    </button>
                                  )}

                                  {ev.status === 'published' && (
                                    <button
                                      onClick={() => { handleCancelEvent(ev._id); setActionMenuId(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-amber-600 font-medium"
                                    >
                                      <XCircle size={14} /> Cancel Event
                                    </button>
                                  )}

                                  <button
                                    onClick={() => { handleDeleteEvent(ev); setActionMenuId(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-surface flex items-center gap-2 text-danger font-medium border-t border-border mt-1 pt-1"
                                  >
                                    <Trash2 size={14} /> Delete Event
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List Footer Counter */}
              {filteredEventsList.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
                  <span>Showing {filteredEventsList.length} of {events.length} events</span>
                  <button onClick={handleResetFilters} className="text-forest hover:underline font-semibold flex items-center gap-1">
                    View all events <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Right Column: Calendar & Categories (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Monthly Calendar Card */}
          <Card padding={false} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-xs font-bold text-deep uppercase tracking-wider">Calendar</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-deep">{monthYearLabel}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))}
                    className="p-1 rounded-md hover:bg-surface text-secondary"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))}
                    className="p-1 rounded-md hover:bg-surface text-secondary"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mt-3 text-[10px] font-bold text-muted uppercase tracking-wider">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mt-2">
              {calendarMonthData.map((cd, index) => {
                const isSelected = selectedCalendarDate && cd.date.toDateString() === new Date(selectedCalendarDate).toDateString();
                const isToday = cd.date.toDateString() === new Date().toDateString();
                const hasEvent = events.some((e) => new Date(e.startDate).toDateString() === cd.date.toDateString());

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isSelected) setSelectedCalendarDate(null);
                      else setSelectedCalendarDate(cd.date);
                    }}
                    className={`h-8 rounded-full flex flex-col items-center justify-center text-xs relative transition-all cursor-pointer ${
                      !cd.isCurrentMonth ? 'text-muted/40' : 'text-deep'
                    } ${
                      isToday ? 'bg-forest text-white font-bold' : ''
                    } ${
                      isSelected && !isToday ? 'ring-2 ring-forest font-bold bg-forest/10 text-forest' : ''
                    } ${
                      !isToday && !isSelected ? 'hover:bg-surface' : ''
                    }`}
                  >
                    <span>{cd.day}</span>
                    {hasEvent && (
                      <span className={`w-1 h-1 rounded-full absolute bottom-1 ${isToday ? 'bg-white' : 'bg-forest'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Event Categories Card */}
          <Card padding={false} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h2 className="text-xs font-bold text-deep uppercase tracking-wider">Event Categories</h2>
              <button onClick={handleResetFilters} className="text-xs font-semibold text-forest hover:underline">Manage</button>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'School Events', type: 'event', color: 'bg-forest' },
                { label: 'Academic', type: 'academic', color: 'bg-amber-500' },
                { label: 'Sports', type: 'sports', color: 'bg-orange-500' },
                { label: 'Celebration', type: 'celebration', color: 'bg-pink-500' },
                { label: 'Parent Meetings', type: 'ptm', color: 'bg-blue-500' },
                { label: 'Others', type: 'other', color: 'bg-slate-500' },
              ].map((cat) => {
                const count = stats.categoryCounts?.[cat.type] || 0;
                const isSelected = typeFilter === cat.type;

                return (
                  <button
                    key={cat.type}
                    onClick={() => setTypeFilter(isSelected ? 'all' : cat.type)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-forest/10 font-bold text-forest' : 'hover:bg-surface text-deep'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="font-bold text-muted text-xs">{count}</span>
                  </button>
                );
              })}
            </div>
          </Card>

        </div>
      </div>

      {/* ── 5. Create / Edit Event Modal ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editEvent ? 'Edit Event' : 'Create School Event'}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Event Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Independence Day Celebration"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Event Type *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={EVENT_TYPES.filter((t) => t.value !== 'all')}
            />

            <Select
              label="Status *"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Save Draft' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date *"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              placeholder="08:30 AM"
            />
            <Input
              label="End Time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              placeholder="12:30 PM"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="School Auditorium"
            />
            <Input
              label="Organizer"
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              placeholder="Cultural Committee"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-deep block mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write a brief overview of the event..."
              className="w-full text-xs bg-surface border border-border rounded-lg p-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <label className="text-xs font-bold text-deep block mb-2">Visible Audience</label>
            <div className="flex items-center gap-4 flex-wrap">
              {['students', 'parents', 'teachers', 'staff'].map((aud) => {
                const checked = form.audience.includes(aud);
                return (
                  <label key={aud} className="flex items-center gap-1.5 cursor-pointer font-medium capitalize">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, audience: [...form.audience, aud] });
                        } else {
                          setForm({ ...form, audience: form.audience.filter((a) => a !== aud) });
                        }
                      }}
                      className="rounded border-border text-forest focus:ring-forest"
                    />
                    <span>{aud}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent} loading={saving} className="bg-forest text-white">
              {editEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 6. View Event Details Modal ── */}
      {viewEvent && (
        <Modal
          isOpen={!!viewEvent}
          onClose={() => setViewEvent(null)}
          title="Event Details"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-deep">{viewEvent.title}</h2>
              {getStatusBadge(viewEvent.status, viewEvent.startDate)}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-surface/50 border border-border rounded-xl p-3">
              <div>
                <span className="text-[11px] text-muted block">Event Type</span>
                <span className="font-semibold text-deep capitalize">{viewEvent.type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Date</span>
                <span className="font-semibold text-deep">
                  {new Date(viewEvent.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Time</span>
                <span className="font-semibold text-deep">
                  {viewEvent.isFullDay ? 'All Day' : `${viewEvent.startTime || '09:00 AM'} – ${viewEvent.endTime || '01:00 PM'}`}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted block">Location</span>
                <span className="font-semibold text-deep">{viewEvent.location || 'School Campus'}</span>
              </div>
            </div>

            {viewEvent.description && (
              <div>
                <span className="text-[11px] font-bold text-deep block mb-1">Description</span>
                <p className="text-secondary leading-relaxed p-3 bg-surface/30 border border-border rounded-lg">
                  {viewEvent.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted">
                Created: {new Date(viewEvent.createdAt).toLocaleDateString()}
              </span>

              {isSchoolAdmin && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const evToEdit = viewEvent;
                      setViewEvent(null);
                      openFormModal(evToEdit);
                    }}
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const evToDelete = viewEvent;
                      setViewEvent(null);
                      handleDeleteEvent(evToDelete);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
