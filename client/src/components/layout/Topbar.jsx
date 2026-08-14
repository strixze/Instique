import { Bell, Clock, Menu, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount(res.data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const formattedDateTime = time.toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 text-secondary hover:text-deep rounded-lg hover:bg-sage-soft transition-colors" onClick={() => setMobileOpen?.(true)}>
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-secondary bg-sage-soft border border-forest/10 rounded-lg px-3 py-1.5 shadow-sm">
          <Clock size={14} className="text-forest animate-pulse" />
          <span>{formattedDateTime}</span>
        </div>

        <button className="relative p-2 text-secondary hover:text-deep rounded-lg hover:bg-sage-soft transition-colors" onClick={() => navigate('/notifications')}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-danger rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-sage-soft cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-forest flex items-center justify-center">
            <User size={15} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-deep leading-tight">{user?.name}</p>
            <p className="text-xs text-muted capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
