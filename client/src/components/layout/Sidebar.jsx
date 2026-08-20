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

const navSections = {
  school_admin: [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'ACADEMICS',
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
      title: 'EXAMINATIONS',
      items: [
        { to: '/exams', icon: Trophy, label: 'Exams' },
        { to: '/marks-entry', icon: ClipboardCheck, label: 'Marks Entry' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/admissions', icon: FileText, label: 'Admissions' },
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
        { to: '/notices', icon: Bell, label: 'Notices' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
        { to: '/parent-meetings', icon: Users, label: 'Parent Meetings' },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { to: '/roles', icon: Shield, label: 'Roles & Permissions' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'OVERVIEW',
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
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'ACADEMICS',
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
      title: 'ADMINISTRATION',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
        { to: '/notices', icon: Bell, label: 'Notices' },
      ],
    },
  ],
  student: [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
      ],
    },
    {
      title: 'SERVICES',
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
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
        { to: '/homework', icon: BookMarked, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
      ],
    },
    {
      title: 'SERVICES',
      items: [
        { to: '/events', icon: Calendar, label: 'Events' },
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
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-white shadow-sm">
              <BookOpen size={16} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-sm font-bold text-deep tracking-tight block leading-tight">Instique</span>
              <span className="text-[10px] text-muted font-normal block leading-tight">School Management</span>
            </div>
          </div>
        )}
        <button
          onClick={() => { toggleSidebar(); setMobileOpen?.(false); }}
          className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-surface transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.title}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen?.(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-sage text-forest font-semibold'
                        : 'text-secondary hover:text-deep hover:bg-surface font-medium'
                    }`
                  }
                >
                  <item.icon size={17} strokeWidth={1.8} className="shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 py-3 border-t border-border bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-secondary hover:text-danger hover:bg-danger-light transition-colors"
        >
          <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-border transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-[220px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-deep/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-[230px] bg-white border-r border-border z-50 animate-slide-right shadow-modal">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
