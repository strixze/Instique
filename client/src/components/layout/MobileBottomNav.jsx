import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Calendar, BookMarked,
  GraduationCap, MoreHorizontal, BookOpen, Shield,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { uiSound } from '../../utils/soundManager';
import MobileMoreSheet from './MobileMoreSheet';

/* ── Per-role bottom nav items (max 3-4 + More) ── */
const bottomNavItems = {
  school_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/teachers', icon: GraduationCap, label: 'Teachers' },
  ],
  super_admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/schools', icon: BookOpen, label: 'Schools' },
  ],
  teacher: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  ],
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  ],
  parent: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    { to: '/homework', icon: BookMarked, label: 'Homework' },
  ],
  security_guard: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Gate' },
    { to: '/gate-activity', icon: Shield, label: 'Activity' },
  ],
};

export default function MobileBottomNav({ onMoreTap }) {
  const user = useUserStore((s) => s.user);
  const items = bottomNavItems[user?.role] || bottomNavItems.school_admin;
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const handleMoreClick = () => {
    uiSound.tap?.();
    if (onMoreTap) {
      onMoreTap();
    } else {
      setMoreSheetOpen(true);
    }
  };

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border md:hidden"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div
          className="flex items-stretch justify-around h-16 px-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => uiSound.navigation?.()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary dark:text-emerald-400 font-bold'
                    : 'text-muted dark:text-dark-text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.3 : 1.6}
                    className="mb-0.5"
                  />
                  <span className="truncate max-w-full px-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button — opens mobile bottom sheet */}
          <button
            type="button"
            onClick={handleMoreClick}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 text-[10px] font-medium transition-colors ${
              moreSheetOpen ? 'text-primary dark:text-emerald-400 font-bold' : 'text-muted dark:text-dark-text-muted'
            }`}
            aria-label="More navigation options"
          >
            <MoreHorizontal size={20} strokeWidth={1.6} className="mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Expandable Navigation Bottom Sheet */}
      <MobileMoreSheet isOpen={moreSheetOpen} onClose={() => setMoreSheetOpen(false)} />
    </>
  );
}
