import { Bell, Search, Menu, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700" onClick={() => setMobileOpen?.(true)}>
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
          <Search size={16} className="text-gray-500 mr-2" />
          <input className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 w-48" placeholder="Search..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700 transition-colors" onClick={() => navigate('/notifications')}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-200 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
