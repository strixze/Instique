export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-semibold text-secondary">{label}</label>}
      <input
        className={`w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs sm:text-sm text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all duration-150 ${error ? 'border-danger focus:ring-danger/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
    </div>
  );
}
