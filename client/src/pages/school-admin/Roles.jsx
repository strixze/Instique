import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Plus,
  Trash2,
  ShieldCheck,
  Users,
  GraduationCap,
  UserPlus,
  BookOpen,
  Calendar,
  CheckCircle2,
  Award,
  CreditCard,
  Bell,
  FileText,
  AlertCircle,
  CheckCheck,
  XCircle,
  Edit3,
  Lock,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { roleApi } from '../../api/role.api';

const MODULES = [
  { id: 'students', label: 'Students', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'admissions', label: 'Admissions', icon: UserPlus },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
  { id: 'exams', label: 'Exams', icon: Award },
  { id: 'fees', label: 'Fees', icon: CreditCard },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'leaves', label: 'Leaves', icon: FileText },
  { id: 'complaints', label: 'Complaints', icon: AlertCircle },
];

const ACTIONS = ['read', 'create', 'update', 'delete'];

function emptyPermissions() {
  return Object.fromEntries(MODULES.map((m) => [m.id, []]));
}

export default function Roles() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: emptyPermissions() });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await roleApi.getAll({ page, limit: 10, search: search || undefined });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load roles');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [page, search, reload]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleAction = (moduleId, action) => {
    setForm((f) => {
      const current = f.permissions[moduleId] || [];
      const has = current.includes(action);
      return {
        ...f,
        permissions: {
          ...f.permissions,
          [moduleId]: has ? current.filter((a) => a !== action) : [...current, action],
        },
      };
    });
  };

  const toggleModuleAll = (moduleId) => {
    setForm((f) => {
      const current = f.permissions[moduleId] || [];
      const allSelected = ACTIONS.every((a) => current.includes(a));
      return {
        ...f,
        permissions: {
          ...f.permissions,
          [moduleId]: allSelected ? [] : [...ACTIONS],
        },
      };
    });
  };

  const selectAllPermissions = () => {
    setForm((f) => ({
      ...f,
      permissions: Object.fromEntries(MODULES.map((m) => [m.id, [...ACTIONS]])),
    }));
  };

  const clearAllPermissions = () => {
    setForm((f) => ({
      ...f,
      permissions: emptyPermissions(),
    }));
  };

  const resetAndClose = () => {
    setEditingRole(null);
    setForm({ name: '', description: '', permissions: emptyPermissions() });
    setOpen(false);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    const basePermissions = emptyPermissions();
    if (role.permissions) {
      const permsObj = role.permissions instanceof Map
        ? Object.fromEntries(role.permissions)
        : role.permissions;
      Object.keys(permsObj).forEach((mod) => {
        if (Array.isArray(permsObj[mod])) {
          basePermissions[mod] = [...permsObj[mod]];
        }
      });
    }
    setForm({
      name: role.name || '',
      description: role.description || '',
      permissions: basePermissions,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingRole) {
        await roleApi.update(editingRole._id, {
          name: form.name.trim(),
          description: form.description?.trim() || '',
          permissions: form.permissions,
        });
        toast.success('Role updated successfully');
      } else {
        await roleApi.create({
          name: form.name.trim(),
          description: form.description?.trim() || undefined,
          permissions: form.permissions,
        });
        toast.success('Role created successfully');
        setPage(1);
      }
      resetAndClose();
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || (editingRole ? 'Failed to update role' : 'Failed to create role'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role) => {
    if (role.isSystem) {
      toast.error('System roles cannot be deleted');
      return;
    }
    Swal.fire({
      title: 'Delete role?',
      text: `${role.name} will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await roleApi.delete(role._id);
        toast.success('Role deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete role');
      }
    });
  };

  const countPermissions = (permissions) => {
    if (!permissions) return 0;
    return Object.values(permissions).reduce((sum, actions) => sum + (Array.isArray(actions) ? actions.length : 0), 0);
  };

  const totalPossiblePermissions = MODULES.length * ACTIONS.length;
  const currentTotalPermissions = countPermissions(form.permissions);

  const columns = [
    {
      key: 'name',
      label: 'Role',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              r.isSystem
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <ShieldCheck size={16} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-deep dark:text-dark-text tracking-tight">
              {r.name}
            </span>
            {r.isSystem ? (
              <Badge color="info">System</Badge>
            ) : (
              <Badge color="success">Custom</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (r) => (
        <span className="text-secondary dark:text-dark-text-secondary text-xs leading-relaxed max-w-sm block line-clamp-2">
          {r.description || '—'}
        </span>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r) => {
        const count = countPermissions(r.permissions);
        const pct = Math.round((count / totalPossiblePermissions) * 100);
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-surface dark:bg-dark-elevated border border-border dark:border-dark-border text-deep dark:text-dark-text">
              <span className="text-forest dark:text-emerald-400 font-extrabold">{count}</span>
              <span className="text-muted dark:text-dark-text-muted"> / {totalPossiblePermissions}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted dark:text-dark-text-muted">
              ({pct}%)
            </span>
          </div>
        );
      },
    },
    {
      key: 'assignedUsers',
      label: 'Users',
      render: (r) => {
        const count = Array.isArray(r.assignedUsers) ? r.assignedUsers.length : 0;
        return (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-muted dark:text-dark-text-muted" />
            <span className="font-semibold text-xs text-deep dark:text-dark-text">
              {count} {count === 1 ? 'user' : 'users'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(r)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
            title="Edit Role & Permissions"
          >
            <Edit3 size={13} className="stroke-[2.5]" />
            <span>Edit</span>
          </button>

          {!r.isSystem && (
            <button
              type="button"
              onClick={() => handleDelete(r)}
              className="inline-flex items-center p-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:text-white hover:bg-rose-600 active:bg-rose-700 border border-rose-500/30 transition-all cursor-pointer"
              title="Delete Role"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Roles & Permissions"
        description="Define custom access levels and granular module permissions for your team"
        action={
          <Button onClick={() => { setEditingRole(null); setForm({ name: '', description: '', permissions: emptyPermissions() }); setOpen(true); }}>
            <Plus size={16} className="mr-2" />
            Create Role
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-dark-text-muted font-medium uppercase">Total Roles</p>
            <p className="text-lg font-bold text-deep dark:text-dark-text">{meta?.total ?? data.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-dark-text-muted font-medium uppercase">System Roles</p>
            <p className="text-lg font-bold text-deep dark:text-dark-text">{data.filter((r) => r.isSystem).length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Award size={18} />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-dark-text-muted font-medium uppercase">Custom Roles</p>
            <p className="text-lg font-bold text-deep dark:text-dark-text">{data.filter((r) => !r.isSystem).length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[11px] text-muted dark:text-dark-text-muted font-medium uppercase">Assigned Staff</p>
            <p className="text-lg font-bold text-deep dark:text-dark-text">
              {data.reduce((acc, r) => acc + (Array.isArray(r.assignedUsers) ? r.assignedUsers.length : 0), 0)}
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={(p) => {
          setLoading(true);
          setPage(p);
        }}
        onSearch={(s) => {
          setLoading(true);
          setSearch(s);
          setPage(1);
        }}
        searchPlaceholder="Search roles..."
      />

      <Modal
        isOpen={open}
        onClose={resetAndClose}
        title={editingRole ? (editingRole.isSystem ? `Configure ${editingRole.name} Permissions` : `Edit Role: ${editingRole.name}`) : 'Create Custom Role'}
        description={editingRole ? 'Modify role metadata and adjust granular module permissions' : 'Configure role identity and module-level action permissions'}
        size="lg"
      >
        <div className="space-y-6">
          {/* Role Basic Meta Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Role name"
                required
                disabled={editingRole?.isSystem}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Accountant, Event Coordinator"
              />
              {editingRole?.isSystem && (
                <span className="text-[11px] text-muted dark:text-dark-text-muted italic block mt-1">
                  System role name is fixed; permissions and description can be modified.
                </span>
              )}
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="e.g. Handles fee collection and financial reports"
            />
          </div>

          {/* Permissions Matrix Header */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-deep dark:text-dark-text flex items-center gap-2">
                  Module Permissions
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-200/60 dark:border-primary-500/20">
                    {currentTotalPermissions} of {totalPossiblePermissions} granted
                  </span>
                </h3>
                <p className="text-xs text-muted dark:text-dark-text-muted mt-0.5">
                  Select which operations this role is authorized to perform in each module.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-md transition-colors"
                >
                  <CheckCheck size={13} />
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-dark-text-secondary bg-slate-100 dark:bg-dark-hover hover:bg-slate-200 dark:hover:bg-dark-border-strong rounded-md transition-colors"
                >
                  <XCircle size={13} />
                  Clear All
                </button>
              </div>
            </div>

            {/* Modules List Container */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5 p-1 rounded-xl bg-slate-50/50 dark:bg-dark-card/40 border border-slate-200/60 dark:border-dark-border">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const moduleActions = form.permissions[mod.id] || [];
                const selectedCount = moduleActions.length;
                const isAllSelected = selectedCount === ACTIONS.length;

                return (
                  <div
                    key={mod.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white dark:bg-dark-elevated border border-slate-200/80 dark:border-dark-border rounded-xl hover:border-primary-300 dark:hover:border-primary-500/30 transition-all shadow-2xs gap-3"
                  >
                    {/* Module Title & Count Badge */}
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-dark-hover text-primary-600 dark:text-primary-400 border border-slate-200/60 dark:border-dark-border">
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 dark:text-dark-text">
                            {mod.label}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-dark-text-muted">
                            {isAllSelected
                              ? 'Full access granted'
                              : selectedCount > 0
                              ? `${selectedCount} of ${ACTIONS.length} actions enabled`
                              : 'No access'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toggle Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                      <button
                        type="button"
                        onClick={() => toggleModuleAll(mod.id)}
                        className="inline-flex items-center px-2 py-1 mr-1 rounded-md text-[11px] font-medium text-slate-500 dark:text-dark-text-muted hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors"
                        title={isAllSelected ? 'Clear module actions' : 'Select all module actions'}
                      >
                        {isAllSelected ? 'Clear' : 'All'}
                      </button>

                      {ACTIONS.map((action) => {
                        const checked = moduleActions.includes(action);
                        return (
                          <button
                            key={action}
                            type="button"
                            onClick={() => toggleAction(mod.id, action)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 ${
                              checked
                                ? 'bg-primary-600 dark:bg-primary-600 text-white border-primary-600 shadow-2xs font-semibold'
                                : 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border-strong text-slate-600 dark:text-dark-text-secondary hover:border-primary-400 dark:hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-500/10'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                checked ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-dark-border">
            <Button variant="ghost" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
