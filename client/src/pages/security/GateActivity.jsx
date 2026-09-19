import { useState, useEffect } from 'react';
import {
  Shield, LogIn, LogOut, Radio, Search, Filter, Calendar,
  RefreshCw, ArrowLeft, Clock, User, Bus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { gateSecurityApi } from '../../api/gateSecurity.api';
import toast from 'react-hot-toast';

const ENTITY_TABS = [
  { value: 'ALL', label: 'All Events' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'VISITOR', label: 'Visitors' },
  { value: 'VEHICLE', label: 'School Vans' },
  { value: 'UNKNOWN_STUDENT', label: 'Unknown' },
];

export default function GateActivity() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [movementFilter, setMovementFilter] = useState('ALL'); // ALL | ENTRY | EXIT
  const [methodFilter, setMethodFilter] = useState('ALL'); // ALL | RFID | MANUAL
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
        eventType: movementFilter !== 'ALL' ? movementFilter : undefined,
        verificationMethod: methodFilter !== 'ALL' ? methodFilter : undefined,
        search: search.trim() || undefined,
        date: dateFilter || undefined,
      };
      const res = await gateSecurityApi.getActivity(params);
      setData(res.data || []);
      setMeta(res.meta || null);
    } catch {
      toast.error('Failed to load gate activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page, entityFilter, movementFilter, methodFilter, dateFilter]);

  // Handle live debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchActivity();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (row) => {
        const d = new Date(row.timestamp);
        return (
          <div className="leading-tight">
            <span className="font-bold text-deep dark:text-dark-text block">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-muted dark:text-dark-text-muted">
              {d.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'movement',
      label: 'Movement',
      render: (row) => {
        const isEntry = row.eventType === 'ENTRY';
        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isEntry
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {isEntry ? <LogIn size={11} /> : <LogOut size={11} />}
            {row.eventType}
          </span>
        );
      },
    },
    {
      key: 'entityType',
      label: 'Entity',
      render: (row) => (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300">
          {row.entityType?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Identifier / Name',
      render: (row) => {
        if (row.entityType === 'STUDENT') {
          return (
            <div className="leading-tight">
              <span className="font-bold text-deep dark:text-dark-text block">
                {row.student ? `${row.student.firstName} ${row.student.lastName}` : row.name || 'Student'}
              </span>
              <span className="text-[11px] text-muted dark:text-dark-text-muted">
                ID: {row.student?.admissionNo || row.rfidIdentifier || '—'}
                {row.student?.currentClass && ` • Class: ${row.student.currentClass.name}`}
              </span>
            </div>
          );
        }
        if (row.entityType === 'VEHICLE') {
          return (
            <div className="leading-tight">
              <span className="font-bold text-deep dark:text-dark-text font-mono block">
                {row.vehicle?.vehicleNumber || row.vehicleNumber || 'School Van'}
              </span>
              <span className="text-[11px] text-muted dark:text-dark-text-muted">
                {row.vehicle?.driverName && `Driver: ${row.vehicle.driverName}`}
              </span>
            </div>
          );
        }
        return (
          <div className="leading-tight">
            <span className="font-bold text-deep dark:text-dark-text block">
              {row.name || 'Visitor / Unknown'}
            </span>
            <span className="text-[11px] text-muted dark:text-dark-text-muted">
              {row.purpose || row.notes || '—'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'verificationMethod',
      label: 'Method',
      render: (row) => (
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            row.verificationMethod === 'RFID'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-slate-100 text-slate-700 dark:bg-dark-elevated dark:text-slate-300'
          }`}
        >
          {row.verificationMethod}
        </span>
      ),
    },
    {
      key: 'recordedBy',
      label: 'Recorded By',
      render: (row) => (
        <span className="text-xs text-muted dark:text-dark-text-muted">
          {row.recordedBy?.name || 'Gate Officer'}
        </span>
      ),
    },
  ];

  const renderMobileCard = (row) => {
    const isEntry = row.eventType === 'ENTRY';
    const d = new Date(row.timestamp);
    const title =
      row.entityType === 'STUDENT'
        ? `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim() || 'Student'
        : row.entityType === 'VEHICLE'
        ? `Van: ${row.vehicle?.vehicleNumber || row.vehicleNumber || 'School Transport'}`
        : row.name || 'Visitor / Unknown';

    return (
      <div className="p-3 space-y-2 text-left hover:bg-slate-50/50 dark:hover:bg-dark-hover/40 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-deep dark:text-dark-text truncate">{title}</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300">
                {row.entityType?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">
              {row.entityType === 'STUDENT' && row.student?.admissionNo && `ID: ${row.student.admissionNo}`}
              {row.purpose && `Purpose: ${row.purpose}`}
              {row.notes && ` • Notes: ${row.notes}`}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isEntry
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              {isEntry ? <LogIn size={10} /> : <LogOut size={10} />}
              {row.eventType}
            </span>
            <p className="text-[10px] font-mono text-muted dark:text-dark-text-muted mt-0.5">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-dark-border/40 text-[10px] text-muted">
          <span>Method: <strong className="text-secondary dark:text-dark-text-secondary">{row.verificationMethod}</strong></span>
          <span>By: {row.recordedBy?.name || 'Gate Officer'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="p-1.5"
            title="Back to Gate Dashboard"
          >
            <ArrowLeft size={17} />
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-deep dark:text-dark-text">
              Gate Activity History
            </h1>
            <p className="text-xs text-muted dark:text-dark-text-muted">
              Auditable append-only gate movement records for all entities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchActivity()}
            className="p-2 text-muted hover:text-deep dark:hover:text-dark-text rounded-xl border border-border dark:border-dark-border hover:bg-surface dark:hover:bg-dark-hover transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setEntityFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              entityFilter === tab.value
                ? 'bg-forest text-white dark:bg-emerald-500 dark:text-gray-900 shadow-2xs'
                : 'bg-white dark:bg-dark-card border border-border dark:border-dark-border text-secondary dark:text-dark-text-secondary hover:bg-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-3 shadow-2xs">
        <div className="sm:col-span-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, admission no, tag, or vehicle..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <select
            value={movementFilter}
            onChange={(e) => {
              setMovementFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs"
          >
            <option value="ALL">All Movements</option>
            <option value="ENTRY">ENTRY Only</option>
            <option value="EXIT">EXIT Only</option>
          </select>
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs"
          >
            <option value="ALL">All Methods</option>
            <option value="RFID">RFID Verification</option>
            <option value="MANUAL">Manual Verification</option>
          </select>
        </div>
      </div>

      {/* DataTable & Mobile Card view */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        renderMobileCard={renderMobileCard}
        emptyMessage="No gate activity records match the selected filters"
      />

      {/* Full Pagination Controls */}
      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}
