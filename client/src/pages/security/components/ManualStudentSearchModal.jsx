import { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import UserAvatar from '../../../components/ui/UserAvatar';
import { gateSecurityApi } from '../../../api/gateSecurity.api';
import toast from 'react-hot-toast';

export default function ManualStudentSearchModal({ isOpen, onClose, onEventRecorded }) {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recordingId, setRecordingId] = useState(null);

  const fetchStudents = async (query = '') => {
    setLoading(true);
    try {
      const res = await gateSecurityApi.searchStudents(query.trim());
      setStudents(res.data || res || []);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setStudents([]);
      return;
    }
    // Load initial active students immediately when opened
    fetchStudents('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchStudents(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, isOpen]);

  const handleRecordEvent = async (studentId, eventType) => {
    setRecordingId(studentId);
    try {
      const res = await gateSecurityApi.recordManualStudentEvent({
        studentId,
        eventType,
        gate: 'Main Gate',
      });
      toast.success(`Manual ${eventType} recorded`);
      onEventRecorded?.(res.data || res);
      onClose();
    } catch (err) {
      toast.error(err?.message || `Failed to record ${eventType}`);
    } finally {
      setRecordingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Student Search & Gate Entry/Exit"
      description="Search student by name, student ID, or RFID card tag"
      size="lg"
    >
      <div className="space-y-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type student name, admission number, or RFID tag..."
          leftIcon={<Search size={15} />}
          autoFocus
        />

        <div className="flex items-center justify-between text-[11px] font-semibold text-muted px-1">
          <span>{search.trim() ? `Search Results (${students.length})` : 'Active Students in Database'}</span>
          {students.length > 0 && <span className="text-[10px] text-muted">Showing up to {students.length}</span>}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted">Searching student database...</div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              {search.trim() ? 'No matching students found in database' : 'No active students found'}
            </div>
          ) : (
            students.map((st) => (
              <div
                key={st._id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-dark-border-strong transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    name={`${st.firstName} ${st.lastName}`}
                    gender={st.gender}
                    role="student"
                    size="md"
                  />
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-deep dark:text-dark-text truncate">
                        {st.firstName} {st.lastName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          st.currentGateState === 'INSIDE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-dark-elevated dark:text-slate-300 border border-slate-200 dark:border-dark-border'
                        }`}
                      >
                        {st.currentGateState || 'OUTSIDE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">
                      ID: <span className="font-semibold text-secondary dark:text-dark-text-secondary">{st.admissionNo}</span>
                      {st.currentClass && st.currentClass !== '—' && (
                        <span className="ml-2">Class: {st.currentClass} - {st.currentSection}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Button
                    variant="primary"
                    size="xs"
                    loading={recordingId === st._id}
                    onClick={() => handleRecordEvent(st._id, 'ENTRY')}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <LogIn size={11} />
                    Entry
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    loading={recordingId === st._id}
                    onClick={() => handleRecordEvent(st._id, 'EXIT')}
                    className="gap-1 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <LogOut size={11} />
                    Exit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
