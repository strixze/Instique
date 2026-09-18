import React from 'react';
import Skeleton from './Skeleton';

/**
 * MobileSummaryCards
 *
 * Standardized 2x2 summary card grid for mobile viewports (< 768px).
 * Automatically hidden on tablet and desktop (md:hidden).
 *
 * @param {Array} metrics - Array of 4 metric objects:
 *   - label: string
 *   - value: string | number
 *   - sub?: string (optional secondary text)
 *   - icon?: React.ComponentType
 *   - iconColor?: string (Tailwind class, defaults to text-forest)
 *   - iconBg?: string (Tailwind class, defaults to bg-forest-soft)
 *   - trend?: string
 *   - trendDirection?: 'up' | 'down' | 'neutral'
 * @param {boolean} loading - When true, shows 4 skeleton cards
 * @param {string} error - Optional error message
 * @param {string} className - Additional CSS classes
 */
export default function MobileSummaryCards({
  metrics = [],
  loading = false,
  error = null,
  className = 'mb-4',
}) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-2.5 md:hidden ${className}`} aria-label="Loading summary metrics">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3 xs:p-3.5 shadow-2xs flex flex-col justify-between min-h-[92px]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="w-10 h-3 rounded" />
            </div>
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-5 xs:h-6 w-14 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`grid grid-cols-2 gap-2.5 md:hidden ${className}`}>
        <div className="col-span-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Unable to load summary metrics</p>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Ensure exactly up to 4 cards are rendered
  const displayMetrics = metrics.slice(0, 4);

  return (
    <div className={`grid grid-cols-2 gap-2.5 md:hidden ${className}`} aria-label="Summary metrics">
      {displayMetrics.map((metric, index) => {
        const Icon = metric.icon;
        const iconColor = metric.iconColor || 'text-forest dark:text-forest-400';
        const iconBg = metric.iconBg || 'bg-forest-soft dark:bg-forest/10';
        
        const trendColor =
          metric.trendDirection === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : metric.trendDirection === 'down'
            ? 'text-red-500 dark:text-red-400'
            : 'text-muted dark:text-dark-text-muted';

        const displayValue = metric.value !== undefined && metric.value !== null ? metric.value : '—';

        return (
          <div
            key={index}
            onClick={metric.onClick}
            role={metric.onClick ? 'button' : undefined}
            tabIndex={metric.onClick ? 0 : undefined}
            className={`bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl p-3 xs:p-3.5 shadow-2xs flex flex-col justify-between overflow-hidden transition-all ${
              metric.onClick ? 'cursor-pointer active:scale-95 hover:border-forest/40 dark:hover:border-emerald-500/40' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              {Icon ? (
                <div
                  className={`w-7 h-7 xs:w-8 xs:h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </div>
              ) : (
                <div className="w-7 h-7" />
              )}
              {metric.sub && (
                <span className="text-[10px] text-muted dark:text-dark-text-muted truncate text-right max-w-[55%]">
                  {metric.sub}
                </span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-muted dark:text-dark-text-muted uppercase tracking-wider truncate">
                {metric.label}
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-xl xs:text-2xl font-bold text-deep dark:text-dark-text leading-none tracking-tight truncate">
                  {displayValue}
                </p>
                {metric.trend && (
                  <span className={`text-[10px] font-medium ${trendColor} shrink-0`}>
                    {metric.trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
