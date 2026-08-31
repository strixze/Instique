export default function Input({
  label,
  error,
  helperText,
  className = '',
  leftIcon,
  rightIcon,
  id,
  required,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-deep dark:text-dark-text">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative rounded-lg">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full px-3 py-2 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-lg text-xs sm:text-sm text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 transition-all duration-150 ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'hover:border-slate-300 dark:hover:border-dark-border-strong'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted dark:text-dark-text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
