import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronLeft,
  ChevronRight, CircleDashed, Clock3, Info, LoaderCircle, LockKeyhole, Search, X,
} from "lucide-react";

const STATUS_STYLES = {
  success: { className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200", icon: CheckCircle2 },
  warning: { className: "border-amber-400/20 bg-amber-400/10 text-amber-200", icon: Clock3 },
  danger: { className: "border-red-400/20 bg-red-400/10 text-red-200", icon: AlertCircle },
  pending: { className: "border-sky-400/20 bg-sky-400/10 text-sky-200", icon: LoaderCircle },
  locked: { className: "border-slate-400/20 bg-white/5 text-slate-300", icon: LockKeyhole },
  neutral: { className: "border-white/10 bg-white/5 text-slate-300", icon: CircleDashed },
};

export function StatusBadge({ label, status, variant = "neutral", className = "" }) {
  const config = STATUS_STYLES[variant] || STATUS_STYLES.neutral;
  const Icon = config.icon;
  return (
    <span className={"inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium " + config.className + " " + className}>
      <Icon aria-hidden="true" size={14} className="shrink-0" />
      <span>{label || status || "Status unavailable"}</span>
    </span>
  );
}

export function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Info, className = "" }) {
  return (
    <div className={"rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-9 text-center " + className}>
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
        <Icon aria-hidden="true" size={20} />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-white">{title || "Nothing to show yet"}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-400">{description}</p> : null}
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-revela-dark">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({ title = "Unable to load this section", message = "The data could not be loaded. Check your connection and try again.", onRetry, retrying = false, className = "" }) {
  return (
    <section role="alert" className={"rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-5 " + className}>
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-red-300" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">{message}</p>
          {onRetry ? (
            <button type="button" onClick={onRetry} disabled={retrying} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
              {retrying ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : <ArrowDown aria-hidden="true" size={16} className="rotate-180" />}
              {retrying ? "Retrying" : "Try again"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function Skeleton({ rows = 3, variant = "rows", className = "" }) {
  const count = Math.max(1, Math.min(12, Number(rows) || 3));
  if (variant === "metrics") {
    return (
      <div aria-label="Loading" role="status" className={"grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 " + className}>
        <span className="sr-only">Loading data</span>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-revela-card p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
            <div className="mt-4 h-7 w-32 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-20 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div aria-label="Loading" role="status" className={"space-y-3 " + className}>
      <span className="sr-only">Loading data</span>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-revela-card p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/10 motion-reduce:animate-none" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

function rawCellValue(row, column) {
  if (typeof column.accessor === "function") return column.accessor(row);
  return row == null ? undefined : row[column.key];
}

function printableValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

export function DataTable({
  columns = [], rows = [], getRowId, searchPlaceholder = "Search records",
  filters = [], pageSize = 10, emptyTitle = "No records found",
  emptyDescription = "Adjust the search or filters, or create a record to get started.",
  onEmptyAction, emptyActionLabel, className = "",
}) {
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const [page, setPage] = useState(1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const matchesQuery = !normalizedQuery || columns.some((column) => {
        if (column.searchable === false) return false;
        return printableValue(rawCellValue(row, column)).toLocaleLowerCase().includes(normalizedQuery);
      });
      const matchesFilters = filters.every((filter) => {
        const selected = filterValues[filter.key] || "";
        return !selected || String(rawCellValue(row, { key: filter.key, accessor: filter.accessor })) === selected;
      });
      return matchesQuery && matchesFilters;
    });
  }, [rows, columns, filters, query, filterValues]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return filteredRows;
    return [...filteredRows].sort((left, right) => {
      const a = rawCellValue(left, column);
      const b = rawCellValue(right, column);
      let comparison = 0;
      if (typeof a === "number" && typeof b === "number") comparison = a - b;
      else comparison = String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / safePageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = sortedRows.slice((currentPage - 1) * safePageSize, currentPage * safePageSize);

  const changeSort = (column) => {
    if (column.sortable === false) return;
    setPage(1);
    setSort((current) => current.key === column.key
      ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key: column.key, direction: "asc" });
  };

  const rowKey = (row, index) => {
    if (typeof getRowId === "function") return getRowId(row);
    return row?.id ?? row?._id ?? row?.key ?? String(currentPage) + "-" + String(index);
  };

  const renderValue = (row, column) => {
    const value = rawCellValue(row, column);
    return column.render ? column.render(value, row) : printableValue(value);
  };

  return (
    <section className={"min-w-0 rounded-2xl border border-white/10 bg-revela-card " + className}>
      <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:p-4">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={searchPlaceholder} className="min-h-11 w-full rounded-xl border border-white/10 bg-revela-dark py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
        </label>
        {filters.length ? (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <label key={filter.key} className="min-w-0 flex-1 sm:flex-none">
                <span className="sr-only">{filter.label}</span>
                <select value={filterValues[filter.key] || ""} onChange={(event) => { setFilterValues((current) => ({ ...current, [filter.key]: event.target.value })); setPage(1); }} className="min-h-11 w-full rounded-xl border border-white/10 bg-revela-dark px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 sm:w-auto">
                  <option value="">All {String(filter.label || "records").toLocaleLowerCase()}</option>
                  {(filter.options || []).map((option) => {
                    const value = typeof option === "object" ? option.value : option;
                    const label = typeof option === "object" ? option.label : option;
                    return <option key={String(value)} value={String(value)}>{label}</option>;
                  })}
                </select>
              </label>
            ))}
          </div>
        ) : null}
      </div>

      {sortedRows.length === 0 ? (
        <div className="p-3 sm:p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-white/[0.03] text-xs text-slate-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 font-semibold">
                      {column.sortable === false ? column.label : (
                        <button type="button" onClick={() => changeSort(column)} className="inline-flex min-h-11 items-center gap-2 rounded-md text-left hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
                          {column.label}
                          {sort.key === column.key
                            ? (sort.direction === "asc" ? <ArrowUp aria-hidden="true" size={14} /> : <ArrowDown aria-hidden="true" size={14} />)
                            : <ArrowUpDown aria-hidden="true" size={14} className="text-slate-500" />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleRows.map((row, index) => (
                  <tr key={rowKey(row, index)} className="text-slate-200 hover:bg-white/[0.025]">
                    {columns.map((column) => <td key={column.key} className="px-4 py-3.5 align-middle">{renderValue(row, column)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {visibleRows.map((row, index) => (
              <article key={rowKey(row, index)} className="rounded-xl border border-white/10 bg-revela-dark/60 p-3">
                <dl className="space-y-2">
                  {columns.map((column) => (
                    <div key={column.key} className="grid grid-cols-[minmax(6rem,0.8fr)_minmax(0,1.2fr)] gap-3">
                      <dt className="text-xs text-slate-400">{column.label}</dt>
                      <dd className="min-w-0 break-words text-right text-sm text-slate-100">{renderValue(row, column)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs text-slate-400">Showing {sortedRows.length ? (currentPage - 1) * safePageSize + 1 : 0}–{Math.min(currentPage * safePageSize, sortedRows.length)} of {sortedRows.length} records</p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} aria-label="Previous page" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft aria-hidden="true" size={17} /></button>
              <span aria-live="polite" className="min-w-20 text-center text-xs text-slate-300">Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages} aria-label="Next page" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight aria-hidden="true" size={17} /></button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, busy = false, onConfirm, onOpenChange }) {
  const dialogRef = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const isBusy = busy || confirming;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleConfirm = async () => {
    if (isBusy) return;
    setConfirming(true);
    try {
      await onConfirm?.();
      onOpenChange?.(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="biashara-confirm-title" aria-describedby="biashara-confirm-description" onCancel={(event) => { event.preventDefault(); if (!isBusy) onOpenChange?.(false); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-revela-card p-0 text-white shadow-2xl backdrop:bg-slate-950/75">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (destructive ? "bg-red-400/10 text-red-300" : "bg-emerald-400/10 text-emerald-300")}>
            {destructive ? <AlertCircle aria-hidden="true" size={20} /> : <Info aria-hidden="true" size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="biashara-confirm-title" className="text-base font-semibold">{title || "Confirm this action"}</h2>
            <p id="biashara-confirm-description" className="mt-2 text-sm leading-6 text-slate-300">{description || "Review this action before continuing."}</p>
          </div>
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={isBusy} aria-label="Close dialog" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50"><X aria-hidden="true" size={18} /></button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onOpenChange?.(false)} disabled={isBusy} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50">{cancelLabel}</button>
          <button type="button" onClick={handleConfirm} disabled={isBusy} className={"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 " + (destructive ? "bg-red-600 text-white hover:bg-red-500" : "bg-emerald-500 text-slate-950 hover:bg-emerald-400")}>
            {isBusy ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin motion-reduce:animate-none" /> : null}
            {isBusy ? "Working" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function LockedFeature({ title, reason, requiredPlan, onLearnMore }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-revela-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300"><LockKeyhole aria-hidden="true" size={20} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white">{title || "Feature unavailable"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{reason || "Availability details have not been returned by the backend."}</p>
          {requiredPlan ? <p className="mt-2 text-xs text-slate-400">Plan requirement returned by the backend: {requiredPlan}</p> : null}
          {onLearnMore ? <button type="button" onClick={onLearnMore} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">View details</button> : null}
        </div>
      </div>
    </section>
  );
}

export function DateRangePicker({ startDate = "", endDate = "", onChange, label = "Date range", className = "" }) {
  const invalidRange = Boolean(startDate && endDate && startDate > endDate);
  return (
    <fieldset className={"min-w-0 " + className}>
      <legend className="mb-2 text-sm font-medium text-slate-200">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs text-slate-400">From</span>
          <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => onChange?.({ startDate: event.target.value, endDate })} className="min-h-11 w-full rounded-xl border border-white/10 bg-revela-dark px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs text-slate-400">To</span>
          <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => onChange?.({ startDate, endDate: event.target.value })} className="min-h-11 w-full rounded-xl border border-white/10 bg-revela-dark px-3 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20" />
        </label>
      </div>
      {invalidRange ? <p role="alert" className="mt-2 text-xs text-red-300">The end date must be on or after the start date.</p> : null}
    </fieldset>
  );
}
