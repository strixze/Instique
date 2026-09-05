import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import SoundSettings from '../../components/ui/SoundSettings';
import { settingApi } from '../../api/setting.api';

export default function Settings() {
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [settings, setSettings] = useState(null);

 useEffect(() => {
 let active = true;
 const load = async () => {
 try {
 const res = await settingApi.get();
 if (active) setSettings(res.data);
 } catch (e) {
 if (active) toast.error(e?.message || 'Failed to load settings');
 } finally {
 if (active) setLoading(false);
 }
 };
 load();
 return () => { active = false; };
 }, []);

 const set = (section, key, value) => {
 setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
 };

 const setGrade = (index, key, value) => {
 setSettings((s) => {
 const gradingScale = [...s.gradingScale];
 gradingScale[index] = { ...gradingScale[index], [key]: key === 'points' ? Number(value) : value };
 return { ...s, gradingScale };
 });
 };

 const toggleNotification = (key) => {
 setSettings((s) => ({ ...s, notificationToggles: { ...s.notificationToggles, [key]: !s.notificationToggles[key] } }));
 };

 const handleSave = async () => {
 setSaving(true);
 try {
 const res = await settingApi.update(settings);
 setSettings(res.data);
 toast.success('Settings saved');
 } catch (e) {
 toast.error(e?.message || 'Failed to save settings');
 } finally {
 setSaving(false);
 }
 };

 if (loading) {
 return (
 <div className="space-y-6">
 <PageHeader title="Settings"description="Configure school-wide preferences"/>
 <div className="h-24 bg-white border border-border rounded-xl animate-pulse"/>
 <div className="h-24 bg-white border border-border rounded-xl animate-pulse"/>
 </div>
 );
 }

 if (!settings) {
 return (
 <div className="space-y-6">
 <PageHeader title="Settings"description="Configure school-wide preferences"/>
 <p className="text-muted">Could not load settings.</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <PageHeader
 title="Settings"
 description="Configure school-wide preferences"
 action={<Button onClick={handleSave} loading={saving}><Save size={16} className="mr-2"/>Save Changes</Button>}
 />

 <Card>
 <h2 className="text-lg font-semibold text-deep mb-4">Fee Settings</h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <Input
 label="Due day of month"
 type="number"
 value={settings.feeSettings?.dueDayOfMonth ?? ''}
 onChange={(e) => set('feeSettings', 'dueDayOfMonth', Number(e.target.value))}
 />
 <Input
 label="Late fee per day"
 type="number"
 value={settings.feeSettings?.lateFeePerDay ?? ''}
 onChange={(e) => set('feeSettings', 'lateFeePerDay', Number(e.target.value))}
 />
 <label className="flex items-end gap-2 pb-2 text-sm text-secondary">
 <input
 type="checkbox"
 checked={!!settings.feeSettings?.lateFeeEnabled}
 onChange={(e) => set('feeSettings', 'lateFeeEnabled', e.target.checked)}
 className="w-4 h-4 accent-forest"
 />
 Enable late fee
 </label>
 </div>
 </Card>

 <Card>
 <h2 className="text-lg font-semibold text-deep mb-4">Academic Settings</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input
 label="Max subjects per teacher"
 type="number"
 value={settings.academicSettings?.maxSubjectsPerTeacher ?? ''}
 onChange={(e) => set('academicSettings', 'maxSubjectsPerTeacher', Number(e.target.value))}
 />
 <Input
 label="Max periods per day"
 type="number"
 value={settings.academicSettings?.maxPeriodsPerDay ?? ''}
 onChange={(e) => set('academicSettings', 'maxPeriodsPerDay', Number(e.target.value))}
 />
 </div>
 </Card>

 <Card>
 <h2 className="text-lg font-semibold text-deep mb-4">UI Interaction Sounds</h2>
 <SoundSettings />
 </Card>

 <Card>
 <h2 className="text-lg font-semibold text-deep mb-4">Notifications</h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {Object.keys(settings.notificationToggles || {}).map((key) => (
 <label key={key} className="flex items-center gap-2 text-sm text-secondary capitalize">
 <input
 type="checkbox"
 checked={!!settings.notificationToggles[key]}
 onChange={() => toggleNotification(key)}
 className="w-4 h-4 accent-forest"
 />
 {key}
 </label>
 ))}
 </div>
 </Card>

 <Card>
 <h2 className="text-lg font-semibold text-deep mb-4">Grading Scale</h2>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Grade</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Min %</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Max %</th>
 <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">Points</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/50">
 {(settings.gradingScale || []).map((g, index) => (
 <tr key={index}>
 <td className="px-3 py-2">
 <Input value={g.grade} onChange={(e) => setGrade(index, 'grade', e.target.value)} className="max-w-20"/>
 </td>
 <td className="px-3 py-2">
 <Input type="number"value={g.minPercent} onChange={(e) => setGrade(index, 'minPercent', e.target.value)} className="max-w-24"/>
 </td>
 <td className="px-3 py-2">
 <Input type="number"value={g.maxPercent} onChange={(e) => setGrade(index, 'maxPercent', e.target.value)} className="max-w-24"/>
 </td>
 <td className="px-3 py-2">
 <Input type="number"step="0.1"value={g.points} onChange={(e) => setGrade(index, 'points', e.target.value)} className="max-w-24"/>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 <div className="flex justify-end">
 <Button onClick={handleSave} loading={saving}><Save size={16} className="mr-2"/>Save Changes</Button>
 </div>
 </div>
 );
}
