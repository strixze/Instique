import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Radio, Users, UserX, Bus, Clock, Search, LogIn, LogOut,
  CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, ArrowRight,
  ExternalLink, UserCheck, Sparkles, Volume2, ShieldCheck
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UserAvatar from '../../components/ui/UserAvatar';
import { gateSecurityApi } from '../../api/gateSecurity.api';
import { useUserStore } from '../../store/userStore';
import { uiSound } from '../../utils/soundManager';
import toast from 'react-hot-toast';

import SimulateRfidModal from './components/SimulateRfidModal';
import ManualStudentSearchModal from './components/ManualStudentSearchModal';
import VisitorModal from './components/VisitorModal';
import UnknownStudentModal from './components/UnknownStudentModal';
import SchoolVanModal from './components/SchoolVanModal';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  // Time display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Data
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    metrics: {
      todayEventsCount: 0,
      visitorsInside: 0,
      vansInside: 0,
      studentsEnteredToday: 0,
    },
    recentLogs: [],
    gateName: 'Main Gate',
  });

  // Recent Scan Result Card State
  const [currentScan, setCurrentScan] = useState(null);

  // Modals
  const [rfidModalOpen, setRfidModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [unknownStudentModalOpen, setUnknownStudentModalOpen] = useState(false);
  const [vanModalOpen, setVanModalOpen] = useState(false);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSummary = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await gateSecurityApi.getSummary();
      setSummary(res.data || res);
    } catch (err) {
      if (!quiet) toast.error('Failed to load gate summary');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleScanResult = (result) => {
    if (result.error) {
      uiSound.alert?.();
      setCurrentScan({
        isError: true,
        status: result.status || 'ERROR',
        message: result.message || 'Verification failed',
        tag: result.tag,
        timestamp: new Date(),
      });
      return;
    }

    uiSound.success?.();
    setCurrentScan({
      isError: false,
      verificationStatus: result.verificationStatus,
      movement: result.movement,
      gateState: result.gateState,
      student: result.student,
      timestamp: new Date(result.timestamp || Date.now()),
      gateLog: result.gateLog,
    });

    // Refresh summary metrics and recent activity quietly
    fetchSummary(true);
  };

  const handleEventRecorded = () => {
    fetchSummary(true);
  };

  const metrics = summary?.metrics || {};
  const recentLogs = summary?.recentLogs || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* ── 1. Compact Operational Gate Header ── */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest/10 dark:bg-emerald-500/15 text-forest dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shield size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-deep dark:text-dark-text leading-none">
                  {summary.gateName || 'Main School Gate'}
                </h1>
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GATE ACTIVE
                </span>
              </div>
              <p className="text-xs text-muted dark:text-dark-text-muted mt-1">
                Duty Officer: <span className="font-semibold text-secondary dark:text-dark-text-secondary">{user?.name || 'Security Guard'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 dark:border-dark-border">
            <div className="text-right">
              <p className="text-xs font-mono font-bold text-deep dark:text-dark-text tracking-wide">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[11px] text-muted dark:text-dark-text-muted">
                {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchSummary(false)}
              className="p-2 text-muted hover:text-deep dark:hover:text-dark-text rounded-xl border border-border dark:border-dark-border hover:bg-surface dark:hover:bg-dark-hover transition-colors"
              title="Refresh gate data"
              aria-label="Refresh gate data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Hero Section: RFID Scan Zone & Scan Result ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: RFID Scan Controller (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-card relative overflow-hidden min-h-[220px]">
          {/* Subtle background radar glow */}
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-forest/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                  RFID Scanner Ready
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                MOCK DEV MODE
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Radio size={24} className="animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-snug">
                  Gate Reader Active
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tap student RFID card or use the simulation control below
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                uiSound.tap?.();
                setRfidModalOpen(true);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 text-xs sm:text-sm h-11"
            >
              <Radio size={16} className="mr-1.5" />
              [SIMULATE RFID SCAN]
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setSearchModalOpen(true)}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm h-11 shrink-0"
            >
              <Search size={15} className="mr-1" />
              Manual Search
            </Button>
          </div>
        </div>

        {/* Right Column: Live Verification Display (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {currentScan ? (
            currentScan.isError ? (
              /* Error State Card (Unknown RFID or Duplicate) */
              <div className="h-full p-5 rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 flex flex-col justify-between animate-shake">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {currentScan.status === 'DUPLICATE_SCAN' ? 'SCAN ALREADY RECORDED' : 'CARD NOT RECOGNIZED'}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted dark:text-dark-text-muted font-mono">
                    {currentScan.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                <div className="my-3 text-left">
                  <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                    {currentScan.message}
                  </p>
                  {currentScan.tag && (
                    <p className="text-xs text-muted dark:text-dark-text-muted mt-1 font-mono">
                      Scanned Tag: <span className="font-bold text-deep dark:text-dark-text">{currentScan.tag}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-rose-200 dark:border-rose-900/40">
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => setSearchModalOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Identify Student Manually
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setUnknownStudentModalOpen(true)}
                  >
                    Log as Unknown Student
                  </Button>
                </div>
              </div>
            ) : (
              /* Verified Success State Card */
              <div
                className={`h-full p-5 rounded-2xl border-2 flex flex-col justify-between animate-scale-in ${
                  currentScan.movement === 'ENTRY'
                    ? 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50/70 dark:bg-emerald-950/25'
                    : 'border-blue-400 dark:border-blue-600/70 bg-blue-50/70 dark:bg-blue-950/25'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      size={20}
                      className={currentScan.movement === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        currentScan.movement === 'ENTRY'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      VERIFIED • GATE {currentScan.movement}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                    {currentScan.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {/* Student Minimal Identity Box */}
                <div className="my-3 flex items-center gap-4 text-left">
                  <UserAvatar
                    name={`${currentScan.student.firstName} ${currentScan.student.lastName}`}
                    gender={currentScan.student.gender}
                    role="student"
                    size="xl"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-deep dark:text-dark-text leading-tight truncate">
                      {currentScan.student.firstName} {currentScan.student.lastName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted dark:text-dark-text-muted">
                        Student ID: <span className="font-semibold text-deep dark:text-dark-text">{currentScan.student.admissionNo}</span>
                      </span>
                      {currentScan.student.currentClass && (
                        <span className="text-xs text-muted dark:text-dark-text-muted">
                          • Class: <span className="font-semibold text-deep dark:text-dark-text">{currentScan.student.currentClass.name}</span>
                        </span>
                      )}
                      {currentScan.student.currentSection && (
                        <span className="text-xs text-muted dark:text-dark-text-muted">
                          - <span className="font-semibold text-deep dark:text-dark-text">{currentScan.student.currentSection.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          currentScan.gateState === 'INSIDE'
                            ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-slate-200 text-slate-800 dark:bg-dark-elevated dark:text-slate-200'
                        }`}
                      >
                        Status: Currently {currentScan.gateState}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer confirmation */}
                <div className="text-xs text-muted dark:text-dark-text-muted flex items-center justify-between pt-2 border-t border-border/60 dark:border-dark-border">
                  <span>Physical gate event logged in GateLog</span>
                  <span className="font-mono text-[11px] text-forest dark:text-emerald-400">Attendance Untouched</span>
                </div>
              </div>
            )
          ) : (
            /* Standby Card */
            <div className="h-full p-5 rounded-2xl border border-dashed border-border dark:border-dark-border bg-white dark:bg-dark-card flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-dark-hover flex items-center justify-center text-muted mb-2">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-sm font-bold text-deep dark:text-dark-text">
                Waiting for RFID Card or Manual Gate Action
              </h3>
              <p className="text-xs text-muted dark:text-dark-text-muted max-w-sm mt-1">
                Scanned student identity, verified status, and physical gate movement will appear here instantly.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Operational Metrics Strip (Derived from real DB data) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-soft dark:bg-dark-accent-soft text-forest dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Bus size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">
              Vans Inside
            </p>
            <p className="text-xl font-bold text-deep dark:text-dark-text leading-none mt-0.5">
              {metrics.vansInside ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">
              Visitors Inside
            </p>
            <p className="text-xl font-bold text-deep dark:text-dark-text leading-none mt-0.5">
              {metrics.visitorsInside ?? 0}
            </p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wide">
              Today's Gate Events
            </p>
            <p className="text-xl font-bold text-deep dark:text-dark-text leading-none mt-0.5">
              {metrics.todayEventsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Quick Action Buttons ── */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-4 shadow-2xs">
        <h2 className="text-xs font-bold text-muted dark:text-dark-text-muted uppercase tracking-wider mb-3 text-left">
          Quick Gate Operations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Button
            variant="outline"
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-semibold"
          >
            <Search size={15} className="text-forest dark:text-emerald-400 shrink-0" />
            <span className="truncate">Search Student</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setVisitorModalOpen(true)}
            className="flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-semibold"
          >
            <UserCheck size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Visitor In / Out</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setVanModalOpen(true)}
            className="flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-semibold"
          >
            <Bus size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">School Van In / Out</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setUnknownStudentModalOpen(true)}
            className="flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-semibold"
          >
            <UserX size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">Unknown Student</span>
          </Button>
        </div>
      </div>

      {/* ── 5. Compact Recent Gate Activity List ── */}
      <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-border dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-muted dark:text-dark-text-muted" />
            <h2 className="text-xs sm:text-sm font-bold text-deep dark:text-dark-text">
              Recent Gate Activity
            </h2>
          </div>
          <Button
            variant="link"
            size="xs"
            onClick={() => navigate('/gate-activity')}
            className="text-forest dark:text-emerald-400 font-semibold gap-1"
          >
            View Full Log <ArrowRight size={13} />
          </Button>
        </div>

        <div className="divide-y divide-border/60 dark:divide-dark-border mt-1">
          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">No gate activity recorded today yet</div>
          ) : (
            recentLogs.map((log) => {
              const eventDate = new Date(log.timestamp);
              const isEntry = log.eventType === 'ENTRY';
              const name =
                log.entityType === 'STUDENT'
                  ? `${log.student?.firstName || ''} ${log.student?.lastName || ''}`.trim() || 'Student'
                  : log.entityType === 'VEHICLE'
                  ? `Van: ${log.vehicle?.vehicleNumber || log.vehicleNumber || 'School Transport'}`
                  : log.name || 'Visitor / Unknown';

              const identifier =
                log.entityType === 'STUDENT'
                  ? log.student?.admissionNo
                  : log.entityType === 'VEHICLE'
                  ? log.vehicle?.type
                  : log.purpose;

              return (
                <div
                  key={log._id}
                  className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 dark:hover:bg-dark-hover/40 rounded-lg px-1 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isEntry
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {isEntry ? <LogIn size={13} /> : <LogOut size={13} />}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-deep dark:text-dark-text truncate">
                          {name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300">
                          {log.entityType?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5 truncate">
                        {identifier && <span>{identifier} • </span>}
                        <span>Method: {log.verificationMethod}</span>
                        {log.notes && <span> • "{log.notes}"</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEntry
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {log.eventType}
                    </span>
                    <p className="text-[10px] text-muted dark:text-dark-text-muted font-mono mt-0.5">
                      {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Dialog Modals ── */}
      <SimulateRfidModal
        isOpen={rfidModalOpen}
        onClose={() => setRfidModalOpen(false)}
        onScanComplete={handleScanResult}
      />

      <ManualStudentSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onEventRecorded={handleEventRecorded}
      />

      <VisitorModal
        isOpen={visitorModalOpen}
        onClose={() => setVisitorModalOpen(false)}
        onVisitorUpdated={handleEventRecorded}
      />

      <UnknownStudentModal
        isOpen={unknownStudentModalOpen}
        onClose={() => setUnknownStudentModalOpen(false)}
        onRecorded={handleEventRecorded}
      />

      <SchoolVanModal
        isOpen={vanModalOpen}
        onClose={() => setVanModalOpen(false)}
        onVehicleUpdated={handleEventRecorded}
      />
    </div>
  );
}
