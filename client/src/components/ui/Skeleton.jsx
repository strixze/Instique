export default function Skeleton({ className = '' }) {
  return <div className={`animate-shimmer rounded ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white border border-border rounded-card overflow-hidden shadow-card">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-8 w-48" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border/50 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
