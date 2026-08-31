import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { roleApi } from '../../api/role.api';

const MODULES = ['students', 'teachers', 'admissions', 'classes', 'timetable', 'attendance', 'exams', 'fees', 'notices', 'leaves', 'complaints'];
const ACTIONS = ['read', 'create', 'update', 'delete'];

function emptyPermissions() {
 return Object.fromEntries(MODULES.map((m) => [m, []]));
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
 return () => { active = false; };
 }, [page, search, reload]);

 const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

 const toggleAction = (module, action) => {
 setForm((f) => {
 const current = f.permissions[module] || [];
 const has = current.includes(action);
 return {
 ...f,
 permissions: {
 ...f.permissions,
 [module]: has ? current.filter((a) => a !== action) : [...current, action],
 },
 };
 });
 };

 const resetAndClose = () => { setForm({ name: '', description: '', permissions: emptyPermissions() }); setOpen(false); };

 const handleCreate = async () => {
 if (!form.name) {
 toast.error('Role name is required');
 return;
 }
 setSaving(true);
 try {
 await roleApi.create({
 name: form.name,
 description: form.description || undefined,
 permissions: form.permissions,
 });
 toast.success('Role created');
 resetAndClose();
 setPage(1);
 setLoading(true);
 setReload((r) => r + 1);
 } catch (e) {
 toast.error(e?.message || 'Failed to create role');
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

 const columns = [
 { key: 'name', label: 'Role', sortable: true, render: (r) => (
 <div className="flex items-center gap-2">
 <ShieldCheck size={16} className="text-forest"/>
 <span className="font-medium text-deep">{r.name}</span>
 {r.isSystem && <Badge color="info">System</Badge>}
 </div>
 ) },
 { key: 'description', label: 'Description', render: (r) => r.description || '—' },
 { key: 'permissions', label: 'Permissions', render: (r) => countPermissions(r.permissions) },
 { key: 'assignedUsers', label: 'Users', render: (r) => Array.isArray(r.assignedUsers) ? r.assignedUsers.length : '—' },
 {
 key: 'actions',
 label: '',
 render: (r) => (
 !r.isSystem && (
 <button onClick={() => handleDelete(r)} className="p-2 text-muted hover:text-danger rounded-lg hover:bg-danger-light transition-colors"title="Delete">
 <Trash2 size={16} />
 </button>
 )
 ),
 },
 ];

 return (
 <div className="space-y-6">
 <PageHeader
 title="Custom Roles"
 description="Define roles with granular module-level permissions"
 action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2"/>Create Role</Button>}
 />

 <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search roles..."/>

 <Modal isOpen={open} onClose={resetAndClose} title="Create Custom Role"size="lg">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="Role name *"value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Accountant"/>
 <Input label="Description"value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Handles fees and reports"/>
 </div>

 <div className="mt-6">
 <h3 className="text-sm font-medium text-secondary mb-3">Permissions</h3>
 <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
 {MODULES.map((module) => (
 <div key={module} className="flex items-center justify-between p-3 bg-sage-soft/50 rounded-lg">
 <span className="text-sm text-deep capitalize">{module.replace('_', ' ')}</span>
 <div className="flex gap-1">
 {ACTIONS.map((action) => {
 const checked = (form.permissions[module] || []).includes(action);
 return (
 <button
 key={action}
 type="button"
 onClick={() => toggleAction(module, action)}
 className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
 checked
 ? 'bg-forest text-white border-forest'
 : 'border-border text-muted hover:border-forest/40'
 }`}
 >
 {action.charAt(0).toUpperCase() + action.slice(1)}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={resetAndClose}>Cancel</Button>
 <Button onClick={handleCreate} loading={saving}>Create Role</Button>
 </div>
 </Modal>
 </div>
 );
}
