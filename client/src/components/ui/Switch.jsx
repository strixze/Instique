import { uiSound } from '../../utils/soundManager';

export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
}) {
  const switchId = id || (label ? `sw-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  const handleToggle = (e) => {
    if (disabled) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    uiSound.toggle();
    const nextChecked = !checked;

    if (onChange) {
      const syntheticEvent = {
        target: { checked: nextChecked, value: nextChecked, id: switchId },
        currentTarget: { checked: nextChecked, value: nextChecked, id: switchId },
        checked: nextChecked,
        nativeEvent: e,
        preventDefault: () => e?.preventDefault?.(),
        stopPropagation: () => e?.stopPropagation?.(),
      };

      // Support both (e) => e.target.checked and (checked) => ...
      onChange(syntheticEvent, nextChecked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleToggle(e);
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 select-none text-xs font-semibold text-deep dark:text-dark-text ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      onClick={(e) => {
        handleToggle(e);
      }}
    >
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle(e);
        }}
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
      {label && <span className="select-none">{label}</span>}
    </div>
  );
}
