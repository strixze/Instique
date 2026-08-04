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

const navItems = {
  super_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/schools', icon: School, label: 'Schools' },
    { to: '/subscriptions', icon: DollarSign, label: 'Subscriptions' },
    { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  school_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
    { to: '/admissions', icon: FileText, label: 'Admissions' },
    { to: '/academic', icon: BookOpen, label: 'Academic' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/exams', icon: Trophy, label: 'Exams' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },
    { to: '/notices', icon: Bell, label: 'Notices' },
    { to: '/leaves', icon: Calendar, label: 'Leaves' },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { to: '/roles', icon: Settings, label: 'Roles' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  teacher: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/homework', icon: BookOpen, label: 'Homework' },
    { to: '/exams', icon: Trophy, label: 'Exams' },
    { to: '/syllabus', icon: FileText, label: 'Syllabus' },
    { to: '/recognition', icon: Trophy, label: 'Recognition' },
    { to: '/leaves', icon: Calendar, label: 'Leaves' },
    { to: '/notices', icon: Bell, label: 'Notices' },
  ],
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/homework', icon: BookOpen, label: 'Homework' },
    { to: '/exams', icon: Trophy, label: 'Results' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },
    { to: '/recognition', icon: Trophy, label: 'Achievements' },
    { to: '/notices', icon: Bell, label: 'Notices' },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
  ],
  parent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/homework', icon: BookOpen, label: 'Homework' },
    { to: '/exams', icon: Trophy, label: 'Results' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/notices', icon: Bell, label: 'Notices' },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
  ],
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const userLogout = useUserStore((s) => s.logout);
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const items = navItems[user?.role] || [];

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    userLogout();
    navigate('/login');
    toast.success('Logged out');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-indigo-400">Instique</span>
        )}
        <button onClick={() => { toggleSidebar(); setMobileOpen?.(false); }} className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
          {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`
            }
          >
            <item.icon size={18} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-gray-700/50">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-700/50 transition-colors">
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex flex-col bg-gray-900 border-r border-gray-700/50 transition-all duration-200 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-60 bg-gray-900 border-r border-gray-700/50 z-50 animate-slide-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
