import { ChevronRight } from 'lucide-react';
import { uiSound } from '../../utils/soundManager';

export default function MobileListRow({
  avatar,
  title,
  subtitle,
  secondary,
  badge,
  action,
  showChevron = true,
  onClick,
  className = '',
}) {
  const handleClick = (e) => {
    if (onClick) {
      uiSound.tap?.();
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3.5 bg-white dark:bg-dark-card hover:bg-surface/60 dark:hover:bg-dark-hover transition-colors ${
        onClick ? 'cursor-pointer active:bg-surface/80 dark:active:bg-dark-hover/80' : ''
      } ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Leading Avatar / Icon */}
      {avatar && <div className="shrink-0">{avatar}</div>}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <p className="font-bold text-sm text-deep dark:text-dark-text truncate leading-snug">
            {title}
          </p>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <p className="text-xs text-muted dark:text-dark-text-muted truncate mt-0.5 font-medium">
            {subtitle}
          </p>
        )}

        {secondary && (
          <div className="text-xs text-secondary dark:text-dark-text-secondary mt-1">
            {secondary}
          </div>
        )}
      </div>

      {/* Trailing Action or Chevron */}
      {action ? (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      ) : showChevron && onClick ? (
        <div className="shrink-0 text-muted/60 dark:text-dark-text-muted/60">
          <ChevronRight size={18} strokeWidth={2} />
        </div>
      ) : null}
    </div>
  );
}
