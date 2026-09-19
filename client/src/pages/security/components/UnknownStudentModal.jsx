import { useState } from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { gateSecurityApi } from '../../../api/gateSecurity.api';
import toast from 'react-hot-toast';

export default function UnknownStudentModal({ isOpen, onClose, onRecorded }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    approximateClass: '',
    notes: '',
    eventType: 'ENTRY',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.notes.trim()) {
      toast.error('Please describe the situation in the notes field');
      return;
    }

    setSubmitting(true);
    try {
      await gateSecurityApi.recordUnknownStudent(form);
      toast.success('Unknown student event recorded');
      setForm({ name: '', approximateClass: '', notes: '', eventType: 'ENTRY' });
      onRecorded?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to record event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Unknown / Unverified Student"
      description="Log entry or exit for students without valid ID card or verification"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>
            This records a security gate log only. It does <strong>not</strong> create a new student master record or affect attendance.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Student Name (if provided)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Yash (unverified)"
          />
          <Input
            label="Approximate Grade / Class"
            value={form.approximateClass}
            onChange={(e) => setForm({ ...form, approximateClass: e.target.value })}
            placeholder="e.g. Claims Class 7"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-deep dark:text-dark-text mb-1">
            Movement Type <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, eventType: 'ENTRY' })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                form.eventType === 'ENTRY'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-dark-card border-border dark:border-dark-border text-secondary'
              }`}
            >
              Gate Entry
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, eventType: 'EXIT' })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                form.eventType === 'EXIT'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-dark-card border-border dark:border-dark-border text-secondary'
              }`}
            >
              Gate Exit
            </button>
          </div>
        </div>

        <Input
          label="Notes / Description"
          required
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="e.g. Forgot card at home, verified verbally by Class Teacher Mr. Joshi"
        />

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={submitting}>
            Record Log
          </Button>
        </div>
      </form>
    </Modal>
  );
}
