import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${
          sizes[size] || sizes.md
        } bg-white border border-border rounded-2xl shadow-modal my-8 animate-scale-in z-10 flex flex-col max-h-[88vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border/80 shrink-0">
          <div>
            <h2 className="text-base font-bold text-deep leading-tight">{title}</h2>
            {description && (
              <p className="text-xs text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-deep rounded-lg hover:bg-surface transition-colors ml-4"
            title="Close dialog"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-deep">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border/80 bg-slate-50/50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
