import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ title = 'No data found', description = 'There is nothing here yet.', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-sage-soft rounded-2xl mb-4">
        <Inbox size={40} className="text-muted" />
      </div>
      <h3 className="text-lg font-medium text-deep mb-1">{title}</h3>
      <p className="text-sm text-muted mb-4 max-w-sm">{description}</p>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
