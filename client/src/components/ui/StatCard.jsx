// StatCard — reusable metric card for dashboards
export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = 'text-forest',
  iconBg = 'bg-forest-soft',
  trend,
  trendDirection,
  className = '',
}) {
  const trendColor =
    trendDirection === 'up'
      ? 'text-emerald-600'
      : trendDirection === 'down'
      ? 'text-red-500'
      : 'text-muted';

  return (
    <div
      className={`bg-white border border-border rounded-xl p-4 shadow-2xs flex flex-col gap-1 ${className}`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center mb-1`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      )}
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-deep leading-none mt-0.5">
        {value ?? '—'}
      </p>
      {(sub || trend) && (
        <p className={`text-xs mt-0.5 ${trendDirection ? trendColor : 'text-muted'}`}>
          {trend && <span className="font-medium">{trend} </span>}
          {sub}
        </p>
      )}
    </div>
  );
}
