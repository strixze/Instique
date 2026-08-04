import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save, Calendar, Clock, Coffee, Bell, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { timetableApi } from '../../api/timetable.api';
import { academicApi } from '../../api/academic.api';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function TimetableConfig() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Configuration State
  const [configId, setConfigId] = useState(null);
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]);
  const [periodsPerDay, setPeriodsPerDay] = useState(8);
  const [schoolStartTime, setSchoolStartTime] = useState('08:00');
  const [schoolEndTime, setSchoolEndTime] = useState('14:30');
  const [periodTimings, setPeriodTimings] = useState([]);
  const [lunchBreaks, setLunchBreaks] = useState([{ afterPeriod: 4, durationMinutes: 30 }]);
  
  // Assembly State
  const [assemblyEnabled, setAssemblyEnabled] = useState(false);
  const [assemblyPeriod, setAssemblyPeriod] = useState(1);
  const [assemblyDays, setAssemblyDays] = useState([1, 2, 3, 4, 5]);
  const [assemblyDuration, setAssemblyDuration] = useState(15);
  
  // Fixed Events State
  const [fixedEvents, setFixedEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ day: 1, periodNo: 1, title: '', description: '' });

  useEffect(() => {
    academicApi.getAcademicYears({ limit: 100 }).then((res) => {
      setYears(res.data);
      const current = res.data.find(y => y.isCurrent) || res.data[0];
      if (current) {
        setSelectedYear(current._id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    loadConfig();
  }, [selectedYear]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await timetableApi.getConfig(selectedYear);
      if (res.data) {
        const c = res.data;
        setConfigId(c._id);
        setWorkingDays(c.workingDays || [1, 2, 3, 4, 5]);
        setPeriodsPerDay(c.periodsPerDay || 8);
        setSchoolStartTime(c.schoolStartTime || '08:00');
        setSchoolEndTime(c.schoolEndTime || '14:30');
        setPeriodTimings(c.periodTimings || []);
        setLunchBreaks(c.lunchBreaks || []);
        setAssemblyEnabled(c.assemblyConfig?.enabled || false);
        setAssemblyPeriod(c.assemblyConfig?.periodNo || 1);
        setAssemblyDays(c.assemblyConfig?.days || [1, 2, 3, 4, 5]);
        setAssemblyDuration(c.assemblyConfig?.durationMinutes || 15);
        setFixedEvents(c.fixedEvents || []);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load timetable configuration');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodsCountChange = (e) => {
    const val = parseInt(e.target.value) || 1;
    setPeriodsPerDay(val);
    
    // Dynamically adjust periodTimings array
    setPeriodTimings((prev) => {
      const copy = [...prev];
      if (copy.length < val) {
        // Add new timings
        for (let i = copy.length; i < val; i++) {
          copy.push({
            periodNo: i + 1,
            startTime: '08:00',
            endTime: '08:45',
            type: 'teaching',
            label: `Period ${i + 1}`,
          });
        }
      } else if (copy.length > val) {
        copy.splice(val);
      }
      return copy;
    });
  };

  const updateTimingField = (index, field, value) => {
    setPeriodTimings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleWorkingDay = (day) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) {
          toast.error('Must have at least one working day');
          return prev;
        }
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort();
    });
  };

  const toggleAssemblyDay = (day) => {
    setAssemblyDays((prev) => 
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addLunchBreak = () => {
    setLunchBreaks((prev) => [...prev, { afterPeriod: 4, durationMinutes: 30 }]);
  };

  const removeLunchBreak = (idx) => {
    setLunchBreaks((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLunchField = (idx, field, val) => {
    setLunchBreaks((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: parseInt(val) || 0 };
      return copy;
    });
  };

  const addFixedEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    setFixedEvents((prev) => [...prev, { ...newEvent }]);
    setNewEvent({ day: 1, periodNo: 1, title: '', description: '' });
  };

  const removeFixedEvent = (idx) => {
    setFixedEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedYear) {
      toast.error('Please select an Academic Year');
      return;
    }

    setSaving(true);
    const data = {
      academicYear: selectedYear,
      workingDays,
      periodsPerDay,
      periodTimings,
      schoolStartTime,
      schoolEndTime,
      lunchBreaks,
      assemblyConfig: {
        enabled: assemblyEnabled,
        periodNo: assemblyPeriod,
        days: assemblyDays,
        durationMinutes: assemblyDuration,
      },
      fixedEvents,
    };

    try {
      if (configId) {
        await timetableApi.updateConfig(configId, data);
        toast.success('Timetable configuration updated');
      } else {
        const res = await timetableApi.createConfig(data);
        setConfigId(res.data._id);
        toast.success('Timetable configuration created');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        title="Timetable Configuration"
        description="Set school timings, periods, working days, lunch breaks, and scheduling constraints."
        action={
          <div className="flex items-center gap-3">
            <Select
              className="w-48 bg-gray-900 border-gray-700"
              options={years.map(y => ({ value: y._id, label: y.name }))}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Select Academic Year"
            />
            <Button onClick={handleSave} loading={saving}>
              <Save size={16} className="mr-2" /> Save Config
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="h-60 flex items-center justify-center text-gray-400">
          Loading timetable configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Working days & hours */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2 border-b border-gray-700/60 pb-3">
                <Calendar size={18} className="text-indigo-400" /> Working Days
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWorkingDay(d.value)}
                    className={`py-2 px-3 text-sm rounded-lg border transition-all duration-150 text-left font-medium ${
                      workingDays.includes(d.value)
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-gray-900/40 border-gray-700/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2 border-b border-gray-700/60 pb-3">
                <Clock size={18} className="text-indigo-400" /> School Timings & Periods
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="School Start Time"
                  type="time"
                  value={schoolStartTime}
                  onChange={(e) => setSchoolStartTime(e.target.value)}
                />
                <Input
                  label="School End Time"
                  type="time"
                  value={schoolEndTime}
                  onChange={(e) => setSchoolEndTime(e.target.value)}
                />
              </div>
              <Input
                label="Number of Periods per Day"
                type="number"
                min="1"
                max="15"
                value={periodsPerDay}
                onChange={handlePeriodsCountChange}
              />
            </div>

            {/* Lunch Configuration */}
            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
                <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                  <Coffee size={18} className="text-indigo-400" /> Lunch Breaks
                </h3>
                <button
                  type="button"
                  onClick={addLunchBreak}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Plus size={14} /> Add Break
                </button>
              </div>

              {lunchBreaks.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No lunch breaks configured.</p>
              ) : (
                <div className="space-y-3">
                  {lunchBreaks.map((lb, idx) => (
                    <div key={idx} className="flex items-end gap-3 bg-gray-900/40 border border-gray-700/40 rounded-lg p-3">
                      <div className="flex-1">
                        <Input
                          label="After Period"
                          type="number"
                          value={lb.afterPeriod}
                          onChange={(e) => updateLunchField(idx, 'afterPeriod', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          label="Duration (mins)"
                          type="number"
                          value={lb.durationMinutes}
                          onChange={(e) => updateLunchField(idx, 'durationMinutes', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLunchBreak(idx)}
                        className="p-2 bg-red-950/30 text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg mb-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Period details & Fixed events */}
          <div className="space-y-6 lg:col-span-2">
            {/* Period timings list */}
            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2 border-b border-gray-700/60 pb-3">
                <Settings size={18} className="text-indigo-400" /> Period Slots Timing Grid
              </h3>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {periodTimings.map((pt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-900/30 border border-gray-700/40 rounded-xl p-3">
                    <div className="col-span-1 text-center font-bold text-gray-400">P{pt.periodNo}</div>
                    <div className="col-span-3">
                      <Input
                        type="time"
                        value={pt.startTime}
                        onChange={(e) => updateTimingField(idx, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="time"
                        value={pt.endTime}
                        onChange={(e) => updateTimingField(idx, 'endTime', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={pt.type}
                        onChange={(e) => updateTimingField(idx, 'type', e.target.value)}
                        options={[
                          { value: 'teaching', label: 'Teaching' },
                          { value: 'lunch', label: 'Lunch' },
                          { value: 'break', label: 'Break' },
                          { value: 'assembly', label: 'Assembly' },
                        ]}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Label"
                        value={pt.label || ''}
                        onChange={(e) => updateTimingField(idx, 'label', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assembly config */}
            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
                <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2">
                  <Bell size={18} className="text-indigo-400" /> Morning Assembly Settings
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assemblyEnabled}
                    onChange={(e) => setAssemblyEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {assemblyEnabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Period Number"
                      type="number"
                      value={assemblyPeriod}
                      onChange={(e) => setAssemblyPeriod(parseInt(e.target.value) || 1)}
                    />
                    <Input
                      label="Duration (minutes)"
                      type="number"
                      value={assemblyDuration}
                      onChange={(e) => setAssemblyDuration(parseInt(e.target.value) || 15)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assembly Days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleAssemblyDay(d.value)}
                          className={`py-1.5 px-3 text-xs rounded-lg border transition-all duration-150 font-medium ${
                            assemblyDays.includes(d.value)
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-gray-900/40 border-gray-700/50 text-gray-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed school events */}
            <div className="bg-gray-800/90 border border-gray-700 rounded-xl p-5 shadow-xl space-y-4">
              <h3 className="text-md font-semibold text-gray-100 flex items-center gap-2 border-b border-gray-700/60 pb-3">
                <Calendar size={18} className="text-indigo-400" /> Fixed Events / Periods (School-wide)
              </h3>
              
              {/* Event list */}
              {fixedEvents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No fixed events configured.</p>
              ) : (
                <div className="space-y-2">
                  {fixedEvents.map((ev, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-900/40 border border-gray-700/40 rounded-xl p-3">
                      <div>
                        <h4 className="font-semibold text-gray-200">{ev.title}</h4>
                        <p className="text-xs text-gray-500">
                          {DAYS.find((d) => d.value === ev.day)?.label} — Period P{ev.periodNo}
                          {ev.description ? ` · ${ev.description}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFixedEvent(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Event form */}
              <div className="bg-gray-900/20 border border-gray-700/50 rounded-xl p-4 mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Add New Fixed Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Day"
                    options={DAYS.map((d) => ({ value: d.value, label: d.label }))}
                    value={newEvent.day}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, day: parseInt(e.target.value) || 0 }))}
                  />
                  <Input
                    label="Period"
                    type="number"
                    value={newEvent.periodNo}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, periodNo: parseInt(e.target.value) || 1 }))}
                  />
                  <Input
                    label="Event Title"
                    placeholder="e.g. Sports Hour, Library"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <Input
                  label="Description"
                  placeholder="Optional details"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                />
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={addFixedEvent}>
                    Add Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
