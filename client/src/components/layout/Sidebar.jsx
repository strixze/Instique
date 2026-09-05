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
        { to: '/students', icon: Users, label: 'Students' },
        { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
        { to: '/academic', icon: BookOpen, label: 'Classes' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
      ],
    },
    {
      title: 'Examinations',
      items: [
        { to: '/exams', icon: Trophy, label: 'Exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/admissions', icon: FileText, label: 'Admissions' },
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
        { to: '/notices', icon: Bell, label: 'Notices' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
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
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
        { to: '/notices', icon: Bell, label: 'Notices' },
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
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/notices', icon: Bell, label: 'Notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
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
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
      ],
    },
    {
      title: 'Services',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings' },
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/notices', icon: Bell, label: 'Notices' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
      ],
    },
  ],
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const userLogout = useUserStore((s) => s.logout);
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const sections = navSections[user?.role] || [];

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    userLogout();
    navigate('/login');
    toast.success('Logged out');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-dark-surface">
      {/* Brand Header */}
      <div
        className={`flex items-center border-b border-border dark:border-dark-border h-14 shrink-0 ${
          sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        }`}
      >
        {!sidebarCollapsed && (
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
        <button
          onClick={() => { toggleSidebar(); setMobileOpen?.(false); }}
          className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <Menu size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.title} className={sidebarCollapsed ? 'px-2' : 'px-3'}>
            {!sidebarCollapsed && (
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
                    uiSound.navigation();
                    setMobileOpen?.(false);
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'} px-2 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-dark-accent font-semibold'
                        : 'text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-hover font-medium'
                    }`
                  }
                >
                  <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className={`py-3 border-t border-border dark:border-dark-border shrink-0 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        <button
          onClick={handleLogout}
          title="Logout"
          className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2'} w-full py-2 rounded-lg text-[13px] font-medium text-secondary dark:text-dark-text-secondary hover:text-danger dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors`}
        >
          <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-dark-surface border-r border-border dark:border-dark-border transition-all duration-200 ${
          sidebarCollapsed ? 'w-14' : 'w-[216px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white dark:bg-dark-surface border-r border-border dark:border-dark-border z-50 animate-slide-right shadow-modal">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
