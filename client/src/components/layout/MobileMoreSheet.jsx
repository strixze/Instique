import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, Moon, Sun, Volume2, VolumeX, Shield } from 'lucide-react';
import { useNavSections } from '../../hooks/useNavSections';
import { useUserStore } from '../../store/userStore';
import { authApi } from '../../api/auth.api';
import UserAvatar from '../ui/UserAvatar';
import ThemeToggle from '../ui/ThemeToggle';
import { useUISound } from '../../services/sound';
import { uiSound } from '../../utils/soundManager';
import toast from 'react-hot-toast';

export default function MobileMoreSheet({ isOpen, onClose }) {
  const { sections, user } = useNavSections();
  const navigate = useNavigate();
  const userLogout = useUserStore((s) => s.logout);
  const { enabled, toggleSound } = useUISound();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      const refreshToken = useUserStore.getState().refreshToken;
      await authApi.logout({ refreshToken });
    } catch {}
    userLogout();
    onClose?.();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleItemClick = () => {
    uiSound.navigation?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        className="relative z-10 w-full bg-white dark:bg-dark-surface rounded-t-2xl border-t border-border dark:border-dark-border max-h-[85vh] flex flex-col shadow-2xl animate-slide-up"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 16px))' }}
      >
        {/* Grab bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-dark-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-dark-border">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={user?.avatar || user?.avtar}
              role={user?.role || 'admin'}
              gender={user?.gender}
              id={user?._id || user?.id}
              name={user?.name || 'User'}
              size="sm"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-deep dark:text-dark-text truncate max-w-[180px]">
                {user?.name || 'User Profile'}
              </p>
              <p className="text-[11px] text-muted dark:text-dark-text-muted capitalize">
                {user?.role?.replace(/_/g, ' ') || 'Member'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { uiSound.tap?.(); onClose(); }}
            className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="overflow-y-auto px-4 py-3 space-y-4 flex-1 overscroll-contain">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-muted dark:text-dark-text-muted uppercase tracking-wider px-1">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleItemClick}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[44px] ${
                        isActive
                          ? 'bg-forest/10 dark:bg-emerald-500/15 text-forest dark:text-emerald-400 border border-forest/20 dark:border-emerald-500/30'
                          : 'bg-surface/50 dark:bg-dark-card border border-border/70 dark:border-dark-border text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover'
                      }`
                    }
                  >
                    <item.icon size={16} className="shrink-0 text-muted dark:text-dark-text-muted" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="px-4 pt-3 border-t border-border dark:border-dark-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => { toggleSound?.(); uiSound.select?.(); }}
              className="p-2 text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text rounded-xl border border-border dark:border-dark-border hover:bg-surface dark:hover:bg-dark-hover transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Toggle UI Sounds"
            >
              {enabled ? <Volume2 size={16} className="text-forest dark:text-emerald-400" /> : <VolumeX size={16} className="text-muted" />}
              <span className="hidden xs:inline">{enabled ? 'Sound On' : 'Sound Off'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors border border-rose-200 dark:border-rose-500/20"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
