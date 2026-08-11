export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-deep">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-white border border-border rounded-lg text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all duration-150 ${error ? 'border-danger focus:ring-danger/30' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
