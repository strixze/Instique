import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ title = 'No data found', description = 'There is nothing here yet.', actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-700/50 rounded-2xl mb-4">
        <Inbox size={40} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
