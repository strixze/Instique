import { uiSound } from '../../utils/soundManager';

export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
}) {
  const switchId = id || (label ? `sw-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleToggle = (e) => {
    if (disabled) return;
    uiSound.toggle();
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center gap-2 select-none cursor-pointer text-xs font-semibold text-deep dark:text-dark-text ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 ${
          checked ? 'bg-forest dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
