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
        <label htmlFor={inputId} className="block text-xs font-semibold text-deep">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative rounded-lg">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full px-3 py-2 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all duration-150 ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
