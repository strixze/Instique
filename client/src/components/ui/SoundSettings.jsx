import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useUISound } from '../../services/sound';

export default function SoundSettings({ compact = false }) {
  const { enabled, volume, setEnabled, setVolume, tap, toggle, checkbox, select, success, error } = useUISound();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      setTimeout(() => tap(), 50);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const percentVolume = Math.round(volume * 100);

  if (compact) {
    return (
      <div className="space-y-3 p-3 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {enabled && volume > 0 ? (
              <Volume2 size={16} className="text-forest dark:text-emerald-400" />
            ) : (
              <VolumeX size={16} className="text-muted dark:text-dark-text-muted" />
            )}
            <span className="text-xs font-semibold text-deep dark:text-dark-text">UI Interaction Sounds</span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 ${
              enabled ? 'bg-forest dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-secondary dark:text-dark-text-secondary font-medium">
              <span>Sound Volume</span>
              <span className="font-mono text-deep dark:text-dark-text">{percentVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              onMouseUp={() => tap()}
              onTouchEnd={() => tap()}
              className="w-full accent-forest dark:accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-dark-border rounded-lg"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-dark-elevated border border-border/80 dark:border-dark-border">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {enabled && volume > 0 ? (
              <Volume2 size={18} className="text-forest dark:text-emerald-400" />
            ) : (
              <VolumeX size={18} className="text-muted dark:text-dark-text-muted" />
            )}
            <h3 className="text-sm font-bold text-deep dark:text-dark-text">Tactile Sound Feedback</h3>
          </div>
          <p className="text-xs text-muted dark:text-dark-text-muted">
            Subtle Apple-inspired audio cues for buttons, toggles, checkboxes, navigation, and state updates.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-forest dark:peer-checked:bg-emerald-500" />
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 p-4 rounded-xl bg-slate-50/40 dark:bg-dark-card border border-border/60 dark:border-dark-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-deep dark:text-dark-text">
              <label htmlFor="sound-volume-slider">Master Sound Volume</label>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white dark:bg-dark-elevated border border-border/80 dark:border-dark-border font-bold">
                {percentVolume}%
              </span>
            </div>
            <input
              id="sound-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={volume}
              onChange={handleVolumeChange}
              onMouseUp={() => tap()}
              onTouchEnd={() => tap()}
              className="w-full accent-forest dark:accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-dark-border rounded-lg transition-all"
            />
            <div className="flex justify-between text-[10px] text-muted dark:text-dark-text-muted px-0.5">
              <span>Mute</span>
              <span>20% (Default)</span>
              <span>100%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 dark:border-dark-border">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles size={13} className="text-forest dark:text-emerald-400" />
              <span className="text-xs font-semibold text-secondary dark:text-dark-text-secondary">Sound Preview</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={tap}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-hover border border-border/80 dark:border-dark-border rounded-lg text-deep dark:text-dark-text transition-colors"
              >
                Button Tap
              </button>
              <button
                type="button"
                onClick={toggle}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-hover border border-border/80 dark:border-dark-border rounded-lg text-deep dark:text-dark-text transition-colors"
              >
                Toggle
              </button>
              <button
                type="button"
                onClick={checkbox}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-hover border border-border/80 dark:border-dark-border rounded-lg text-deep dark:text-dark-text transition-colors"
              >
                Checkbox
              </button>
              <button
                type="button"
                onClick={select}
                className="px-2.5 py-1.5 bg-white dark:bg-dark-elevated hover:bg-slate-100 dark:hover:bg-dark-hover border border-border/80 dark:border-dark-border rounded-lg text-deep dark:text-dark-text transition-colors"
              >
                Select Click
              </button>
              <button
                type="button"
                onClick={success}
                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium rounded-lg transition-colors"
              >
                Success Chime
              </button>
              <button
                type="button"
                onClick={error}
                className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 font-medium rounded-lg transition-colors"
              >
                Error Tone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
