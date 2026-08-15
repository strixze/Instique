import { Bell, Calendar, Menu, Search, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';

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
    year: 'numeric',
  });

  const handleGlobalSearchKeyDown = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/students?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const getInitial = (name = 'Admin') => {
    return name.trim().charAt(0).toUpperCase() || 'A';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-border">
      {/* Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 text-secondary hover:text-deep rounded-lg hover:bg-surface transition-colors"
          onClick={() => setMobileOpen?.(true)}
          title="Open menu"
        >
          <Menu size={19} />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
        {/* Global Search Input */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search students, classes, fees..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            className="w-60 lg:w-72 pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-xs text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
          />
        </div>

        {/* Date Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium text-secondary shadow-2xs">
          <Calendar size={13} className="text-muted" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-secondary hover:text-deep rounded-lg hover:bg-surface transition-colors"
          onClick={() => navigate('/notices')}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute 1.5 top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-white bg-danger rounded-full ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Chip */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-surface cursor-pointer transition-colors"
          title="User profile"
        >
          <div className="w-8 h-8 rounded-full bg-forest-dark text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {getInitial(user?.name)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-deep leading-tight truncate max-w-[120px]">
              {user?.name || 'Admin'}
            </p>
            <p className="text-[10px] text-muted capitalize leading-tight">
              {user?.role?.replace('_', ' ') || 'School Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
