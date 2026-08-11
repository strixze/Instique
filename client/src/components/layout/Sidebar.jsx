import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar, DollarSign,
  Bell, Settings, ChevronLeft, School, FileText, ClipboardList, Trophy,
  MessageSquare, LogOut, Menu,
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
        { to: '/exams', icon: Trophy, label: 'Exams' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/admissions', icon: FileText, label: 'Admissions' },
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/notices', icon: Bell, label: 'Notices' },
        { to: '/leaves', icon: Calendar, label: 'Leaves' },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { to: '/roles', icon: Settings, label: 'Roles' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ],
  super_admin: [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/schools', icon: School, label: 'Schools' },
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
        { to: '/homework', icon: BookOpen, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Exams' },
        { to: '/syllabus', icon: FileText, label: 'Syllabus' },
        { to: '/recognition', icon: Trophy, label: 'Recognition' },
      ],
    },
    {
      title: 'OTHER',
      items: [
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
        { to: '/homework', icon: BookOpen, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
      ],
    },
    {
      title: 'OTHER',
      items: [
        { to: '/fees', icon: DollarSign, label: 'Fees' },
        { to: '/recognition', icon: Trophy, label: 'Achievements' },
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
        { to: '/homework', icon: BookOpen, label: 'Homework' },
        { to: '/exams', icon: Trophy, label: 'Results' },
        { to: '/timetable', icon: Calendar, label: 'Timetable' },
      ],
    },
    {
      title: 'OTHER',
      items: [
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
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center">
              <School size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-deep tracking-tight">Instique</span>
          </div>
        )}
        <button onClick={() => { toggleSidebar(); setMobileOpen?.(false); }} className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-sage-soft transition-colors">
          {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.title}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-muted uppercase tracking-widest">
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
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-sage text-forest'
                        : 'text-secondary hover:text-deep hover:bg-sage-soft'
                    }`
                  }
                >
                  <item.icon size={18} strokeWidth={isCollapsedActive(item) ? 2.5 : 1.75} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-border">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-secondary hover:text-danger hover:bg-danger-light transition-colors">
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-border transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-[232px]'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-deep/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-[232px] bg-white border-r border-border z-50 animate-slide-right shadow-modal">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

// Helper to avoid runtime errors — strokeWidth is set via className already
function isCollapsedActive() {
  return false;
}
