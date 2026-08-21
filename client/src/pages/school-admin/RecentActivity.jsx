import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Shield, User, Calendar, Clock, FileCheck, CheckCircle2, DollarSign,
  BookOpen, AlertTriangle, UserCheck, Layers, ArrowLeft
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { auditApi } from '../../api/audit.api';
import { useUserStore } from '../../store/userStore';

function getActivityStyle(action, entity) {
  const a = (action || '').toLowerCase();
  const e = (entity || '').toLowerCase();
  if (a.includes('create') || a.includes('approve') || e.includes('admission')) {
    return { Icon: UserCheck, color: 'bg-forest-soft text-forest', badge: 'success' };
  }
  if (e.includes('fee') || e.includes('transaction')) {
    return { Icon: DollarSign, color: 'bg-info-light text-info-text', badge: 'info' };
  }
  if (e.includes('leave')) {
    return { Icon: CheckCircle2, color: 'bg-amber-100 text-amber-800', badge: 'warning' };
  }
  if (e.includes('exam') || e.includes('mark') || e.includes('result')) {
    return { Icon: FileCheck, color: 'bg-indigo-100 text-indigo-800', badge: 'primary' };
  }
  if (e.includes('homework') || e.includes('assignment')) {
    return { Icon: BookOpen, color: 'bg-purple-100 text-purple-800', badge: 'secondary' };
  }
  if (a.includes('delete') || a.includes('remove')) {
    return { Icon: AlertTriangle, color: 'bg-danger-light text-danger-text', badge: 'danger' };
  }
  return { Icon: Activity, color: 'bg-surface text-secondary', badge: 'default' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

const ENTITIES = ['all', 'Student', 'Teacher', 'Attendance', 'FeeTransaction', 'Admission', 'Leave', 'Exam', 'Notice', 'Timetable', 'Setting'];
const ACTIONS = ['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT'];

export default function RecentActivity() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  const fetchLogs = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      limit: 15,
      ...(search ? { search } : {}),
      ...(selectedEntity !== 'all' ? { entity: selectedEntity } : {}),
      ...(selectedAction !== 'all' ? { action: selectedAction } : {}),
    };

    auditApi.getAuditLogs(params)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setLogs(data);
          setPagination({ page: 1, limit: 15, total: data.length, pages: 1 });
        } else {
          setLogs(data.docs || data.data || []);
          setPagination({
            page: data.page || 1,
            limit: data.limit || 15,
            total: data.total || data.totalDocs || 0,
            pages: data.pages || data.totalPages || 1,
          });
        }
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedEntity, selectedAction]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  // ── Access Protection: School Admin Only ──
  if (user?.role !== 'school_admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-border">
        <div className="w-14 h-14 rounded-full bg-danger-light text-danger flex items-center justify-center mb-4">
          <Shield size={28} />
        </div>
        <h2 className="text-lg font-bold text-deep">Access Restricted</h2>
        <p className="text-xs text-muted max-w-sm mt-1 mb-5">
          The Recent Activity log page is strictly accessible to School Administrators.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white border border-border hover:bg-surface text-secondary transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight flex items-center gap-2">
              <Activity className="text-forest" size={22} />
              Recent Activity & Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Comprehensive system activity feed and audit trail for your school.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchLogs(pagination.page)}
          className="self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Activity
        </Button>
      </div>

      {/* Filters Bar */}
      <Card padding={false} className="p-4 bg-white border border-border rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or entity..."
              className="w-full text-xs bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-deep focus:outline-none focus:border-forest"
            />
          </div>

          {/* Filter Entity Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full md:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              {ENTITIES.map((ent) => (
                <option key={ent} value={ent}>
                  {ent === 'all' ? 'All Entities' : ent}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted whitespace-nowrap hidden sm:inline">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full md:w-auto text-xs bg-surface border border-border rounded-lg px-3 py-2 text-deep focus:outline-none focus:border-forest font-medium cursor-pointer"
            >
              {ACTIONS.map((act) => (
                <option key={act} value={act}>
                  {act === 'all' ? 'All Actions' : act}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full md:w-auto py-2 text-xs">
            Search
          </Button>
        </form>
      </Card>

      {/* Main Activity Timeline List */}
      <Card padding={false} className="bg-white border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-forest" />
            <h2 className="text-xs font-bold text-deep uppercase tracking-wider">
              Activity Stream ({pagination.total})
            </h2>
          </div>
          <span className="text-xs text-muted">Showing Page {pagination.page} of {pagination.pages || 1}</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={32} className="mx-auto text-muted mb-2 opacity-50" />
            <p className="text-sm font-bold text-deep">No Activity Found</p>
            <p className="text-xs text-muted mt-1">There are no audit log entries matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const { Icon, color, badge } = getActivityStyle(log.action, log.entity);
              const actorName = log.actor?.name || log.actorName || 'System';
              const actorRole = log.actor?.role || log.actorRole || 'System';
              const relTime = formatRelativeTime(log.createdAt);
              const exactTime = formatDate(log.createdAt);

              return (
                <div key={log._id} className="p-4 hover:bg-surface/50 transition-colors flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-deep">{actorName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-secondary border border-border uppercase font-semibold">
                          {actorRole.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Clock size={12} />
                        <span>{relTime}</span>
                        <span className="text-[11px] text-secondary">({exactTime})</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-deep mt-1 leading-snug">
                      <span className="uppercase text-forest font-bold">{log.action?.replace(/_/g, ' ')}</span>
                      {' '}<span className="text-secondary font-medium">{log.entity}</span>
                      {log.details ? ` — ${typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-surface/30">
            <Button
              variant="outline"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="text-xs py-1.5 flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </Button>

            <span className="text-xs font-semibold text-deep">
              Page {pagination.page} of {pagination.pages}
            </span>

            <Button
              variant="outline"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="text-xs py-1.5 flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
