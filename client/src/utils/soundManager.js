import toast from 'react-hot-toast';

const SOUND_SETTINGS_ENABLED_KEY = 'instique_ui_sounds_enabled';
const SOUND_SETTINGS_VOLUME_KEY = 'instique_ui_sound_volume';

const DEFAULT_ENABLED = true;
const DEFAULT_VOLUME = 0.20; // 20%

// Relative volume levels specified by system design
const SOUND_VOLUMES = {
  tap: 0.15,
  toggle: 0.15,
  checkbox: 0.12,
  select: 0.12,
  navigation: 0.08,
  modal: 0.06,
  success: 0.18,
  error: 0.15,
};

// Cooldown intervals in milliseconds to prevent audio spam
const COOLDOWNS = {
  tap: 45,
  toggle: 45,
  checkbox: 40,
  select: 50,
  navigation: 100,
  modal: 100,
  success: 250,
  error: 250,
};

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = this.loadEnabled();
    this.volume = this.loadVolume();
    this.lastPlay = {};
    this.listeners = new Set();

    // Bind methods for safe invocation as callbacks
    this.tap = this.tap.bind(this);
    this.toggle = this.toggle.bind(this);
    this.checkbox = this.checkbox.bind(this);
    this.select = this.select.bind(this);
    this.navigation = this.navigation.bind(this);
    this.modal = this.modal.bind(this);
    this.success = this.success.bind(this);
    this.error = this.error.bind(this);

    this.setupUnlockListeners();
    this.patchToast();
  }

  loadEnabled() {
    try {
      const stored = localStorage.getItem(SOUND_SETTINGS_ENABLED_KEY);
      if (stored === null) return DEFAULT_ENABLED;
      return stored === 'true';
    } catch {
      return DEFAULT_ENABLED;
    }
  }

  loadVolume() {
    try {
      const stored = localStorage.getItem(SOUND_SETTINGS_VOLUME_KEY);
      if (stored === null) return DEFAULT_VOLUME;
      const val = parseFloat(stored);
      return isNaN(val) ? DEFAULT_VOLUME : Math.max(0, Math.min(1, val));
    } catch {
      return DEFAULT_VOLUME;
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    try {
      localStorage.setItem(SOUND_SETTINGS_ENABLED_KEY, String(this.enabled));
    } catch {}
    this.notifyListeners();
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(val) {
    const num = Math.max(0, Math.min(1, parseFloat(val) || 0));
    this.volume = num;
    try {
      localStorage.setItem(SOUND_SETTINGS_VOLUME_KEY, String(this.volume));
    } catch {}
    this.notifyListeners();
  }

  getVolume() {
    return this.volume;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  setupUnlockListeners() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }

  initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {
      // Silently catch audio context initialization failure
    }
  }

  patchToast() {
    if (typeof window === 'undefined') return;
    try {
      const origSuccess = toast.success;
      const origError = toast.error;
      const self = this;

      if (origSuccess && !origSuccess.__sound_patched) {
        toast.success = function (...args) {
          self.success();
          return origSuccess.apply(this, args);
        };
        toast.success.__sound_patched = true;
      }

      if (origError && !origError.__sound_patched) {
        toast.error = function (...args) {
          self.error();
          return origError.apply(this, args);
        };
        toast.error.__sound_patched = true;
      }
    } catch {
      // Silently ignore patching failures
    }
  }

  shouldPlay(type) {
    if (!this.enabled || this.volume <= 0) return false;
    const now = Date.now();
    const minInterval = COOLDOWNS[type] || 40;
    if (this.lastPlay[type] && now - this.lastPlay[type] < minInterval) {
      return false;
    }
    this.lastPlay[type] = now;
    return true;
  }

  getFinalVolume(type) {
    const relative = SOUND_VOLUMES[type] || 0.15;
    return Math.max(0, Math.min(1, this.volume * relative));
  }

  playToneSequence(notes, type) {
    if (!this.shouldPlay(type)) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const masterVol = this.getFinalVolume(type);

      notes.forEach(({ freq, endFreq, start, duration, type: waveType = 'sine', gain = 1, attack = 0.001 }) => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = waveType;
        const startTime = now + (start || 0);
        const dur = duration || 0.05;
        const endTime = startTime + dur;

        osc.frequency.setValueAtTime(freq, startTime);
        if (endFreq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), endTime);
        }

        const noteGain = masterVol * gain;
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(noteGain, startTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(endTime + 0.01);
      });
    } catch {
      // Silently catch execution failures so main thread is never interrupted
    }
  }

  tap() {
    // Soft, rounded, tactile button tap (~40ms)
    this.playToneSequence([
      { freq: 460, endFreq: 190, start: 0, duration: 0.04, type: 'sine', attack: 0.001 }
    ], 'tap');
  }

  toggle() {
    // Micro mechanical double click (~35ms)
    this.playToneSequence([
      { freq: 780, endFreq: 420, start: 0, duration: 0.016, type: 'sine', attack: 0.001 },
      { freq: 1150, endFreq: 620, start: 0.012, duration: 0.02, type: 'sine', attack: 0.001 }
    ], 'toggle');
  }

  checkbox() {
    // Subtle crisp tick (~25ms)
    this.playToneSequence([
      { freq: 920, endFreq: 680, start: 0, duration: 0.018, type: 'sine', attack: 0.001 },
      { freq: 1250, endFreq: 950, start: 0.004, duration: 0.014, type: 'triangle', gain: 0.5, attack: 0.001 }
    ], 'checkbox');
  }

  select() {
    // Soft digital UI click (~35ms)
    this.playToneSequence([
      { freq: 540, endFreq: 340, start: 0, duration: 0.035, type: 'sine', attack: 0.001 }
    ], 'select');
  }

  navigation() {
    // Extremely subtle soft tap (~30ms)
    this.playToneSequence([
      { freq: 330, endFreq: 170, start: 0, duration: 0.03, type: 'sine', attack: 0.002 }
    ], 'navigation');
  }

  modal() {
    // Soft muted click (~50ms)
    this.playToneSequence([
      { freq: 290, endFreq: 150, start: 0, duration: 0.045, type: 'sine', attack: 0.002 }
    ], 'modal');
  }

  success() {
    // Apple-inspired two-tone system confirmation chime (~110ms)
    this.playToneSequence([
      { freq: 523.25, start: 0, duration: 0.055, type: 'sine', attack: 0.002 },
      { freq: 659.25, start: 0.045, duration: 0.08, type: 'sine', attack: 0.002 }
    ], 'success');
  }

  error() {
    // Short, subtle alert/error tone (~110ms)
    this.playToneSequence([
      { freq: 240, endFreq: 180, start: 0, duration: 0.045, type: 'triangle', attack: 0.002 },
      { freq: 196, endFreq: 140, start: 0.04, duration: 0.075, type: 'sine', attack: 0.002 }
    ], 'error');
  }
}

export const uiSound = new SoundManager();
export default uiSound;
