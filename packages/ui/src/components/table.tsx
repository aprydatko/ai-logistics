import * as React from 'react';

import { cn } from '@repo/ui/lib/utils';

function DataTable({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="data-table"
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function TableScrollArea({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="table-scroll-area"
      className={cn(
        'w-full overflow-x-auto [scrollbar-color:var(--border)_var(--surface-100)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600',
        className
      )}
      {...props}
    />
  );
}

function Table({
  className,
  ...props
}: React.ComponentProps<'table'>): React.JSX.Element {
  return (
    <table
      data-slot="table"
      className={cn('w-full caption-bottom border-collapse text-left', className)}
      {...props}
    />
  );
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>): React.JSX.Element {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        'border-b border-border bg-surface-50 shadow-[0_1px_0_0_var(--border)] [&_tr]:border-b',
        className
      )}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>): React.JSX.Element {
  return (
    <tbody
      data-slot="table-body"
      className={cn('divide-y divide-border/60 [&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({
  className,
  ...props
}: React.ComponentProps<'tfoot'>): React.JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t border-border bg-surface-50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

type TableRowProps = React.ComponentProps<'tr'> & {
  isSelected?: boolean;
};

function TableRow({
  className,
  isSelected = false,
  ...props
}: TableRowProps): React.JSX.Element {
  return (
    <tr
      data-slot="table-row"
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'border-b border-border/60 transition-colors hover:bg-accent data-[state=selected]:bg-info-soft-background',
        className
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  ...props
}: React.ComponentProps<'th'>): React.JSX.Element {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-12 border-r border-border/60 px-3 text-xs font-semibold whitespace-nowrap text-primary-700 last:border-r-0 [&:has([role=checkbox])]:text-center',
        className
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  ...props
}: React.ComponentProps<'td'>): React.JSX.Element {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'h-15 border-r border-border/40 px-4 align-middle whitespace-nowrap last:border-r-0 [&:has([role=checkbox])]:text-center',
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>): React.JSX.Element {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function DataTableFooter({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="data-table-footer"
      className={cn(
        'flex flex-col gap-4 border-t border-border/70 px-5 py-5 md:flex-row md:items-center md:justify-between',
        className
      )}
      {...props}
    />
  );
}

export {
  DataTable,
  DataTableFooter,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
};
