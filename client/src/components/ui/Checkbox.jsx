import { uiSound } from '../../utils/soundManager';

export default function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  id,
  helperText,
  ...props
}) {
  const checkboxId = id || (label ? `chk-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = (e) => {
    if (disabled) return;
    uiSound.checkbox();
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2 select-none text-xs font-medium text-deep dark:text-dark-text ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="w-4 h-4 rounded border-border dark:border-dark-border text-forest dark:text-emerald-500 focus:ring-forest/20 dark:focus:ring-emerald-500/20 accent-forest dark:accent-emerald-500 transition-colors"
        {...props}
      />
      {label && <span>{label}</span>}
      {helperText && <span className="text-[11px] text-muted dark:text-dark-text-muted ml-1">({helperText})</span>}
    </label>
  );
}
