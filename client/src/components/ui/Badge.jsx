const colors = {
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger: 'bg-danger-light text-danger-text',
  info: 'bg-info-light text-info-text',
  primary: 'bg-sage-soft text-forest',
  gray: 'bg-surface text-secondary',
};

export default function Badge({ children, color = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
}
