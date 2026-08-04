import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { Plus, Trash2, Eye, Send } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { timetableApi } from '../../api/timetable.api';
import { academicApi } from '../../api/academic.api';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];

export default function Timetable() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [years, setYears] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ schoolClass: '', section: '', academicYear: '', periodsPerDay: 8, lunchBreakAfter: 4 });
  const [viewing, setViewing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
    academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
    academicApi.getAcademicYears({ limit: 100 }).then((res) => setYears(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await timetableApi.getAll({ page, limit: 10 });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load timetables');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload]);

  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));
  const yearMap = Object.fromEntries(years.map((y) => [y._id, y.name]));
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const resetAndClose = () => { setForm({ schoolClass: '', section: '', academicYear: '', periodsPerDay: 8, lunchBreakAfter: 4 }); setOpen(false); };

  const handleGenerate = async () => {
    if (!form.schoolClass || !form.section || !form.academicYear) { toast.error('Please select class, section, and academic year'); return; }
    setSaving(true);
    try {
      await timetableApi.generate({
        schoolClass: form.schoolClass,
        section: form.section,
        academicYear: form.academicYear,
        periodsPerDay: Number(form.periodsPerDay) || 8,
        lunchBreakAfter: Number(form.lunchBreakAfter) || 4,
      });
      toast.success('Timetable generated');
      resetAndClose();
      setPage(1);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to generate timetable');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row) => {
    setViewing(row);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await timetableApi.getById(row._id);
      setDetail(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to load timetable');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePublish = async (row) => {
    const next = row.status === 'published' ? 'draft' : 'published';
    try {
      await timetableApi.publish(row._id, next);
      toast.success(`Timetable ${next}`);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to update timetable');
    }
  };

  const handleDelete = (row) => {
    Swal.fire({
      title: 'Delete timetable?',
      text: 'This timetable will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await timetableApi.delete(row._id);
        toast.success('Timetable deleted');
        setLoading(true);
        setReload((r) => r + 1);
      } catch (e) {
        toast.error(e?.message || 'Failed to delete timetable');
      }
    });
  };

  const columns = [
    { key: 'class', label: 'Class', render: (r) => classMap[r.schoolClass] || '—' },
    { key: 'section', label: 'Section', render: (r) => sectionMap[r.section] || '—' },
    { key: 'academicYear', label: 'Academic Year', render: (r) => yearMap[r.academicYear] || '—' },
    { key: 'periods', label: 'Periods', render: (r) => Array.isArray(r.periods) ? r.periods.length : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'published' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'isAutoGenerated', label: 'Source', render: (r) => r.isAutoGenerated ? <Badge color="info">Auto</Badge> : <Badge color="gray">Manual</Badge> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(r)} className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors" title="View timetable">
            <Eye size={16} />
          </button>
          <button onClick={() => handlePublish(r)} className="p-2 text-gray-400 hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors" title={r.status === 'published' ? 'Unpublish' : 'Publish'}>
            <Send size={16} />
          </button>
          <button onClick={() => handleDelete(r)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const sectionOptions = sections
    .filter((s) => !form.schoolClass || s.schoolClass === form.schoolClass)
    .map((s) => ({ value: s._id, label: s.name }));

  const maxPeriods = detail?.totalPeriodsPerDay || 8;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Generate, review, and publish class timetables"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" />Generate Timetable</Button>}
      />

      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search timetables..." />

      <Modal isOpen={open} onClose={resetAndClose} title="Generate Timetable">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class *"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={form.schoolClass}
            onChange={(e) => { setField('schoolClass', e.target.value); setField('section', ''); }}
          />
          <Select
            label="Section *"
            options={sectionOptions}
            value={form.section}
            onChange={(e) => setField('section', e.target.value)}
          />
          <Select
            label="Academic year *"
            options={years.map((y) => ({ value: y._id, label: y.name }))}
            value={form.academicYear}
            onChange={(e) => setField('academicYear', e.target.value)}
          />
          <Input label="Periods per day" type="number" value={form.periodsPerDay} onChange={(e) => setField('periodsPerDay', e.target.value)} />
          <Input label="Lunch break after period" type="number" value={form.lunchBreakAfter} onChange={(e) => setField('lunchBreakAfter', e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleGenerate} loading={saving}>Generate</Button>
        </div>
      </Modal>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={`Timetable — ${classMap[viewing?.schoolClass] || ''} ${sectionMap[viewing?.section] || ''}`} size="xl">
        {detailLoading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">Loading timetable...</div>
        ) : detail ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  {DAYS.map((d) => (
                    <th key={d.value} className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {Array.from({ length: maxPeriods }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-gray-400 font-medium">P{idx + 1}</td>
                    {DAYS.map((d) => {
                      const period = detail.periods?.find((p) => p.day === d.value && p.periodNo === idx + 1);
                      return (
                        <td key={d.value} className="px-3 py-2">
                          {period?.isLunch || period?.isBreak ? (
                            <Badge color="gray">{period.isLunch ? 'Lunch' : 'Break'}</Badge>
                          ) : period?.subject ? (
                            <div>
                              <p className="text-gray-200 font-medium">{period.subject.name}</p>
                              <p className="text-xs text-gray-500">
                                {period.teacher ? `${period.teacher.firstName} ${period.teacher.lastName}` : '—'}
                                {period.room ? ` · ${period.room}` : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
