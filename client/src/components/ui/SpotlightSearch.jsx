import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Loader2, Users, UserCheck, GraduationCap,
  LayoutDashboard, UserPlus, Calendar, Sliders, CheckCircle2,
  BookOpen, FileText, Edit3, Trophy, DollarSign, Bell,
  CalendarDays, MessageSquare, Clock, AlertCircle, Shield,
  Settings, BarChart3, ChevronRight, Layers3
} from 'lucide-react';
import { studentApi } from '../../api/student.api';
import { teacherApi } from '../../api/teacher.api';
import { academicApi } from '../../api/academic.api';
import UserAvatar from './UserAvatar';

// All main application navigation pages
const APP_PAGES = [
  { id: 'dash', title: 'Dashboard', subtitle: 'Overview of school activities and stats', path: '/dashboard', icon: LayoutDashboard },
  { id: 'stud', title: 'Students', subtitle: 'Manage student directory and profiles', path: '/students', icon: Users },
  { id: 'teach', title: 'Teachers', subtitle: 'Manage faculty profiles and assignments', path: '/teachers', icon: UserCheck },
  { id: 'adm', title: 'Admissions', subtitle: 'Process new student applications', path: '/admissions', icon: UserPlus },
  { id: 'acad', title: 'Academic & Classes', subtitle: 'Class, section, and subject configuration', path: '/academic', icon: GraduationCap },
  { id: 'tt', title: 'Timetable', subtitle: 'View and manage class schedules', path: '/timetable', icon: Calendar },
  { id: 'ttc', title: 'Timetable Settings', subtitle: 'Configure periods and generation rules', path: '/timetable-config', icon: Sliders },
  { id: 'att', title: 'Attendance', subtitle: 'Track daily class and student attendance', path: '/attendance', icon: CheckCircle2 },
  { id: 'hw', title: 'Homework', subtitle: 'Assign and inspect class assignments', path: '/homework', icon: BookOpen },
  { id: 'ex', title: 'Exams', subtitle: 'Schedule exams and grading periods', path: '/exams', icon: FileText },
  { id: 'mk', title: 'Marks Entry', subtitle: 'Input student scores and grades', path: '/marks-entry', icon: Edit3 },
  { id: 'lb', title: 'Leaderboard', subtitle: 'Top performing students and ranks', path: '/leaderboard', icon: Trophy },
  { id: 'fe', title: 'Fees', subtitle: 'Fee structures, invoices, and payments', path: '/fees', icon: DollarSign },
  { id: 'not', title: 'Notices', subtitle: 'School announcements and notices', path: '/notices', icon: Bell },
  { id: 'ev', title: 'Events', subtitle: 'School calendar and event management', path: '/events', icon: CalendarDays },
  { id: 'pm', title: 'Parent Meetings', subtitle: 'Schedule PTM and parent interactions', path: '/parent-meetings', icon: MessageSquare },
  { id: 'lv', title: 'Leaves', subtitle: 'Teacher and student leave requests', path: '/leaves', icon: Clock },
  { id: 'cm', title: 'Complaints', subtitle: 'Grievances and issue tracking', path: '/complaints', icon: AlertCircle },
  { id: 'rl', title: 'Roles & RBAC', subtitle: 'User roles and system permissions', path: '/roles', icon: Shield },
  { id: 'st', title: 'Settings', subtitle: 'School profile and system preferences', path: '/settings', icon: Settings },
  { id: 'rp', title: 'Reports', subtitle: 'Analytics and downloadable reports', path: '/reports', icon: BarChart3 },
];

