import { uiSound } from '../../utils/soundManager';

export default function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  id,
  required,
  onChange,
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    uiSound.select();
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="space-y-1 w-full text-left">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-deep dark:text-dark-text">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        onChange={handleChange}
        className={`w-full px-3 py-2 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs sm:text-sm text-deep dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 transition-all duration-150 ${
          error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'hover:border-slate-300 dark:hover:border-dark-border-strong'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            {placeholder}
          </option>
        )}
        {options && options.length > 0
          ? options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error ? (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
