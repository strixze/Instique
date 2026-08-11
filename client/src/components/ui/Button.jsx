const variants = {
  primary: 'bg-forest text-white hover:bg-forest-dark focus:ring-forest/40',
  secondary: 'bg-white text-deep border border-border hover:bg-sage-soft focus:ring-forest/20',
  danger: 'bg-danger text-white hover:bg-danger-text focus:ring-danger/40',
  ghost: 'bg-transparent text-secondary hover:bg-sage-soft hover:text-deep focus:ring-forest/20',
  outline: 'border border-border text-deep hover:bg-sage-soft focus:ring-forest/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
