export default function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  id,
  required,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1 w-full text-left">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-deep">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3 py-2 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all duration-150 ${
          error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'hover:border-slate-300'
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-danger mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
