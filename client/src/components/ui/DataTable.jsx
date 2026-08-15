import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from './Button';

export default function DataTable({ columns, data, loading, meta, onPageChange, onSort, onSearch, searchPlaceholder = 'Search records...' }) {
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
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-muted/60" />;
    return sortOrder === 'asc' ? <ChevronUp size={13} className="text-forest" /> : <ChevronDown size={13} className="text-forest" />;
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-2xs">
      {onSearch && (
        <div className="p-3.5 border-b border-border bg-white">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-border rounded-lg text-deep placeholder-muted focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest text-xs transition-all"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3.5 py-2.5 text-xs font-semibold text-secondary uppercase tracking-wider ${col.sortable && !loading ? 'cursor-pointer hover:text-deep select-none' : ''}`}
                  onClick={() => col.sortable && !loading && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-white">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={columns.length} className="px-3.5 py-3">
                    <div className="h-4 bg-surface rounded-md animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-muted">
                  No records found
                </td>
              </tr>
            ) : (
              data?.map((row, i) => (
                <tr key={row._id || i} className="hover:bg-surface/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3.5 py-2.5 text-xs text-deep whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-surface/30">
          <span className="text-xs text-muted">
            Showing {((meta.page - 1) * meta.limit) + (meta.total > 0 ? 1 : 0)} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
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
            <span className="text-xs font-medium text-secondary px-1">
              Page {meta.page} of {meta.totalPages || 1}
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
