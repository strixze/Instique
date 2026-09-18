import { useState, useEffect } from 'react';
import { UserCheck, LogOut, Clock, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { gateSecurityApi } from '../../../api/gateSecurity.api';
import toast from 'react-hot-toast';

export default function VisitorModal({ isOpen, onClose, onVisitorUpdated }) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'inside'
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exitingId, setExitingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    purpose: '',
    visitingPersonOrDept: '',
    vehicleNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadActiveVisitors();
    }
  }, [isOpen]);

  const loadActiveVisitors = async () => {
    setLoadingActive(true);
    try {
      const res = await gateSecurityApi.getActiveVisitors();
      setActiveVisitors(res.data || res || []);
    } catch {
      toast.error('Failed to load active visitors');
    } finally {
      setLoadingActive(false);
    }
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.purpose.trim()) {
      toast.error('Name and Purpose are required');
      return;
    }

    setSubmitting(true);
    try {
      await gateSecurityApi.recordVisitorEntry(form);
      toast.success('Visitor entry recorded');
      setForm({
        name: '',
        phone: '',
        purpose: '',
        visitingPersonOrDept: '',
        vehicleNumber: '',
        notes: '',
      });
      loadActiveVisitors();
      onVisitorUpdated?.();
      setActiveTab('inside');
    } catch (err) {
      toast.error(err?.message || 'Failed to record entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkExit = async (visitorId, visitorName) => {
    setExitingId(visitorId);
    try {
      await gateSecurityApi.recordVisitorExit(visitorId, {});
      toast.success(`${visitorName} marked as exited`);
      loadActiveVisitors();
      onVisitorUpdated?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to mark exit');
    } finally {
      setExitingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor & Unknown Person Management"
      description="Record visitor gate entries or check out visitors currently inside"
      size="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border dark:border-dark-border gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'new'
                ? 'border-forest dark:border-emerald-400 text-forest dark:text-emerald-400'
                : 'border-transparent text-muted hover:text-deep dark:hover:text-dark-text'
            }`}
          >
            New Visitor Entry
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('inside');
              loadActiveVisitors();
            }}
            className={`pb-2 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === 'inside'
                ? 'border-forest dark:border-emerald-400 text-forest dark:text-emerald-400'
                : 'border-transparent text-muted hover:text-deep dark:hover:text-dark-text'
            }`}
          >
            <span>Visitors Inside</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-forest/10 dark:bg-emerald-500/20 text-forest dark:text-emerald-300">
              {activeVisitors.length}
            </span>
          </button>
        </div>

        {activeTab === 'new' ? (
          <form onSubmit={handleSubmitEntry} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Visitor Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kulkarni"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Purpose of Visit"
                required
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g. Admission Inquiry / Meeting Principal"
              />
              <Input
                label="Person / Department to Visit"
                value={form.visitingPersonOrDept}
                onChange={(e) => setForm({ ...form, visitingPersonOrDept: e.target.value })}
                placeholder="e.g. Principal / Accounts Dept"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Vehicle Number (if any)"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                placeholder="e.g. MH-04-AB-1234"
              />
              <Input
                label="Notes / ID Details"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Aadhar shown, contractor badge #12"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Record Entry
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-muted pb-1">
              <span>Currently in School Premises ({activeVisitors.length})</span>
              <button
                type="button"
                onClick={loadActiveVisitors}
                disabled={loadingActive}
                className="hover:text-deep dark:hover:text-dark-text flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} className={loadingActive ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
              {loadingActive ? (
                <div className="py-8 text-center text-xs text-muted">Loading visitors...</div>
              ) : activeVisitors.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">No visitors currently inside</div>
              ) : (
                activeVisitors.map((vis) => (
                  <div
                    key={vis._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/80 dark:border-dark-border bg-white dark:bg-dark-card"
                  >
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-deep dark:text-dark-text">{vis.name}</span>
                        {vis.phone && (
                          <span className="text-[11px] text-muted dark:text-dark-text-muted">({vis.phone})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary dark:text-dark-text-secondary mt-0.5">
                        <span className="font-semibold">Purpose:</span> {vis.purpose}
                        {vis.visitingPersonOrDept && <span> • Visiting: {vis.visitingPersonOrDept}</span>}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted dark:text-dark-text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          In at: {new Date(vis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {vis.vehicleNumber && <span>• Veh: {vis.vehicleNumber}</span>}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="xs"
                      loading={exitingId === vis._id}
                      onClick={() => handleMarkExit(vis._id, vis.name)}
                      className="gap-1 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0 ml-3"
                    >
                      <LogOut size={11} />
                      Mark Exit
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
