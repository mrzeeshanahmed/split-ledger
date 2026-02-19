import React, { useState, useMemo, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Loading';

/**
 * Column definition
 */
export interface Column<T> {
  /** Column key */
  key: keyof T | string;
  /** Column header */
  header: string;
  /** Column width */
  width?: string;
  /** Custom cell renderer */
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
  /** Sortable column */
  sortable?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * DataTable props
 */
export interface DataTableProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Column definitions */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Row key accessor */
  rowKey: keyof T | ((row: T) => string);
  /** Enable sorting */
  sortable?: boolean;
  /** Initial sort column */
  defaultSortColumn?: string;
  /** Initial sort direction */
  defaultSortDirection?: 'asc' | 'desc';
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Pagination */
  pagination?: {
    pageSize: number;
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * Sort direction type
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * Sorting icon component
 */
function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="flex flex-col ml-1">
      <svg
        className={cn(
          'w-3 h-3 -mb-0.5 transition-colors',
          direction === 'asc' ? 'text-text-primary' : 'text-text-muted',
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      <svg
        className={cn(
          'w-3 h-3 transition-colors',
          direction === 'desc' ? 'text-text-primary' : 'text-text-muted',
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

/**
 * DataTable - Main table component with sorting and loading states
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  sortable = false,
  defaultSortColumn,
  defaultSortDirection,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRowClick,
  stickyHeader = false,
  compact = false,
  striped = false,
  pagination,
  className,
  ...props
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection || null);

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn as keyof T];
      const bValue = b[sortColumn as keyof T];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Get row key
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey] ?? index);
  };

  // Render skeleton rows
  if (loading) {
    return (
      <div className={cn('bg-white border border-border-default rounded-lg overflow-hidden', className)} {...props}>
        <table className="min-w-full divide-y divide-border-default">
          <thead className="bg-secondary-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider',
                    compact ? 'py-2' : 'py-3',
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-default">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={String(column.key)} className={cn('px-4', compact ? 'py-2' : 'py-3')}>
                    <Skeleton height={14} rounded="sm" className="w-4/5" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className={cn('bg-white border border-border-default rounded-lg', className)} {...props}>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {emptyIcon && <div className="text-text-muted mb-4">{emptyIcon}</div>}
          <p className="text-sm text-text-secondary">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white border border-border-default rounded-lg overflow-hidden', className)} {...props}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-default">
          <thead className={cn('bg-secondary-50', stickyHeader && 'sticky top-0')}>
            <tr>
              {columns.map((column) => {
                const isSortable = sortable && column.sortable;
                const isCurrentSort = sortColumn === column.key;

                return (
                  <th
                    key={String(column.key)}
                    className={cn(
                      'px-4 text-xs font-medium text-text-secondary uppercase tracking-wider',
                      compact ? 'py-2' : 'py-3',
                      column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                      isSortable && 'cursor-pointer select-none hover:bg-secondary-100 transition-colors',
                    )}
                    style={{ width: column.width }}
                    onClick={() => handleSort(String(column.key))}
                    aria-sort={isCurrentSort ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center">
                      {column.header}
                      {isSortable && <SortIcon direction={isCurrentSort ? sortDirection : null} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-default">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={cn(
                  'transition-colors',
                  striped && rowIndex % 2 === 1 && 'bg-secondary-50',
                  onRowClick && 'cursor-pointer hover:bg-secondary-50',
                )}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {columns.map((column) => {
                  const value = column.key.toString().includes('.')
                    ? (column.key as string).split('.').reduce((obj: T, key: string) => (obj as Record<string, unknown>)?.[key] as T, row)
                    : row[column.key as keyof T];

                  return (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-4 text-sm text-text-primary',
                        compact ? 'py-2' : 'py-3',
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      {column.render ? column.render(value as T[keyof T], row, rowIndex) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 bg-secondary-50 border-t border-border-default flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </p>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-text-secondary bg-white border border-border-default rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium text-text-secondary bg-white border border-border-default rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.currentPage * pagination.pageSize >= pagination.totalItems}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
