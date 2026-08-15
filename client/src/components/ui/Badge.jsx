const colors = {
  success: 'bg-success-light text-success-text border-success/20',
  warning: 'bg-warning-light text-warning-text border-warning/20',
  danger: 'bg-danger-light text-danger-text border-danger/20',
  info: 'bg-info-light text-info-text border-info/20',
  primary: 'bg-sage text-forest border-forest/20 font-semibold',
  gray: 'bg-surface text-secondary border-border',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors[color] || colors.gray} ${className}`}>
      {children}
    </span>
  );
}
