import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No data found',
  description = 'There is nothing here yet.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-border flex items-center justify-center mb-3">
        <Icon size={22} className="text-muted" strokeWidth={1.6} />
      </div>
      <h3 className="text-sm font-semibold text-deep mb-1">{title}</h3>
      <p className="text-xs text-muted mb-4 max-w-xs leading-relaxed">{description}</p>
      {actionLabel && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
