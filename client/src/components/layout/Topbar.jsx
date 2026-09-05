import { Bell, Calendar, Clock, Menu, Search, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { notificationApi } from '../../api/notification.api';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../ui/UserAvatar';
import ThemeToggle from '../ui/ThemeToggle';
import SpotlightSearch from '../ui/SpotlightSearch';
import SoundSettings from '../ui/SoundSettings';
import { useUISound } from '../../services/sound';
import { uiSound } from '../../utils/soundManager';

export default function Topbar({ setMobileOpen }) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const { enabled, volume } = useUISound();
  const [unreadCount, setUnreadCount] = useState(0);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const soundMenuRef = useRef(null);

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  }, []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Close sound menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target)) {
        setSoundMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-5 bg-white dark:bg-dark-surface border-b border-border dark:border-dark-border">
      {/* Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-1.5 text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
          onClick={() => { setMobileOpen?.(true); uiSound.tap(); }}
          title="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Global Spotlight Search Trigger */}
        <button
          type="button"
          onClick={() => { setSpotlightOpen(true); uiSound.modal(); }}
          className="relative flex items-center justify-between w-52 sm:w-60 lg:w-64 px-3 py-1.5 bg-slate-50 dark:bg-[#101315] hover:bg-slate-100 dark:hover:bg-[#181D20] border border-border/80 dark:border-[#262A2E] rounded-lg text-xs text-secondary dark:text-slate-400 cursor-pointer transition-all group focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          title="Search students, teachers, classes, pages... (Cmd/Ctrl + K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={13} className="text-muted dark:text-slate-400 group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors shrink-0" />
            <span className="truncate">{user?.role === 'parent' ? 'Search options...' : 'Search students, classes...'}</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-muted dark:text-slate-400 bg-white dark:bg-white/5 border border-border/80 dark:border-white/10 rounded shadow-2xs shrink-0 select-none">
            {isMac ? '⌘ K' : 'Ctrl K'}
          </kbd>
        </button>

        {/* Date & Time Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs font-medium text-secondary dark:text-dark-text-secondary">
          <Calendar size={12} className="text-muted dark:text-dark-text-muted" />
          <span>{todayFormatted}</span>
          <span className="text-border dark:text-dark-border-strong">|</span>
          <Clock size={12} className="text-forest dark:text-emerald-400" />
          <span className="font-mono text-deep dark:text-dark-text font-semibold">{timeFormatted}</span>
        </div>

        {/* UI Sound Controls */}
        <div className="relative" ref={soundMenuRef}>
          <button
            type="button"
            className="p-1.5 text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors flex items-center justify-center"
            onClick={() => { setSoundMenuOpen((prev) => !prev); uiSound.select(); }}
            title={enabled ? `UI Sounds: ON (${Math.round(volume * 100)}%)` : 'UI Sounds: OFF'}
          >
            {enabled && volume > 0 ? (
              <Volume2 size={17} className="text-forest dark:text-emerald-400" />
            ) : (
              <VolumeX size={17} className="text-muted dark:text-dark-text-muted" />
            )}
          </button>

          {soundMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-2xl shadow-xl z-50 animate-scale-in">
              <SoundSettings compact />
            </div>
          )}
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

      {/* Spotlight Search Modal */}
      <SpotlightSearch isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
    </header>
  );
}

