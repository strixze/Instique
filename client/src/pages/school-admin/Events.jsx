import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  CalendarDays,
  Image as ImageIcon,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  X,
  Trash2,
  Edit2,
  Check,
  Download,
  Eye,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Shield,
  FileImage,
  AlertCircle,
  Camera,
  Star,
  MoreVertical,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import DataTable from '../../components/ui/DataTable';
import UserAvatar from '../../components/ui/UserAvatar';
import { useUserStore } from '../../store/userStore';
import { eventApi } from '../../api/event.api';
import { academicApi } from '../../api/academic.api';

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:5000';

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  return `${BACKEND_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const EVENT_TYPES = [
  { value: 'cultural', label: 'Cultural', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'sports', label: 'Sports', color: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'academic', label: 'Academic', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'annual_day', label: 'Annual Day', color: '#f59e0b', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'sports_day', label: 'Sports Day', color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'holiday', label: 'Holiday', color: '#ef4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'exam', label: 'Exam', color: '#f97316', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'ptm', label: 'PTM', color: '#6366f1', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'workshop', label: 'Workshop', color: '#a855f7', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { value: 'celebration', label: 'Celebration', color: '#ec4899', bg: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'competition', label: 'Competition', color: '#eab308', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'deadline', label: 'Deadline', color: '#64748b', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'event', label: 'General Event', color: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'other', label: 'Other', color: '#6b7280', bg: 'bg-gray-50 text-gray-700 border-gray-200' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Entire School' },
  { value: 'students', label: 'Students Only' },
  { value: 'teachers', label: 'Teachers Only' },
  { value: 'parents', label: 'Parents Only' },
  { value: 'classes', label: 'Specific Classes' },
];

const initialForm = {
  title: '',
  description: '',
  type: 'event',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  isFullDay: true,
  startTime: '09:00',
  endTime: '15:00',
  location: '',
  audience: 'all',
  targetClasses: [],
  status: 'upcoming',
  color: '#10b981',
};

export default function Events() {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === 'school_admin' || user?.role === 'super_admin';
  const canManagePhotos = isAdmin || user?.role === 'teacher';

  // Navigation and view states
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'calendar'
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeframeFilter, setTimeframeFilter] = useState('all');

  // Academic classes for target selection
  const [classesList, setClassesList] = useState([]);

  // Modals state
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Gallery Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryMeta, setGalleryMeta] = useState(null);

  // Photo Upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionInput, setCaptionInput] = useState('');

  // Calendar View Month state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Fetch classes for class targeting
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await academicApi.getClasses();
        setClassesList(res.data || []);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    };
    if (isAdmin) {
      fetchClasses();
    }
  }, [isAdmin]);

  // Load events for Grid / Table
  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 12,
          search: search || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          timeframe: timeframeFilter !== 'all' ? timeframeFilter : undefined,
        };
        const res = await eventApi.getAll(params);
        if (active) {
          setEvents(res.data || []);
          setMeta(res.meta || null);
        }
      } catch (err) {
        if (active) toast.error(err?.message || 'Failed to load events');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (viewMode !== 'calendar') {
      fetchEvents();
    }
    return () => {
      active = false;
    };
  }, [page, search, typeFilter, statusFilter, timeframeFilter, reload, viewMode]);

  // Load Calendar events when calendar view is active
  useEffect(() => {
    let active = true;
    const fetchCalendar = async () => {
      setCalendarLoading(true);
      try {
        const month = calendarDate.getMonth() + 1;
        const year = calendarDate.getFullYear();
        const res = await eventApi.getCalendar({ month, year });
        if (active) {
          setCalendarEvents(res.data || []);
        }
      } catch (err) {
        if (active) toast.error('Failed to load calendar events');
      } finally {
        if (active) setCalendarLoading(false);
      }
    };

    if (viewMode === 'calendar') {
      fetchCalendar();
    }
    return () => {
      active = false;
    };
  }, [calendarDate, viewMode, reload]);

  // Event stats calculation
  const stats = useMemo(() => {
    const total = meta?.total || events.length;
    const upcoming = events.filter((e) => e.status === 'upcoming').length;
    const completed = events.filter((e) => e.status === 'completed').length;
    const totalPhotos = events.reduce((sum, e) => sum + (e.photoCount || 0), 0);
    return { total, upcoming, completed, totalPhotos };
  }, [events, meta]);

  // Helpers
  const getTypeMeta = (typeKey) => {
    return EVENT_TYPES.find((t) => t.value === typeKey) || EVENT_TYPES[EVENT_TYPES.length - 1];
  };

  const formatDateRange = (start, end, isFullDay, startTime, endTime) => {
    if (!start) return '';
    const s = new Date(start);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const startDateStr = s.toLocaleDateString('en-US', options);

    if (end && new Date(end).toDateString() !== s.toDateString()) {
      const endDateStr = new Date(end).toLocaleDateString('en-US', options);
      return `${startDateStr} - ${endDateStr}`;
    }

    if (!isFullDay && startTime) {
      const timeStr = endTime ? `${startTime} - ${endTime}` : startTime;
      return `${startDateStr} • ${timeStr}`;
    }

    return startDateStr;
  };

  // Open Event Create / Edit modal
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setForm(initialForm);
    setEventModalOpen(true);
  };

  const handleOpenEdit = (evt, e) => {
    if (e) e.stopPropagation();
    setEditingEvent(evt);
    setForm({
      title: evt.title || '',
      description: evt.description || '',
      type: evt.type || 'event',
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().split('T')[0] : '',
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().split('T')[0] : '',
      isFullDay: evt.isFullDay ?? true,
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '15:00',
      location: evt.location || '',
      audience: evt.audience || 'all',
      targetClasses: (evt.targetClasses || []).map((c) => (typeof c === 'object' ? c._id : c)),
      status: evt.status || 'upcoming',
      color: evt.color || '#10b981',
    });
    setEventModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        targetClasses: form.audience === 'classes' ? form.targetClasses : [],
      };

      if (editingEvent) {
        await eventApi.update(editingEvent._id, payload);
        toast.success('Event updated successfully');
      } else {
        await eventApi.create(payload);
        toast.success('Event created successfully');
      }

      setEventModalOpen(false);
      setEditingEvent(null);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(err?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = (evt, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: 'Delete Event & Gallery?',
      text: `"${evt.title}" and all its photos will be permanently deleted from Cloudinary and the database.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await eventApi.delete(evt._id);
        toast.success('Event and gallery deleted successfully');
        if (selectedEvent?._id === evt._id) {
          setGalleryModalOpen(false);
          setSelectedEvent(null);
        }
        setReload((r) => r + 1);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete event');
      }
    });
  };

  // ==========================================
  // GALLERY LOGIC & PHOTO UPLOADS
  // ==========================================

  const handleOpenGallery = async (evt, e) => {
    if (e) e.stopPropagation();
    setSelectedEvent(evt);
    setGalleryModalOpen(true);
    setGalleryPage(1);
    setSelectedFiles([]);
    setFilePreviews([]);
    loadGalleryPhotos(evt._id, 1);
  };

  const loadGalleryPhotos = async (eventId, pageNum = 1) => {
    setGalleryLoading(true);
    try {
      const res = await eventApi.getPhotos(eventId, { page: pageNum, limit: 24 });
      setGalleryPhotos(res.data || []);
      setGalleryMeta(res.meta || null);
    } catch (err) {
      toast.error('Failed to load gallery photos');
    } finally {
      setGalleryLoading(false);
    }
  };

  // File selection for upload
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate image format & size (max 10MB per image)
    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10MB limit.`);
        continue;
      }
      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const removeSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Perform upload to Cloudinary
  const handleUploadPhotos = async () => {
    if (!selectedFiles.length || !selectedEvent) return;

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const res = await eventApi.uploadPhotos(selectedEvent._id, formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      const uploadedCount = res?.data?.uploadedCount ?? selectedFiles.length;
      toast.success(`${uploadedCount} photo(s) added to gallery!`);
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadProgress(0);

      // Refresh gallery photos and event list
      loadGalleryPhotos(selectedEvent._id, 1);
      setReload((r) => r + 1);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err?.message || err?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Lightbox handlers
  const handleOpenLightbox = (index) => {
    setActivePhotoIndex(index);
    setCaptionInput(galleryPhotos[index]?.caption || '');
    setEditingCaption(false);
    setLightboxOpen(true);
  };

  const handleNextPhoto = (e) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex < galleryPhotos.length - 1) {
      const nextIdx = activePhotoIndex + 1;
      setActivePhotoIndex(nextIdx);
      setCaptionInput(galleryPhotos[nextIdx]?.caption || '');
      setEditingCaption(false);
    }
  };

  const handlePrevPhoto = (e) => {
    if (e) e.stopPropagation();
    if (activePhotoIndex > 0) {
      const prevIdx = activePhotoIndex - 1;
      setActivePhotoIndex(prevIdx);
      setCaptionInput(galleryPhotos[prevIdx]?.caption || '');
      setEditingCaption(false);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, activePhotoIndex, galleryPhotos]);

  // Delete a Photo
  const handleDeletePhoto = (photo, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: 'Delete Photo?',
      text: 'This image will be permanently removed from Cloudinary and this gallery.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await eventApi.deletePhoto(selectedEvent._id, photo._id);
        toast.success('Photo removed');

        // If in lightbox, step back or close
        if (lightboxOpen) {
          if (galleryPhotos.length <= 1) {
            setLightboxOpen(false);
          } else if (activePhotoIndex >= galleryPhotos.length - 1) {
            setActivePhotoIndex((prev) => Math.max(0, prev - 1));
          }
        }

        loadGalleryPhotos(selectedEvent._id, galleryPage);
        setReload((r) => r + 1);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete photo');
      }
    });
  };

  // Set as Event Cover Photo
  const handleSetCoverPhoto = async (photo, e) => {
    if (e) e.stopPropagation();
    try {
      await eventApi.setCoverPhoto(selectedEvent._id, photo._id);
      toast.success('Event cover photo updated!');
      setReload((r) => r + 1);
    } catch (err) {
      toast.error('Failed to set cover photo');
    }
  };

  // Save updated photo caption
  const handleSaveCaption = async () => {
    const currentPhoto = galleryPhotos[activePhotoIndex];
    if (!currentPhoto) return;

    try {
      const updated = await eventApi.updatePhotoCaption(selectedEvent._id, currentPhoto._id, {
        caption: captionInput,
      });
      setGalleryPhotos((prev) =>
        prev.map((p) => (p._id === currentPhoto._id ? { ...p, caption: captionInput } : p))
      );
      setEditingCaption(false);
      toast.success('Caption updated');
    } catch (err) {
      toast.error('Failed to update caption');
    }
  };

  // ==========================================
  // CALENDAR VIEW HELPERS
  // ==========================================

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month filler days (to complete 35 or 42 grid cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calendarDate]);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter((e) => {
      const startStr = new Date(e.startDate).toISOString().split('T')[0];
      const endStr = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : startStr;
      return dateStr >= startStr && dateStr <= endStr;
    });
  };

  // Table View columns definition
  const tableColumns = [
    {
      key: 'title',
      label: 'Event',
      render: (r) => {
        const typeMeta = getTypeMeta(r.type);
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 overflow-hidden"
              style={{ backgroundColor: typeMeta.color }}
            >
              {r.coverImage?.url ? (
                <img src={getMediaUrl(r.coverImage.url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <CalendarIcon size={18} />
              )}
            </div>
            <div>
              <span className="font-semibold text-deep block text-sm">{r.title}</span>
              <span className="text-xs text-muted block truncate max-w-xs">{r.description || 'No description'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Category',
      render: (r) => {
        const typeMeta = getTypeMeta(r.type);
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${typeMeta.bg}`}>{typeMeta.label}</span>;
      },
    },
    {
      key: 'date',
      label: 'Date & Time',
      render: (r) => (
        <div className="text-xs text-secondary">
          <div className="font-medium text-deep flex items-center gap-1.5">
            <Clock size={13} className="text-muted" />
            {formatDateRange(r.startDate, r.endDate, r.isFullDay, r.startTime, r.endTime)}
          </div>
          {r.location && (
            <div className="text-muted flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {r.location}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'audience',
      label: 'Audience',
      render: (r) => {
        const audLabels = {
          all: 'All School',
          students: 'Students',
          teachers: 'Teachers',
          parents: 'Parents',
          classes: `${r.targetClasses?.length || 0} Classes`,
        };
        return (
          <span className="inline-flex items-center gap-1 text-xs text-secondary font-medium bg-surface px-2.5 py-1 rounded-lg border border-border">
            <Users size={12} className="text-muted" />
            {audLabels[r.audience] || 'All'}
          </span>
        );
      },
    },
    {
      key: 'photos',
      label: 'Gallery',
      render: (r) => (
        <button
          onClick={(e) => handleOpenGallery(r, e)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-forest/10 text-forest hover:bg-forest/20 transition-colors"
        >
          <ImageIcon size={13} />
          {r.photoCount || 0} Photos
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => {
        const statusColors = {
          upcoming: 'primary',
          ongoing: 'success',
          completed: 'gray',
          cancelled: 'danger',
        };
        return <Badge color={statusColors[r.status] || 'gray'}>{r.status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => handleOpenGallery(r, e)}
            className="p-1.5 text-muted hover:text-forest rounded-lg hover:bg-surface transition-colors"
            title="Open Photo Gallery"
          >
            <ImageIcon size={16} />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={(e) => handleOpenEdit(r, e)}
                className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-surface transition-colors"
                title="Edit Event"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => handleDeleteEvent(r, e)}
                className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"
                title="Delete Event"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="School Events & Gallery"
        description="Plan campus celebrations, holidays, academic milestones, and manage photo galleries"
        action={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button onClick={handleOpenCreate} className="shadow-sm">
                <Plus size={16} className="mr-2" />
                New Event
              </Button>
            )}
          </div>
        }
      />

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Events</p>
            <h3 className="text-2xl font-bold text-deep mt-1">{stats.total}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <CalendarIcon size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Upcoming</p>
            <h3 className="text-2xl font-bold text-forest mt-1">{stats.upcoming}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Sparkles size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-secondary mt-1">{stats.completed}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface text-secondary flex items-center justify-center">
            <Check size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Gallery Photos</p>
            <h3 className="text-2xl font-bold text-deep mt-1">{stats.totalPhotos}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Camera size={20} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search, and Filters */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white text-forest shadow-xs' : 'text-secondary hover:text-deep'
              }`}
            >
              <Grid size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-forest shadow-xs' : 'text-secondary hover:text-deep'
              }`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar' ? 'bg-white text-forest shadow-xs' : 'text-secondary hover:text-deep'
              }`}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>

          {/* Search Input (Disabled in Calendar View) */}
          {viewMode !== 'calendar' && (
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search events by title, venue, or details..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:bg-white transition-all"
              />
            </div>
          )}
        </div>

        {/* Filter Dropdowns */}
        {viewMode !== 'calendar' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-muted flex items-center gap-1 mr-1">
              <Filter size={12} /> Filters:
            </span>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-surface border border-border rounded-lg text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="all">All Categories</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-surface border border-border rounded-lg text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Timeframe Filter */}
            <select
              value={timeframeFilter}
              onChange={(e) => {
                setTimeframeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-surface border border-border rounded-lg text-deep focus:outline-none focus:ring-1 focus:ring-forest"
            >
              <option value="all">Any Date</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="today">Today</option>
              <option value="past">Past Events</option>
            </select>

            {(typeFilter !== 'all' || statusFilter !== 'all' || timeframeFilter !== 'all' || search) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setTimeframeFilter('all');
                  setSearch('');
                  setPage(1);
                }}
                className="text-xs font-semibold text-danger hover:underline ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-border rounded-2xl p-5 h-72 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No events found"
              description="Create a new event or adjust your search filters to explore school events."
              action={
                isAdmin && (
                  <Button onClick={handleOpenCreate}>
                    <Plus size={16} className="mr-2" /> New Event
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((evt) => {
                const typeMeta = getTypeMeta(evt.type);
                return (
                  <div
                    key={evt._id}
                    onClick={() => handleOpenGallery(evt)}
                    className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-200 flex flex-col cursor-pointer"
                  >
                    {/* Event Banner / Cover Image */}
                    <div className="relative h-44 bg-surface overflow-hidden">
                      {evt.coverImage?.url ? (
                        <img
                          src={getMediaUrl(evt.coverImage.url)}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-white"
                          style={{
                            background: `linear-gradient(135deg, ${typeMeta.color}dd, ${typeMeta.color}88)`,
                          }}
                        >
                          <CalendarIcon size={36} strokeWidth={1.8} className="opacity-80" />
                          <span className="text-xs font-semibold mt-2 tracking-wide uppercase opacity-90">
                            {typeMeta.label}
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-md shadow-xs ${typeMeta.bg}`}>
                          {typeMeta.label}
                        </span>

                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg backdrop-blur-md shadow-xs capitalize ${
                            evt.status === 'upcoming'
                              ? 'bg-forest/90 text-white'
                              : evt.status === 'ongoing'
                              ? 'bg-amber-500/90 text-white'
                              : evt.status === 'completed'
                              ? 'bg-slate-700/80 text-white'
                              : 'bg-rose-500/90 text-white'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </div>

                      {/* Photo count floating pill */}
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <Camera size={13} />
                        <span>{evt.photoCount || 0} Photos</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-base text-deep group-hover:text-forest transition-colors line-clamp-1">
                          {evt.title}
                        </h3>

                        {evt.description && (
                          <p className="text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {/* Metadata Chips */}
                      <div className="space-y-2 text-xs text-secondary pt-2 border-t border-border/60">
                        <div className="flex items-center gap-2 text-deep font-medium">
                          <Clock size={14} className="text-forest shrink-0" />
                          <span>{formatDateRange(evt.startDate, evt.endDate, evt.isFullDay, evt.startTime, evt.endTime)}</span>
                        </div>

                        {evt.location && (
                          <div className="flex items-center gap-2 text-secondary truncate">
                            <MapPin size={14} className="text-muted shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 font-medium text-muted">
                            <Users size={13} />
                            {evt.audience === 'all'
                              ? 'All School'
                              : evt.audience === 'classes'
                              ? `${evt.targetClasses?.length || 0} Classes`
                              : `${evt.audience}`}
                          </span>

                          {/* Quick Admin Actions */}
                          {isAdmin && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleOpenEdit(evt, e)}
                                className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-surface transition-colors"
                                title="Edit Event"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteEvent(evt, e)}
                                className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"
                                title="Delete Event"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted">
                Showing {events.length} of {meta.total} events
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold text-deep px-2">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Table / List View */}
      {viewMode === 'table' && (
        <DataTable
          columns={tableColumns}
          data={events}
          loading={loading}
          meta={meta}
          onPageChange={(p) => setPage(p)}
          onRowClick={(r) => handleOpenGallery(r)}
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-deep">
                {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h2>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold bg-surface hover:bg-border/60 text-secondary rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
                }
                className="p-2 text-secondary hover:text-deep hover:bg-surface rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
                }
                className="p-2 text-secondary hover:text-deep hover:bg-surface rounded-lg transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border/60 rounded-xl overflow-hidden border border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-surface py-2 text-center text-xs font-bold text-muted uppercase">
                {day}
              </div>
            ))}

            {calendarDays.map((d, index) => {
              const dateEvents = getEventsForDate(d.date);
              const isToday = d.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-[110px] p-2 bg-white flex flex-col justify-between transition-colors ${
                    !d.isCurrentMonth ? 'bg-surface/50 text-muted' : 'text-deep'
                  } ${isToday ? 'ring-2 ring-forest ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-forest text-white' : ''
                      }`}
                    >
                      {d.date.getDate()}
                    </span>

                    {dateEvents.length > 0 && (
                      <span className="text-[10px] text-muted font-medium">
                        {dateEvents.length} event{dateEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Event Pills */}
                  <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-thin">
                    {dateEvents.map((evt) => {
                      const typeMeta = getTypeMeta(evt.type);
                      return (
                        <button
                          key={evt._id}
                          onClick={() => handleOpenGallery(evt)}
                          className="w-full text-left px-2 py-1 rounded text-[11px] font-semibold truncate flex items-center gap-1.5 transition-opacity hover:opacity-85 shadow-2xs"
                          style={{
                            backgroundColor: `${typeMeta.color}18`,
                            color: typeMeta.color,
                            borderLeft: `3px solid ${typeMeta.color}`,
                          }}
                        >
                          <span className="truncate">{evt.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EVENT CREATE / EDIT MODAL                                */}
      {/* ======================================================== */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Create New School Event'}
        size="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Input
            label="Event Title *"
            placeholder="e.g. Independence Day Celebration, Annual Sports Meet"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Category *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={EVENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />

            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={STATUS_OPTIONS.filter((s) => s.value !== 'all')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date *"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="End Date (Optional)"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          {/* Time & Full Day Options */}
          <div className="p-3 bg-surface rounded-xl border border-border space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-deep cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFullDay}
                onChange={(e) => setForm({ ...form, isFullDay: e.target.checked })}
                className="w-4 h-4 rounded text-forest focus:ring-forest accent-forest"
              />
              Full-Day Event
            </label>

            {!form.isFullDay && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Input
                  type="time"
                  label="Start Time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
                <Input
                  type="time"
                  label="End Time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location / Venue"
              placeholder="e.g. Main Auditorium, Sports Ground"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <Select
              label="Audience Target"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              options={AUDIENCE_OPTIONS}
            />
          </div>

          {/* Specific Class Target selection */}
          {form.audience === 'classes' && (
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Select Target Classes</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-surface rounded-xl border border-border">
                {classesList.map((cls) => {
                  const isChecked = form.targetClasses.includes(cls._id);
                  return (
                    <label key={cls._id} className="flex items-center gap-2 text-xs text-deep cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...form.targetClasses, cls._id]
                            : form.targetClasses.filter((id) => id !== cls._id);
                          setForm({ ...form, targetClasses: updated });
                        }}
                        className="w-3.5 h-3.5 rounded text-forest accent-forest"
                      />
                      {cls.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">Description / Agenda</label>
            <textarea
              rows={3}
              placeholder="Detailed description, special instructions, or program agenda..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* EVENT DETAILS & PHOTO GALLERY MODAL / DRAWER             */}
      {/* ======================================================== */}
      {selectedEvent && (
        <Modal
          isOpen={galleryModalOpen}
          onClose={() => setGalleryModalOpen(false)}
          title={selectedEvent.title}
          size="2xl"
        >
          <div className="space-y-6">
            {/* Event Summary Banner */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getTypeMeta(selectedEvent.type).bg}`}>
                    {getTypeMeta(selectedEvent.type).label}
                  </span>
                  <Badge color={selectedEvent.status === 'upcoming' ? 'primary' : 'success'}>
                    {selectedEvent.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted flex items-center gap-2">
                  <span>Created by {selectedEvent.createdBy?.firstName || 'Admin'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                <div className="flex items-center gap-1.5 font-medium text-deep">
                  <Clock size={14} className="text-forest" />
                  {formatDateRange(
                    selectedEvent.startDate,
                    selectedEvent.endDate,
                    selectedEvent.isFullDay,
                    selectedEvent.startTime,
                    selectedEvent.endTime
                  )}
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-muted" />
                    {selectedEvent.location}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-muted" />
                  Audience:{' '}
                  <span className="capitalize font-medium text-deep">
                    {selectedEvent.audience === 'all' ? 'All School' : selectedEvent.audience}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <p className="text-xs text-secondary leading-relaxed pt-2 border-t border-border/60">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            {/* Gallery Section Header & Uploader */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-deep flex items-center gap-2">
                    <Camera size={18} className="text-forest" />
                    Event Photo Gallery
                  </h4>
                  <p className="text-xs text-muted">
                    {galleryPhotos.length} photo{galleryPhotos.length !== 1 ? 's' : ''} stored securely on Cloudinary
                  </p>
                </div>

                {canManagePhotos && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <UploadCloud size={15} className="mr-1.5" />
                      Add Photos
                    </Button>
                  </div>
                )}
              </div>

              {/* Upload Pending Files Preview Strip */}
              {selectedFiles.length > 0 && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>
                      {selectedFiles.length} photo(s) selected for upload
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFiles([]);
                        setFilePreviews([]);
                      }}
                      className="text-emerald-700 hover:text-danger text-xs font-bold"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Thumbnail Preview strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {filePreviews.map((preview, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-300 shrink-0 group">
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Upload Progress Bar */}
                  {uploading && (
                    <div className="space-y-1">
                      <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-forest h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium text-right">
                        Uploading to Cloudinary... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFiles([]);
                        setFilePreviews([]);
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleUploadPhotos} loading={uploading}>
                      Upload Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Photos Grid */}
              {galleryLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-surface animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : galleryPhotos.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-border rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface text-muted flex items-center justify-center mx-auto">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h5 className="font-bold text-deep text-sm">No photos in this gallery yet</h5>
                    <p className="text-xs text-muted mt-0.5">
                      {canManagePhotos
                        ? 'Upload high-resolution event photos to preserve and share memories.'
                        : 'No photos have been uploaded for this event yet.'}
                    </p>
                  </div>
                  {canManagePhotos && (
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud size={14} className="mr-1.5" /> Upload Photos
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {galleryPhotos.map((photo, index) => {
                    const isCover = selectedEvent.coverImage?.publicId === photo.publicId;
                    return (
                      <div
                        key={photo._id}
                        onClick={() => handleOpenLightbox(index)}
                        className="group relative aspect-square bg-surface rounded-2xl overflow-hidden border border-border cursor-pointer shadow-2xs hover:shadow-card transition-all"
                      >
                        <img
                          src={getMediaUrl(photo.url)}
                          alt={photo.caption || 'Event photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top indicators */}
                        {isCover && (
                          <div className="absolute top-2 left-2 bg-forest text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <Star size={10} fill="white" /> Cover
                          </div>
                        )}

                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 text-white">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={(e) => handleSetCoverPhoto(photo, e)}
                                  className="p-1.5 bg-black/50 hover:bg-forest rounded-lg backdrop-blur-xs transition-colors"
                                  title="Set as Event Cover"
                                >
                                  <Star size={13} fill={isCover ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={(e) => handleDeletePhoto(photo, e)}
                                  className="p-1.5 bg-black/50 hover:bg-danger rounded-lg backdrop-blur-xs transition-colors"
                                  title="Delete Photo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>

                          {photo.caption && (
                            <p className="text-[11px] font-medium text-white line-clamp-1 truncate">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setGalleryModalOpen(false)}>
                Close Gallery
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* FULLSCREEN INTERACTIVE LIGHTBOX                          */}
      {/* ======================================================== */}
      {lightboxOpen && galleryPhotos[activePhotoIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                Photo {activePhotoIndex + 1} of {galleryPhotos.length}
              </span>
              <span className="text-xs text-white/70 hidden sm:inline">
                {selectedEvent?.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getMediaUrl(galleryPhotos[activePhotoIndex].url)}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Open / Download Full Image"
              >
                <Download size={18} />
              </a>

              {isAdmin && (
                <>
                  <button
                    onClick={(e) => handleSetCoverPhoto(galleryPhotos[activePhotoIndex], e)}
                    className="p-2 text-white/80 hover:text-forest bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                    title="Set as Cover Photo"
                  >
                    <Star size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDeletePhoto(galleryPhotos[activePhotoIndex], e)}
                    className="p-2 text-white/80 hover:text-rose-400 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                    title="Delete Photo"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}

              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors ml-2"
                title="Close Lightbox"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Image Container with Navigation Arrows */}
          <div
            className="relative flex-1 flex items-center justify-center p-2 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            {activePhotoIndex > 0 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105 z-20"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next Arrow */}
            {activePhotoIndex < galleryPhotos.length - 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105 z-20"
                title="Next (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* High-res Image */}
            <img
              src={getMediaUrl(galleryPhotos[activePhotoIndex].url)}
              alt="fullscreen preview"
              className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-all select-none"
            />
          </div>

          {/* Bottom Caption & Info Bar */}
          <div
            className="max-w-2xl mx-auto w-full text-center text-white z-10 space-y-2 bg-black/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {editingCaption ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Enter a caption for this photo..."
                  className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-forest"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveCaption}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingCaption(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs font-medium text-white/90">
                  {galleryPhotos[activePhotoIndex].caption || (
                    <span className="text-white/40 italic">No caption attached</span>
                  )}
                </p>
                {canManagePhotos && (
                  <button
                    onClick={() => {
                      setCaptionInput(galleryPhotos[activePhotoIndex].caption || '');
                      setEditingCaption(true);
                    }}
                    className="text-white/60 hover:text-white p-1 rounded transition-colors"
                    title="Edit Caption"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="text-[11px] text-white/50 flex items-center justify-center gap-4">
              <span>
                Uploaded on {new Date(galleryPhotos[activePhotoIndex].createdAt).toLocaleDateString()}
              </span>
              {galleryPhotos[activePhotoIndex].width && galleryPhotos[activePhotoIndex].height && (
                <span>
                  {galleryPhotos[activePhotoIndex].width} × {galleryPhotos[activePhotoIndex].height} px
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