export default function SpotlightSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Async search results from backend APIs
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Detect OS for shortcut text
  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  // Filter pages matching query locally
  const matchingPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APP_PAGES.slice(0, 5); // Default top 5 pages when query is empty
    return APP_PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  // Fetch dynamic data when query changes
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setStudents([]);
      setTeachers([]);
      setClasses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [studRes, teachRes, classRes] = await Promise.allSettled([
          studentApi.getAll({ search: q, limit: 5 }),
          teacherApi.getAll({ search: q, limit: 5 }),
          academicApi.getClasses({ search: q, limit: 5 }),
        ]);

        if (studRes.status === 'fulfilled') {
          const list = studRes.value?.data?.students || studRes.value?.data?.data || studRes.value?.data || [];
          setStudents(Array.isArray(list) ? list.slice(0, 4) : []);
        } else {
          setStudents([]);
        }

        if (teachRes.status === 'fulfilled') {
          const list = teachRes.value?.data?.teachers || teachRes.value?.data?.data || teachRes.value?.data || [];
          setTeachers(Array.isArray(list) ? list.slice(0, 4) : []);
        } else {
          setTeachers([]);
        }

        if (classRes.status === 'fulfilled') {
          const list = classRes.value?.data?.classes || classRes.value?.data?.data || classRes.value?.data || [];
          setClasses(Array.isArray(list) ? list.slice(0, 4) : []);
        } else {
          setClasses([]);
        }
      } catch {
        // Silently handle error without crashing
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  // Group all results together into a single flat list for keyboard navigation
  const groupedResults = useMemo(() => {
    const groups = [];

    if (students.length > 0) {
      groups.push({
        category: 'STUDENTS',
        items: students.map((s) => ({
          type: 'student',
          id: `stud-${s._id || s.id}`,
          title: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
          subtitle: `Grade ${s.schoolClass?.name || s.className || ''} ${s.section?.name || s.sectionName || ''} • Roll No. ${s.rollNo || s.admissionNo || '—'}`,
          avatar: s.avatar || s.avtar,
          gender: s.gender,
          route: `/students?search=${encodeURIComponent(s.firstName || '')}`,
          badge: 'Student',
          badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        })),
      });
    }

    if (teachers.length > 0) {
      groups.push({
        category: 'TEACHERS',
        items: teachers.map((t) => ({
          type: 'teacher',
          id: `teach-${t._id || t.id}`,
          title: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher',
          subtitle: t.department || t.qualification || 'Faculty Member',
          avatar: t.avatar || t.avtar,
          gender: t.gender,
          route: `/teachers?search=${encodeURIComponent(t.firstName || '')}`,
          badge: 'Teacher',
          badgeStyle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        })),
      });
    }

    if (classes.length > 0) {
      groups.push({
        category: 'CLASSES',
        items: classes.map((c) => ({
          type: 'class',
          id: `cls-${c._id || c.id}`,
          title: `Class ${c.name}`,
          subtitle: `Sections: ${c.sections?.map((s) => s.name).join(', ') || 'A'} • Capacity: ${c.capacity || 40}`,
          icon: Layers3,
          route: `/academic`,
          badge: 'Class',
          badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        })),
      });
    }

    if (matchingPages.length > 0) {
      groups.push({
        category: 'PAGES',
        items: matchingPages.map((p) => ({
          type: 'page',
          id: `pg-${p.id}`,
          title: p.title,
          subtitle: p.subtitle,
          icon: p.icon,
          route: p.path,
          badge: 'Page',
          badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        })),
      });
    }

    return groups;
  }, [students, teachers, classes, matchingPages]);

  // Flattened array for index selection
  const flatItems = useMemo(() => {
    return groupedResults.flatMap((g) => g.items);
  }, [groupedResults]);

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length, query]);

  // Focus input when opened and freeze background scroll
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle result selection & navigation
  const handleSelect = useCallback(
    (item) => {
      if (!item) return;
      onClose();
      navigate(item.route);
    },
    [navigate, onClose]
  );

  // Keyboard navigation inside modal
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (current) handleSelect(current);
    }
  };

  if (!isOpen) return null;

  let globalIndexCounter = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 pb-10 animate-fade-in">
      {/* Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Centered Spotlight Card */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#101315] border border-border dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 dark:shadow-black/90 overflow-hidden flex flex-col max-h-[80vh] transition-all duration-200 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 dark:border-white/[0.08] gap-3 bg-surface/30 dark:bg-[#15191C]/60 shrink-0">
          <Search size={18} className="text-forest dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search students, teachers, classes, pages..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-deep dark:text-slate-100 placeholder-muted dark:placeholder-slate-500 focus:outline-none"
          />

          {loading ? (
            <Loader2 size={16} className="animate-spin text-forest dark:text-emerald-400 shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted hover:text-deep dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <X size={15} />
            </button>
          ) : null}

          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-secondary dark:text-slate-400 bg-surface dark:bg-white/5 border border-border/80 dark:border-white/10 rounded-md shadow-2xs shrink-0 select-none">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div ref={listRef} className="overflow-y-auto scrollbar-thin p-2 space-y-3 flex-1 min-h-[220px]">
          {groupedResults.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Search size={28} className="text-muted/50 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-deep dark:text-slate-200">No results found</p>
              <p className="text-xs text-secondary dark:text-slate-400 mt-1 max-w-sm">
                No matching students, teachers, classes, or pages found for &quot;{query}&quot;.
              </p>
            </div>
          ) : (
            groupedResults.map((group) => (
              <div key={group.category} className="space-y-1">
                <div className="px-3 pt-2 pb-1 text-[11px] font-extrabold tracking-wider text-secondary dark:text-slate-400 uppercase select-none">
                  {group.category}
                </div>

                {group.items.map((item) => {
                  globalIndexCounter++;
                  const currentIndex = globalIndexCounter;
                  const isFocused = currentIndex === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 select-none ${
                        isFocused
                          ? 'bg-forest/10 dark:bg-emerald-500/15 border border-forest/30 dark:border-emerald-500/30 text-deep dark:text-slate-100 shadow-2xs'
                          : 'hover:bg-surface dark:hover:bg-white/[0.03] border border-transparent text-secondary dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Avatar or Icon */}
                        {item.type === 'student' || item.type === 'teacher' ? (
                          <UserAvatar
                            src={item.avatar}
                            name={item.title}
                            gender={item.gender}
                            role={item.type}
                            size="sm"
                            className="shrink-0 ring-1 ring-border/50 dark:ring-white/10"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isFocused
                              ? 'bg-forest/15 dark:bg-emerald-500/20 text-forest dark:text-emerald-400'
                              : 'bg-surface dark:bg-white/5 text-secondary dark:text-slate-400 border border-border/60 dark:border-white/10'
                          }`}>
                            {Icon && <Icon size={16} />}
                          </div>
                        )}

                        {/* Title & Subtitle */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate leading-tight ${
                            isFocused ? 'text-deep dark:text-emerald-300' : 'text-deep dark:text-slate-200'
                          }`}>
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${item.badgeStyle}`}>
                          {item.badge}
                        </span>
                        <ChevronRight size={14} className={`transition-opacity ${isFocused ? 'opacity-100 text-forest dark:text-emerald-400' : 'opacity-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between py-2.5 px-4 bg-surface/60 dark:bg-[#07090B]/80 border-t border-border/60 dark:border-white/[0.06] text-[11px] text-muted dark:text-slate-500 font-medium select-none shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-white/10 border border-border dark:border-white/10 rounded shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-white/10 border border-border dark:border-white/10 rounded shadow-2xs">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-white/10 border border-border dark:border-white/10 rounded shadow-2xs">↵</kbd>
              <span>to select</span>
            </span>
          </div>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-white/10 border border-border dark:border-white/10 rounded shadow-2xs">esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
