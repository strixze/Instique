export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-deep tracking-tight">{title}</h1>
        {description && <p className="text-secondary text-xs sm:text-sm mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
