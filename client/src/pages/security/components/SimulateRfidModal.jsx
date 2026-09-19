import { useState, useEffect } from 'react';
import { Radio, Sparkles, AlertCircle, RefreshCw, User, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import UserAvatar from '../../../components/ui/UserAvatar';
import rfidAdapter from '../../../services/rfidAdapter';
import toast from 'react-hot-toast';

export default function SimulateRfidModal({ isOpen, onClose, onScanComplete }) {
  const [mockTags, setMockTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = async () => {
    setLoadingTags(true);
    try {
      const tags = await rfidAdapter.getMockTags();
      setMockTags(tags);
    } catch (err) {
      toast.error('Failed to load mock RFID tags');
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSimulateScan = async (tag) => {
    if (!tag || !tag.trim()) {
      toast.error('Please enter or select an RFID tag');
      return;
    }
    setScanning(true);
    try {
      const result = await rfidAdapter.handleRfidScan(tag);
      onScanComplete?.(result);
      onClose();
    } catch (err) {
      onScanComplete?.({
        error: true,
        status: err?.status || 'ERROR',
        message: err?.message || 'RFID Scan failed',
        tag,
      });
      onClose();
    } finally {
      setScanning(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate RFID Card Scan"
      description="Select an existing student card or test an arbitrary card identifier"
      size="lg"
    >
      <div className="space-y-4">
        {/* Custom manual tag input */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-card border border-border dark:border-dark-border space-y-2">
          <label className="text-xs font-semibold text-deep dark:text-dark-text block">
            Custom Card Identifier / Test Unknown Card
          </label>
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="e.g. RFID-STU-101 or RFID-UNKNOWN-999"
              className="flex-1 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSimulateScan(customTag);
                }
              }}
            />
            <Button
              variant="primary"
              size="sm"
              loading={scanning}
              onClick={() => handleSimulateScan(customTag)}
              disabled={!customTag.trim()}
            >
              Scan Tag
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCustomTag('RFID-UNKNOWN-999')}
              className="text-[11px] text-muted hover:text-deep dark:hover:text-dark-text underline cursor-pointer"
            >
              Try Unknown RFID ('RFID-UNKNOWN-999')
            </button>
          </div>
        </div>

        {/* Real student card picker */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border/80 dark:border-dark-border">
            <h3 className="text-xs font-bold text-deep dark:text-dark-text uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-forest dark:text-emerald-400" />
              Registered Student RFID Cards ({mockTags.length})
            </h3>
            <button
              type="button"
              onClick={loadTags}
              disabled={loadingTags}
              className="text-xs text-muted hover:text-forest dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} className={loadingTags ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="mt-2.5 max-h-64 overflow-y-auto space-y-1.5 scrollbar-thin">
            {loadingTags ? (
              <div className="py-8 text-center text-xs text-muted">Loading student RFID mappings...</div>
            ) : mockTags.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No students found in this school. Please register students first.
              </div>
            ) : (
              mockTags.map((item, idx) => (
                <div
                  key={item.rfidTag || idx}
                  onClick={() => !scanning && handleSimulateScan(item.rfidTag)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/80 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-forest/5 dark:hover:bg-emerald-500/10 hover:border-forest/30 dark:hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      name={`${item.student?.firstName || ''} ${item.student?.lastName || ''}`}
                      gender={item.student?.gender}
                      role="student"
                      size="sm"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-deep dark:text-dark-text truncate group-hover:text-forest dark:group-hover:text-emerald-400">
                        {item.student?.firstName} {item.student?.lastName}
                      </p>
                      <p className="text-[11px] text-muted dark:text-dark-text-muted">
                        ID: <span className="font-semibold text-secondary dark:text-dark-text-secondary">{item.student?.admissionNo}</span>
                        {item.student?.currentClass && item.student.currentClass !== '—' && (
                          <span className="ml-1.5">• Class: {item.student.currentClass}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-elevated text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-dark-border">
                      {item.rfidTag}
                    </span>
                    <Button variant="soft" size="xs">
                      Tap
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
