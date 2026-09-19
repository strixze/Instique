import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, Users, BookOpen, Calendar, DollarSign,
  Bell, Settings, ChevronLeft, FileText, ClipboardList, Trophy,
  MessageSquare, LogOut, Menu, ClipboardCheck, Award, BarChart3, Shield,
  BookMarked,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useAppStore } from '../../store/appStore';
import { authApi } from '../../api/auth.api';
import { settingApi } from '../../api/setting.api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uiSound } from '../../utils/soundManager';

import { useNavSections } from '../../hooks/useNavSections';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { sections, user } = useNavSections();
  const userLogout = useUserStore((s) => s.logout);
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const handleLogout = async () => {
    try {
      const refreshToken = useUserStore.getState().refreshToken;
      await authApi.logout({ refreshToken });
    } catch {}
    userLogout();
    navigate('/login');
    toast.success('Logged out');
  };

  const renderSidebarContent = (isMobile = false) => {
    const isCollapsed = isMobile ? false : sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-dark-surface">
        {/* Brand Header */}
        <div
          className={`flex items-center border-b border-border dark:border-dark-border h-14 shrink-0 ${
            isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-forest dark:bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <BookOpen size={14} strokeWidth={2.2} />
              </div>
              <div className="leading-none">
                <span className="text-sm font-bold text-deep dark:text-dark-text tracking-tight block">Instique</span>
                <span className="text-[10px] text-muted dark:text-dark-text-muted font-normal">School Management</span>
              </div>
            </div>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={() => {
                uiSound.tap?.();
                setMobileOpen?.(false);
              }}
              className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                uiSound.tap?.();
                toggleSidebar();
              }}
              className="p-1.5 text-muted dark:text-dark-text-muted hover:text-deep dark:hover:text-dark-text rounded-lg hover:bg-surface dark:hover:bg-dark-hover transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <Menu size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className={isCollapsed ? 'px-2' : 'px-3'}>
              {!isCollapsed && (
                <p className="px-2 mb-1.5 text-[10px] font-bold text-muted/80 dark:text-dark-text-muted/80 uppercase tracking-widest">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      uiSound.navigation?.();
                      if (isMobile) setMobileOpen?.(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} px-2 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                        isActive
                          ? 'bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-dark-accent font-semibold'
                          : 'text-secondary dark:text-dark-text-secondary hover:text-deep dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-hover font-medium'
                      }`
                    }
                  >
                    <item.icon size={16} strokeWidth={1.8} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className={`py-3 border-t border-border dark:border-dark-border shrink-0 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <button
            type="button"
            onClick={() => {
              if (isMobile) setMobileOpen?.(false);
              handleLogout();
            }}
            title={isCollapsed ? 'Logout' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2'} w-full py-2 rounded-lg text-[13px] font-medium text-secondary dark:text-dark-text-secondary hover:text-danger dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors`}
          >
            <LogOut size={16} strokeWidth={1.8} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-dark-surface border-r border-border dark:border-dark-border transition-all duration-200 ${
          sidebarCollapsed ? 'w-14' : 'w-[216px]'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Sidebar Overlay (< 768px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 right-0 bottom-0 h-[80vh] max-h-[80vh] overflow-y-auto bg-white dark:bg-dark-surface border-t border-border dark:border-dark-border rounded-t-2xl z-50 animate-slide-up shadow-modal">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
