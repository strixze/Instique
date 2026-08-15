export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-deep">{label}</label>}
      <select
        className={`w-full px-3 py-2 bg-white border border-border rounded-lg text-deep focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all duration-150 ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
