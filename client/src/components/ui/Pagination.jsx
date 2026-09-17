import { ChevronLeft, ChevronRight } from 'lucide-react';
import { uiSound } from '../../utils/soundManager';

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near start: 1, 2, 3, '...', totalPages
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages];
  }

  // Near end: 1, '...', totalPages - 2, totalPages - 1, totalPages
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // In middle: 1, '...', currentPage, '...', totalPages
  return [1, '...', currentPage, '...', totalPages];
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  total,
  limit,
  onPageChange,
  loading = false,
  className = '',
}) {
  if (!totalPages || totalPages <= 0) {
    return null;
  }

  const handlePage = (newPage) => {
    if (loading || newPage < 1 || newPage > totalPages || newPage === page) return;
    uiSound.tap?.();
    onPageChange?.(newPage);
  };

  const from = total != null && limit ? ((page - 1) * limit) + (total > 0 ? 1 : 0) : null;
  const to = total != null && limit ? Math.min(page * limit, total) : null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div
      className={`px-4 py-3 border-t border-border dark:border-dark-border bg-surface/30 dark:bg-dark-elevated/40 text-xs ${className}`}
    >
      {/* ── Mobile Layout (< 768px) ── */}
      <div className="flex md:hidden items-center justify-between w-full gap-2">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => handlePage(page - 1)}
          className="min-h-[44px] min-w-[44px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-border dark:border-dark-border text-xs font-semibold text-deep dark:text-dark-text bg-white dark:bg-dark-elevated hover:bg-surface dark:hover:bg-dark-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer select-none"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="flex flex-col items-center justify-center text-center px-1">
          <span className="text-xs font-bold text-deep dark:text-dark-text whitespace-nowrap">
            {page} <span className="text-muted dark:text-dark-text-muted font-normal">/</span> {totalPages}
          </span>
          {total != null && (
            <span className="text-[10px] text-muted dark:text-dark-text-muted whitespace-nowrap mt-0.5">
              {total} entries
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => handlePage(page + 1)}
          className="min-h-[44px] min-w-[44px] px-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-border dark:border-dark-border text-xs font-semibold text-deep dark:text-dark-text bg-white dark:bg-dark-elevated hover:bg-surface dark:hover:bg-dark-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer select-none"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Desktop Layout (>= 768px) ── */}
      <div className="hidden md:flex items-center justify-between w-full gap-3">
        {/* Showing / Status text */}
        <div className="text-muted dark:text-dark-text-muted truncate min-w-0">
          {from != null && to != null ? (
            <span>
              Showing <span className="font-semibold text-deep dark:text-dark-text">{from}</span> to{' '}
              <span className="font-semibold text-deep dark:text-dark-text">{to}</span> of{' '}
              <span className="font-semibold text-deep dark:text-dark-text">{total}</span> entries
            </span>
          ) : (
            <span>
              Page <span className="font-semibold text-deep dark:text-dark-text">{page}</span> of{' '}
              <span className="font-semibold text-deep dark:text-dark-text">{totalPages}</span>
            </span>
          )}
        </div>

        {/* Numbered Page Buttons + Prev / Next */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Prev Button */}
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => handlePage(page - 1)}
            className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-border dark:border-dark-border text-xs font-medium text-deep dark:text-dark-text bg-white dark:bg-dark-elevated hover:bg-surface dark:hover:bg-dark-hover disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>

          {/* Numbered Page Buttons with Ellipsis */}
          {visiblePages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-muted dark:text-dark-text-muted select-none text-xs font-bold"
                >
                  •••
                </span>
              );
            }

            const isCurrent = p === page;
            return (
              <button
                key={`page-${p}`}
                type="button"
                disabled={loading}
                onClick={() => handlePage(p)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-forest dark:bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-forest/30 dark:ring-emerald-500/30'
                    : 'bg-white dark:bg-dark-elevated border border-border dark:border-dark-border text-deep dark:text-dark-text hover:bg-surface dark:hover:bg-dark-hover shadow-2xs'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => handlePage(page + 1)}
            className="h-8 px-2.5 flex items-center justify-center gap-1 rounded-lg border border-border dark:border-dark-border text-xs font-medium text-deep dark:text-dark-text bg-white dark:bg-dark-elevated hover:bg-surface dark:hover:bg-dark-hover disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            title="Next page"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
