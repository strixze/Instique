import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCheck, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { attendanceApi } from '../../api/attendance.api';
import { academicApi } from '../../api/academic.api';

export default function Attendance() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [date, setDate] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  const [markOpen, setMarkOpen] = useState(false);
  const [markSaving, setMarkSaving] = useState(false);
  const [markForm, setMarkForm] = useState({ date: '', schoolClass: '', section: '', subject: '' });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportForm, setReportForm] = useState({ classId: '', startDate: '', endDate: '' });
  const [report, setReport] = useState(null);

  useEffect(() => {
    academicApi.getClasses({ limit: 100 }).then((res) => setClasses(res.data)).catch(() => {});
    academicApi.getSections({ limit: 100 }).then((res) => setSections(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await attendanceApi.getAll({
          page,
          limit: 10,
          search: search || undefined,
          filter: {
            ...(filterActive && date ? { date } : {}),
            ...(filterActive && classFilter ? { schoolClass: classFilter } : {}),
          },
        });
        if (!active) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (e) {
        if (active) toast.error(e?.message || 'Failed to load attendance');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, search, reload, filterActive, date, classFilter]);

  const classMap = Object.fromEntries(classes.map((c) => [c._id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s._id, s.name]));

  const handleMarkAllPresent = async () => {
    if (!markForm.date || !markForm.schoolClass || !markForm.section) {
      toast.error('Date, class, and section are required');
      return;
    }
    setMarkSaving(true);
    try {
      await attendanceApi.markAllPresent({
        date: markForm.date,
        schoolClass: markForm.schoolClass,
        section: markForm.section,
        subject: markForm.subject || undefined,
      });
      toast.success('All students marked present');
      setMarkForm({ date: '', schoolClass: '', section: '', subject: '' });
      setMarkOpen(false);
      setLoading(true);
      setReload((r) => r + 1);
    } catch (e) {
      toast.error(e?.message || 'Failed to mark attendance');
    } finally {
      setMarkSaving(false);
    }
  };

  const handleReport = async () => {
    if (!reportForm.classId || !reportForm.startDate || !reportForm.endDate) {
      toast.error('Please fill all report fields');
      return;
    }
    setReportLoading(true);
    try {
      const res = await attendanceApi.getReport({
        classId: reportForm.classId,
        startDate: reportForm.startDate,
        endDate: reportForm.endDate,
      });
      setReport(res.data);
    } catch (e) {
      toast.error(e?.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const markSectionOptions = sections
    .filter((s) => !markForm.schoolClass || s.schoolClass === markForm.schoolClass)
    .map((s) => ({ value: s._id, label: s.name }));

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'schoolClass', label: 'Class', render: (r) => classMap[r.schoolClass] || '—' },
    { key: 'section', label: 'Section', render: (r) => sectionMap[r.section] || '—' },
    { key: 'source', label: 'Source', render: (r) => <Badge color={r.source === 'bulk' ? 'info' : 'gray'}>{r.source}</Badge> },
    { key: 'summary', label: 'Present / Total', render: (r) => `${r.summary?.present ?? 0} / ${r.summary?.total ?? 0}` },
    { key: 'summary2', label: 'Absent', render: (r) => <span className="text-red-400">{r.summary?.absent ?? 0}</span> },
  ];

  const reportStats = [
    { label: 'Total Days', value: report?.totalDays ?? '-' },
    { label: 'Present', value: report?.present ?? '-' },
    { label: 'Absent', value: report?.absent ?? '-' },
    { label: 'Late', value: report?.late ?? '-' },
    { label: 'Leave', value: report?.leave ?? '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="View attendance records and run reports"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReportOpen(true)}><BarChart3 size={16} className="mr-2" />View Report</Button>
            <Button onClick={() => setMarkOpen(true)}><CheckCheck size={16} className="mr-2" />Mark All Present</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-800 border border-gray-700 rounded-xl">
        <div className="w-44">
          <Input label="Date" type="date" value={date} onChange={(e) => { setLoading(true); setDate(e.target.value); }} />
        </div>
        <div className="w-44">
          <Select
            label="Class"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={classFilter}
            onChange={(e) => { setLoading(true); setClassFilter(e.target.value); }}
          />
        </div>
        <Button onClick={() => { setLoading(true); setPage(1); setFilterActive((v) => !v); }}>Apply Filter</Button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} meta={meta} onPageChange={(p) => { setLoading(true); setPage(p); }} onSearch={(s) => { setLoading(true); setSearch(s); setPage(1); }} searchPlaceholder="Search attendance..." />

      <Modal isOpen={markOpen} onClose={() => setMarkOpen(false)} title="Mark All Present">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Date *" type="date" value={markForm.date} onChange={(e) => setMarkForm((f) => ({ ...f, date: e.target.value }))} />
          <Select
            label="Class *"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={markForm.schoolClass}
            onChange={(e) => setMarkForm((f) => ({ ...f, schoolClass: e.target.value, section: '' }))}
          />
          <Select
            label="Section *"
            options={markSectionOptions}
            value={markForm.section}
            onChange={(e) => setMarkForm((f) => ({ ...f, section: e.target.value }))}
          />
          <Input label="Subject (optional)" value={markForm.subject} onChange={(e) => setMarkForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Subject ID" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setMarkOpen(false)}>Cancel</Button>
          <Button onClick={handleMarkAllPresent} loading={markSaving}>Mark All Present</Button>
        </div>
      </Modal>

      <Modal isOpen={reportOpen} onClose={() => { setReportOpen(false); setReport(null); }} title="Attendance Report">
        <div className="space-y-4">
          <Select
            label="Class"
            options={classes.map((c) => ({ value: c._id, label: c.name }))}
            value={reportForm.classId}
            onChange={(e) => setReportForm((f) => ({ ...f, classId: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date" type="date" value={reportForm.startDate} onChange={(e) => setReportForm((f) => ({ ...f, startDate: e.target.value }))} />
            <Input label="End date" type="date" value={reportForm.endDate} onChange={(e) => setReportForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <Button onClick={handleReport} loading={reportLoading} className="w-full">Generate Report</Button>

          {report && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {reportStats.map((s) => (
                <div key={s.label} className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-xl font-bold text-gray-100">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
