import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from './Button';

export default function DataTable({
  columns,
  data = [],
  loading = false,
  meta,
  onPageChange,
  onSort,
  onSearch,
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found',
  className = '',
}) {
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedValue !== searchValue) {
        setDebouncedValue(searchValue);
        onSearch?.(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, onSearch, debouncedValue]);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
    onSort?.(field, order);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/50 dark:text-dark-text-muted/50 ml-1" />;
    return sortOrder === 'asc' ? (
      <ChevronUp size={13} className="text-forest dark:text-emerald-400 ml-1 font-bold" />
    ) : (
      <ChevronDown size={13} className="text-forest dark:text-emerald-400 ml-1 font-bold" />
    );
  };

  return (
    <div className={`bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-2xs ${className}`}>
      {onSearch && (
        <div className="p-3.5 border-b border-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-dark-text-muted" />
            <input
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-dark-elevated border border-border dark:border-dark-border rounded-lg text-deep dark:text-dark-text placeholder-muted dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-forest/20 dark:focus:ring-emerald-500/20 focus:border-forest dark:focus:border-emerald-500 text-xs transition-all"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border dark:border-dark-border bg-slate-50/80 dark:bg-dark-elevated">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3.5 py-2.5 text-xs font-semibold text-secondary dark:text-dark-text-secondary uppercase tracking-wider ${
                    col.sortable && !loading ? 'cursor-pointer hover:text-deep dark:hover:text-dark-text select-none' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  onClick={() => col.sortable && !loading && handleSort(col.key)}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''
                    }`}
                  >
                    <span>{col.label}</span>
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 dark:divide-dark-border bg-white dark:bg-dark-card">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={columns.length} className="px-3.5 py-3">
                    <div className="h-4 bg-slate-100 dark:bg-dark-hover rounded animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-xs text-muted dark:text-dark-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data?.map((row, i) => (
                <tr key={row._id || i} className="hover:bg-slate-50/50 dark:hover:bg-dark-hover transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3.5 py-2.5 text-xs text-deep dark:text-dark-text ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-dark-border bg-slate-50/40 dark:bg-dark-elevated text-xs">
          <span className="text-muted dark:text-dark-text-muted">
            Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !meta.hasPrevPage}
              onClick={() => onPageChange(meta.page - 1)}
              className="p-1 px-2 text-xs"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="font-medium text-secondary dark:text-dark-text-secondary px-1">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || !meta.hasNextPage}
              onClick={() => onPageChange(meta.page + 1)}
              className="p-1 px-2 text-xs"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
