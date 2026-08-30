import { Bell, Calendar, Menu, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../ui/UserAvatar';

export default function Topbar({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');

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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleGlobalSearchKeyDown = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/students?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-5 bg-white border-b border-border">
      {/* Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 text-secondary hover:text-deep rounded-lg hover:bg-surface transition-colors"
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
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search students, classes..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            className="w-56 lg:w-64 pl-8.5 pr-3 py-1.5 bg-slate-50 border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest focus:bg-white transition-all"
          />
        </div>

        {/* Date Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-border rounded-lg text-xs font-medium text-secondary">
          <Calendar size={12} className="text-muted" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-1.5 text-secondary hover:text-deep rounded-lg hover:bg-surface transition-colors"
          onClick={() => navigate('/notices')}
          title="Notifications"
        >
          <Bell size={17} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-danger rounded-full ring-1.5 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border hidden sm:block" />

        {/* User Profile Chip */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface cursor-pointer transition-colors"
          title="Profile & settings"
        >
          <UserAvatar
            src={user?.avatar || user?.avtar}
            role={user?.role || 'admin'}
            gender={user?.gender}
            id={user?._id || user?.id}
            name={user?.name || 'Admin'}
            size="sm"
            className="ring-1 ring-border/60"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-deep leading-tight truncate max-w-[120px]">
              {user?.name || 'Admin'}
            </p>
            <p className="text-[10px] text-muted capitalize leading-tight">
              {user?.role?.replace(/_/g, ' ') || 'School Admin'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
