import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar, DollarSign,
  Bell, Settings, ChevronLeft, FileText, ClipboardList, Trophy,
  MessageSquare, LogOut, Menu, ClipboardCheck, Award, BarChart3, Shield,
  BookMarked,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useAppStore } from '../../store/appStore';
import { authApi } from '../../api/auth.api';
import { settingApi } from '../../api/setting.api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uiSound } from '../../utils/soundManager';

const navSections = {
  school_admin: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/students', icon: Users, label: 'Students', feature: 'students' },
        { to: '/teachers', icon: GraduationCap, label: 'Teachers', feature: 'teachers' },
        { to: '/academic', icon: BookOpen, label: 'Classes', feature: 'classes' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus', feature: 'syllabus' },
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
      ],
    },
    {
      title: 'Examinations',
      items: [
        { to: '/exams', icon: Trophy, label: 'Exams', feature: 'exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry', feature: 'marksEntry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/admissions', icon: FileText, label: 'Admissions', feature: 'admissions' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees' },
        { to: '/leaves', icon: Calendar, label: 'Leaves', feature: 'leaves' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Reports & Analytics', feature: 'reports' },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/roles', icon: Shield, label: 'Roles & Permissions' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/schools', icon: BookOpen, label: 'Schools' },
        { to: '/subscriptions', icon: DollarSign, label: 'Subscriptions' },
        { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  teacher: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
        { to: '/exams', icon: Trophy, label: 'Exams', feature: 'exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry', feature: 'marksEntry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus', feature: 'syllabus' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
        { to: '/leaves', icon: Calendar, label: 'Leaves', feature: 'leaves' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
      ],
    },
  ],
  student: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework' },
        { to: '/exams', icon: Trophy, label: 'Results', feature: 'exams' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
      ],
    },
  ],
  parent: [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { to: '/attendance', icon: ClipboardList, label: 'Attendance', feature: 'attendance', parentVisKey: 'attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework', feature: 'homework', parentVisKey: 'homework' },
        { to: '/syllabus', icon: BookOpen, label: 'Syllabus', feature: 'syllabus' },
        { to: '/exams', icon: Trophy, label: 'Results', feature: 'exams', parentVisKey: 'marks' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard', feature: 'leaderboard', parentVisKey: 'marks' },
        { to: '/timetable', icon: Calendar, label: 'Timetable', feature: 'timetable', parentVisKey: 'timetable' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
        { to: '/leaves', icon: Calendar, label: 'Leave Requests', feature: 'leaves', parentVisKey: 'leaves' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings', feature: 'parentMeetings' },
        { to: '/fees', icon: DollarSign, label: 'Fees', feature: 'fees', parentVisKey: 'fees' },
        { to: '/notices', icon: Bell, label: 'Notices', feature: 'notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints', feature: 'complaints' },
      ],
    },
  ],
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const userLogout = useUserStore((s) => s.logout);
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const [publicSettings, setPublicSettings] = useState(null);

  useEffect(() => {
    let active = true;
    if (user?.role && user.role !== 'super_admin') {
      settingApi.getPublic()
        .then((res) => {
          if (active) {
            const data = res.data?.data || res.data;
            setPublicSettings(data || {});
          }
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [user?.role]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const rawSections = navSections[user?.role] || [];
  const sections = useMemo(() => {
    if (!publicSettings) return rawSections;
    const features = publicSettings.features || {};
    const parentVisibility = publicSettings.visibility?.parent || {};
    const teacherPolicy = publicSettings.visibility?.teacherPolicy || {};

    return rawSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => {
          if (item.feature && features[item.feature] === false) return false;
          if (user?.role === 'parent' && item.parentVisKey) {
            if (parentVisibility[item.parentVisKey] === false) return false;
          }
          if (user?.role === 'teacher' && item.to === '/fees') {
            if (teacherPolicy.canViewFeeInfo !== true) return false;
          }
          return true;
        }),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [rawSections, publicSettings, user?.role]);

  const handleLogout = async () => {
    try {
      const refreshToken = useUserStore.getState().refreshToken;
      await authApi.logout({ refreshToken });
    } catch {}
    userLogout();
    navigate('/login');
    toast.success('Logged out');
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-dark-surface">
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-border dark:border-dark-border h-14 shrink-0 ${
            isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-forest dark:bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <BookOpen size={14} strokeWidth={2.2} />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold text-deep dark:text-dark-text tracking-tight block">Instique</span>
                <span className="text-[10px] text-muted dark:text-dark-text-muted font-normal">School Management</span>
              </div>
            </div>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={() => {
                uiSound.tap?.();
                setMobileOpen?.(false);
              }}
              className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                uiSound.tap?.();
                toggleSidebar();
              }}
              className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <Menu size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className={isCollapsed ? 'px-2' : 'px-3'}>
              {!isCollapsed && (
                <p className="px-2 mb-1.5 text-[10px] font-bold text-muted/80 dark:text-dark-text-muted/80 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      uiSound.navigation?.();
                      if (isMobile) setMobileOpen?.(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} px-2 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                        isActive
                          ? 'bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-dark-accent font-semibold'
                          : 'text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-hover font-medium'
                      }`
                    }
                  >
                    <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className={`py-3 border-t border-border dark:border-dark-border shrink-0 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <button
            type="button"
            onClick={() => {
              if (isMobile) setMobileOpen?.(false);
              handleLogout();
            }}
            title={isCollapsed ? 'Logout' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2'} w-full py-2 rounded-lg text-[13px] font-medium text-secondary dark:text-dark-text-secondary hover:text-danger dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors`}
          >
            <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-dark-surface border-r border-border dark:border-dark-border transition-all duration-200 ${
          sidebarCollapsed ? 'w-14' : 'w-[216px]'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Sidebar Overlay (Bottom Sheet) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 right-0 bottom-0 max-h-[80vh] bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border rounded-t-2xl z-50 animate-slide-up shadow-modal">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
