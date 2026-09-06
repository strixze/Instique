import { uiSound } from '../../utils/soundManager';

const variants = {
  primary: 'bg-forest text-white hover:bg-forest-hover focus:ring-forest/20 shadow-2xs active:bg-forest-dark dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:active:bg-emerald-600 dark:text-gray-900 dark:focus:ring-emerald-500/20',
  secondary: 'bg-white text-deep border border-border hover:bg-surface hover:border-slate-300 focus:ring-forest/20 shadow-2xs dark:bg-dark-card dark:text-dark-text dark:border-dark-border dark:hover:bg-dark-hover dark:hover:border-dark-border-strong dark:focus:ring-emerald-500/20',
  danger: 'bg-danger text-white hover:bg-danger-dark focus:ring-danger/20 shadow-2xs',
  'danger-outline': 'bg-white text-danger border border-danger/30 hover:bg-danger-light focus:ring-danger/20 shadow-2xs dark:bg-dark-card dark:border-danger/20 dark:hover:bg-red-500/10',
  ghost: 'bg-transparent text-secondary hover:bg-surface hover:text-deep focus:ring-forest/20 dark:text-dark-text-secondary dark:hover:bg-dark-hover dark:hover:text-dark-text dark:focus:ring-emerald-500/20',
  outline: 'bg-white border border-border text-secondary hover:text-deep hover:bg-surface focus:ring-forest/20 shadow-2xs dark:bg-dark-card dark:border-dark-border dark:text-dark-text-secondary dark:hover:text-dark-text dark:hover:bg-dark-hover dark:focus:ring-emerald-500/20',
  soft: 'bg-sage text-forest hover:bg-sage-border focus:ring-forest/20 font-semibold dark:bg-dark-accent-soft dark:text-dark-accent dark:hover:bg-emerald-500/15 dark:focus:ring-emerald-500/20',
  link: 'bg-transparent text-forest hover:underline p-0 h-auto shadow-none dark:text-emerald-400',
};

const sizes = {
  xs: 'px-2 py-1 text-[11px] rounded-md gap-1 h-7',
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5 h-8',
  md: 'px-3.5 py-2 text-xs sm:text-sm rounded-lg gap-2 h-9',
  lg: 'px-4.5 py-2.5 text-sm rounded-lg gap-2 h-10',
  icon: 'p-1.5 rounded-lg w-8 h-8 flex items-center justify-center',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  loading,
  type = 'button',
  onClick,
  ...props
}) {
  const handleClick = (e) => {
    if (!disabled && !loading) {
      uiSound.tap();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center font-medium select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-dark-bg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
