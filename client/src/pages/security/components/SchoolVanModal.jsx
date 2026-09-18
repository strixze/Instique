import { useState, useEffect } from 'react';
import { Bus, LogIn, LogOut, Plus, RefreshCw, Phone, User } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { gateSecurityApi } from '../../../api/gateSecurity.api';
import toast from 'react-hot-toast';

export default function SchoolVanModal({ isOpen, onClose, onVehicleUpdated }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    type: 'van',
    driverName: '',
    driverPhone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
      setShowAddForm(false);
    }
  }, [isOpen]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await gateSecurityApi.getVehicles();
      setVehicles(res.data || res || []);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleGateEvent = async (vehicleId, vehicleNumber, eventType) => {
    setActionLoadingId(vehicleId);
    try {
      await gateSecurityApi.recordVehicleGateEvent({
        vehicleId,
        eventType,
        gate: 'Main Gate',
      });
      toast.success(`${vehicleNumber} ${eventType === 'ENTRY' ? 'Checked In' : 'Checked Out'}`);
      loadVehicles();
      onVehicleUpdated?.();
    } catch (err) {
      toast.error(err?.message || `Failed to record ${eventType}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.vehicleNumber.trim()) {
      toast.error('Vehicle registration number is required');
      return;
    }

    setSubmittingAdd(true);
    try {
      await gateSecurityApi.createVehicle(newVehicle);
      toast.success('School vehicle registered');
      setNewVehicle({ vehicleNumber: '', type: 'van', driverName: '', driverPhone: '', notes: '' });
      setShowAddForm(false);
      loadVehicles();
    } catch (err) {
      toast.error(err?.message || 'Failed to register vehicle');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="School Vans & Buses In/Out"
      description="Record arrival and departure for authorized school transport vehicles"
      size="lg"
    >
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between pb-1 border-b border-border/80 dark:border-dark-border">
          <span className="text-xs text-muted">
            Authorized Transport ({vehicles.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadVehicles}
              disabled={loading}
              className="text-xs text-muted hover:text-deep dark:hover:text-dark-text flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Button
              variant="soft"
              size="xs"
              onClick={() => setShowAddForm(!showAddForm)}
              className="gap-1"
            >
              <Plus size={11} />
              {showAddForm ? 'Cancel' : 'Add Vehicle'}
            </Button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddVehicle} className="p-3 rounded-xl bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider">
              Register New Vehicle
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Registration No."
                required
                value={newVehicle.vehicleNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                placeholder="e.g. MH-04-AB-1234"
              />
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-deep dark:text-dark-text">Vehicle Type</label>
                <select
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs"
                >
                  <option value="van">Van</option>
                  <option value="bus">Bus</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="Driver Name"
                value={newVehicle.driverName}
                onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
                placeholder="e.g. Ramesh"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                label="Driver Phone"
                value={newVehicle.driverPhone}
                onChange={(e) => setNewVehicle({ ...newVehicle, driverPhone: e.target.value })}
                placeholder="e.g. 9876543210"
              />
              <Input
                label="Notes / Route"
                value={newVehicle.notes}
                onChange={(e) => setNewVehicle({ ...newVehicle, notes: e.target.value })}
                placeholder="e.g. Route 4B - Thane West"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" variant="primary" size="xs" loading={submittingAdd}>
                Save Vehicle
              </Button>
            </div>
          </form>
        )}

        <div className="max-h-72 overflow-y-auto space-y-2 scrollbar-thin">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted">Loading school vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">No vehicles registered yet</div>
          ) : (
            vehicles.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-dark-border-strong transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-forest/10 dark:bg-emerald-500/15 text-forest dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bus size={18} />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-deep dark:text-dark-text font-mono">
                        {v.vehicleNumber}
                      </span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-dark-border">
                        {v.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          v.currentGateState === 'INSIDE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-dark-elevated dark:text-slate-400 border border-slate-200 dark:border-dark-border'
                        }`}
                      >
                        {v.currentGateState || 'OUTSIDE'}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5 flex items-center gap-2">
                      {v.driverName && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> Driver: {v.driverName}
                        </span>
                      )}
                      {v.driverPhone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {v.driverPhone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Button
                    variant="primary"
                    size="xs"
                    loading={actionLoadingId === v._id}
                    onClick={() => handleGateEvent(v._id, v.vehicleNumber, 'ENTRY')}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <LogIn size={11} />
                    Check In
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    loading={actionLoadingId === v._id}
                    onClick={() => handleGateEvent(v._id, v.vehicleNumber, 'EXIT')}
                    className="gap-1 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <LogOut size={11} />
                    Check Out
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
