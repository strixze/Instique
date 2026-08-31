import { Bell, Calendar, Clock, Menu, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../ui/UserAvatar';
import ThemeToggle from '../ui/ThemeToggle';

export default function Topbar({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount(res.data?.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const todayFormatted = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const handleGlobalSearchKeyDown = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/students?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-5 bg-white dark:bg-dark-surface border-b border-border dark:border-dark-border">
      {/* Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
          onClick={() => setMobileOpen?.(true)}
          title="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search students, classes..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            className="w-56 lg:w-64 pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-dark-elevated transition-all"
          />
        </div>

        {/* Date & Time Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs font-medium text-secondary dark:text-dark-text-secondary">
          <Calendar size={12} className="text-muted dark:text-dark-text-muted" />
          <span>{todayFormatted}</span>
          <span className="text-border dark:text-dark-border-strong">|</span>
          <Clock size={12} className="text-forest dark:text-emerald-400" />
          <span className="font-mono text-deep dark:text-dark-text font-semibold">{timeFormatted}</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button
          className="relative p-1.5 text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
          onClick={() => navigate('/notices')}
          title="Notifications"
        >
          <Bell size={17} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-danger rounded-full ring-1.5 ring-white dark:ring-dark-surface">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border dark:bg-dark-border hidden sm:block" />

        {/* User Profile Chip */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface dark:hover:bg-dark-hover cursor-pointer transition-colors"
          title="Profile & settings"
        >
          <UserAvatar
            src={user?.avatar || user?.avtar}
            role={user?.role || 'admin'}
            gender={user?.gender}
            id={user?._id || user?.id}
            name={user?.name || 'Admin'}
            size="sm"
            className="ring-1 ring-border/60 dark:ring-dark-border-strong"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-deep dark:text-dark-text leading-tight truncate max-w-[120px]">
              {user?.name || 'Admin'}
            </p>
            <p className="text-[10px] text-muted dark:text-dark-text-muted capitalize leading-tight">
              {user?.role?.replace(/_/g, ' ') || 'School Admin'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
