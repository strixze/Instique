export default function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  badge,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-deep tracking-tight leading-tight">
            {title}
          </h1>
          {badge && <div className="mt-0.5">{badge}</div>}
        </div>
        {description && (
          <p className="text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="shrink-0 flex items-center gap-2 mt-0.5">
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  );
}
