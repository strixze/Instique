export default function PageHeader({
  title,
  description,
  subtitle,
  action,
  actions,
  secondaryAction,
  badge,
  className = '',
}) {
  const mainAction = action || actions;
  const descText = description || subtitle;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-1 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-deep dark:text-dark-text tracking-tight leading-tight">
            {title}
          </h1>
          {badge && <div className="mt-0.5">{badge}</div>}
        </div>
        {descText && (
          <p className="text-secondary dark:text-dark-text-secondary text-xs mt-1 max-w-xl leading-relaxed">
            {descText}
          </p>
        )}
      </div>
      {(mainAction || secondaryAction) && (
        <div className="shrink-0 flex items-center gap-2 mt-0.5">
          {secondaryAction}
          {mainAction}
        </div>
      )}
    </div>
  );
}
