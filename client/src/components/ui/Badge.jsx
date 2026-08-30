const colorStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  primary: 'bg-sage text-forest border-forest/20 font-semibold',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
  gray: 'bg-surface text-secondary border-border',
};

const statusColors = {
  active: 'success',
  published: 'success',
  approved: 'success',
  paid: 'success',
  present: 'success',
  completed: 'success',
  ongoing: 'info',
  upcoming: 'info',
  scheduled: 'info',
  in_progress: 'info',
  pending: 'warning',
  partially_paid: 'warning',
  partial: 'warning',
  draft: 'warning',
  late: 'warning',
  inactive: 'gray',
  unpaid: 'danger',
  absent: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  failed: 'danger',
};

export default function Badge({
  children,
  color,
  status,
  size = 'sm',
  className = '',
}) {
  const resolvedColor = color || (status ? (statusColors[status.toLowerCase()] || 'gray') : 'gray');
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border ${sizeClasses} ${
        colorStyles[resolvedColor] || colorStyles.gray
      } ${className}`}
    >
      {children}
    </span>
  );
}
