import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  ArrowLeft,
  Headphones,
  Mail,
  ShieldCheck,
  FileText,
  HelpCircle,
  X,
} from 'lucide-react';
import { useUserStore } from '../store/userStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import CampusIllustration from '../components/illustrations/CampusIllustration';

// Social Media SVG Icons
const SocialIcons = {
  Facebook: () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Twitter: () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
    </svg>
  ),
  Instagram: () => (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
};

export default function NotFound() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [modalContent, setModalContent] = useState(null);

  // Set document title & focus heading on mount
  useEffect(() => {
    document.title = '404 — Page Not Found | Instique';
    const h1 = document.getElementById('notfound-heading');
    h1?.focus();
  }, []);

  const handleGoDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handleGoDashboard();
    }
  };

  const openSupportModal = (type) => {
    if (type === 'support') {
      setModalContent({
        title: 'Instique Support',
        icon: Headphones,
        content: (
          <div className="space-y-3 text-sm text-secondary dark:text-dark-text-secondary">
            <p>Our dedicated support team is available 24/7 to assist you with any campus navigation or account issues.</p>
            <div className="p-3 bg-surface dark:bg-dark-hover rounded-lg space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-deep dark:text-dark-text">
                <Mail size={14} className="text-forest dark:text-emerald-400" />
                <span>support@instique.com</span>
              </div>
              <div className="flex items-center gap-2 text-deep dark:text-dark-text">
                <HelpCircle size={14} className="text-forest dark:text-emerald-400" />
                <span>Help Desk: +1 (800) 555-INST</span>
              </div>
            </div>
            <p className="text-xs text-muted dark:text-dark-text-muted">
              {user ? `Logged in as: ${user.name} (${user.role})` : 'You are currently browsing as a guest.'}
            </p>
          </div>
        ),
      });
    } else if (type === 'privacy') {
      setModalContent({
        title: 'Privacy Policy',
        icon: ShieldCheck,
        content: (
          <p className="text-sm text-secondary dark:text-dark-text-secondary leading-relaxed">
            Instique protects your educational data with school-scoped RBAC, HttpOnly cookies, and strict data isolation per school institution.
          </p>
        ),
      });
    } else if (type === 'terms') {
      setModalContent({
        title: 'Terms of Service',
        icon: FileText,
        content: (
          <p className="text-sm text-secondary dark:text-dark-text-secondary leading-relaxed">
            Use of Instique School Management System is governed by your institution's subscription agreement and strict academic data compliance guidelines.
          </p>
        ),
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page dark:bg-dark-bg text-deep dark:text-dark-text transition-colors duration-200">
      {/* ── 1. BRAND HEADER ── */}
      <header className="w-full border-b border-border dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex items-center gap-2.5 group focus:outline-none focus-ring rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-forest dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-deep dark:text-dark-text tracking-tight leading-none">
                Instique
              </span>
              <span className="text-[10px] font-medium text-muted dark:text-dark-text-muted leading-none mt-0.5">
                School Management System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGoDashboard}
                className="hidden sm:flex items-center gap-1.5"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/login')}
                className="hidden sm:flex items-center gap-1.5"
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. MAIN HERO & ILLUSTRATION ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14 flex flex-col justify-center gap-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 404 Text & Actions */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            {/* 404 Tag / Number */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-soft dark:bg-emerald-950/40 text-forest dark:text-emerald-400 border border-forest/20 dark:border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-forest dark:bg-emerald-400 animate-pulse" />
              HTTP 404 — Page Not Found
            </div>

            <h1
              id="notfound-heading"
              tabIndex={-1}
              className="text-6xl sm:text-7xl lg:text-8xl font-black text-forest dark:text-emerald-400 tracking-tight leading-none focus:outline-none"
            >
              404
            </h1>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-deep dark:text-dark-text tracking-tight leading-tight">
                Oops! This page isn’t{' '}
                <span className="text-forest dark:text-emerald-400 underline decoration-forest/30 dark:decoration-emerald-500/30 underline-offset-4">
                  on campus.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-secondary dark:text-dark-text-secondary max-w-lg leading-relaxed font-normal">
                The page you’re looking for may have moved, been removed, or you may have entered the wrong address.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
              <Button
                variant="primary"
                onClick={handleGoDashboard}
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-forest hover:bg-forest-hover text-white shadow-card hover:shadow-card-hover transition-all duration-150 cursor-pointer"
              >
                <LayoutDashboard size={18} strokeWidth={2} />
                <span>Go to Dashboard</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleGoBack}
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border border-border dark:border-dark-border text-deep dark:text-dark-text bg-white dark:bg-dark-card hover:bg-surface dark:hover:bg-dark-hover transition-all duration-150 cursor-pointer"
              >
                <ArrowLeft size={18} strokeWidth={2} />
                <span>Go Back</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Education Campus Illustration */}
          <div className="lg:col-span-6 flex items-center justify-center p-2 lg:p-4">
            <div className="w-full max-w-md lg:max-w-xl transition-transform hover:scale-[1.01] duration-300">
              <CampusIllustration />
            </div>
          </div>
        </div>

        {/* ── 3. NEED HELP / SUPPORT BANNER ── */}
        <Card className="w-full bg-slate-50 dark:bg-dark-elevated border border-border/80 dark:border-dark-border p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest-soft dark:bg-emerald-950/50 border border-forest/20 dark:border-emerald-500/20 flex items-center justify-center text-forest dark:text-emerald-400 shrink-0">
                <Headphones size={24} strokeWidth={2} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-deep dark:text-dark-text">Need help?</h3>
                <p className="text-xs sm:text-sm text-secondary dark:text-dark-text-secondary">
                  If you think this is a mistake, contact{' '}
                  <button
                    onClick={() => openSupportModal('support')}
                    className="font-semibold text-forest dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Instique Support.
                  </button>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openSupportModal('support')}
              className="w-full md:w-auto flex items-center justify-center gap-2 border-forest/30 dark:border-emerald-500/30 text-forest dark:text-emerald-400 hover:bg-forest-soft dark:hover:bg-emerald-950/40"
            >
              <Mail size={15} />
              <span>Contact Instique Support</span>
            </Button>
          </div>
        </Card>
      </main>

      {/* ── 4. FOOTER ── */}
      <footer className="w-full border-t border-border dark:border-dark-border bg-white dark:bg-dark-surface py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-forest dark:bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <BookOpen size={15} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold text-deep dark:text-dark-text tracking-tight">Instique</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-secondary dark:text-dark-text-secondary">
              <button
                onClick={() => openSupportModal('privacy')}
                className="hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => openSupportModal('terms')}
                className="hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button
                onClick={() => openSupportModal('support')}
                className="hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                Help Center
              </button>
              <button
                onClick={() => openSupportModal('support')}
                className="hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
              >
                Contact Us
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 text-muted dark:text-dark-text-muted">
              <button
                onClick={() => openSupportModal('support')}
                className="p-1.5 rounded-full hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
                aria-label="Facebook"
              >
                <SocialIcons.Facebook />
              </button>
              <button
                onClick={() => openSupportModal('support')}
                className="p-1.5 rounded-full hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
                aria-label="Twitter"
              >
                <SocialIcons.Twitter />
              </button>
              <button
                onClick={() => openSupportModal('support')}
                className="p-1.5 rounded-full hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
                aria-label="LinkedIn"
              >
                <SocialIcons.LinkedIn />
              </button>
              <button
                onClick={() => openSupportModal('support')}
                className="p-1.5 rounded-full hover:bg-surface dark:hover:bg-dark-hover hover:text-deep dark:hover:text-dark-text transition-colors cursor-pointer"
                aria-label="Instagram"
              >
                <SocialIcons.Instagram />
              </button>
            </div>
          </div>

          <div className="border-t border-border/60 dark:border-dark-border pt-4 text-center text-xs text-muted dark:text-dark-text-muted">
            © 2026 Instique. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── 5. SUPPORT MODAL ── */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-dark-card border border-border dark:border-dark-border shadow-modal relative">
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-deep dark:text-dark-text-muted dark:hover:text-dark-text hover:bg-surface dark:hover:bg-dark-hover transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-forest-soft dark:bg-emerald-950/50 text-forest dark:text-emerald-400 flex items-center justify-center">
                <modalContent.icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-deep dark:text-dark-text">{modalContent.title}</h3>
            </div>

            <div className="mb-6">{modalContent.content}</div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalContent(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
