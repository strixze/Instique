import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Calendar, Users, BookOpen, MoreHorizontal,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { uiSound } from '../../utils/soundManager';

const bottomNavItems = {
  school_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  ],
  teacher: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
  ],
  parent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/homework', icon: BookOpen, label: 'Homework' },
  ],
};

export default function MobileBottomNav({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const items = bottomNavItems[user?.role] || [];

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => uiSound.navigation?.()}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? 'text-forest dark:text-dark-accent'
                  : 'text-muted dark:text-dark-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-forest/10 dark:bg-dark-accent-soft'
                    : ''
                }`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-forest dark:text-dark-accent' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => {
            uiSound.tap?.();
            setMobileOpen?.(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 w-full h-full text-muted dark:text-dark-text-muted"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl">
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-semibold leading-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
