'use client';

import { useState, useMemo } from 'react';
import { Estimate } from '@/types';
import { dualCurrencyTotals, sortEstimates, computeTotals } from '@/utils/analytics';
import { formatCurrency } from '@/utils/currency';

export type SortKey = 'date' | 'client' | 'currency' | 'amountInvoice' | 'amountBase' | 'rate' | 'status';

interface AnalyticsViewProps {
  estimates: Estimate[];
  baseCurrency: string;
}

function SortArrow({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return <span className="text-gray-300" aria-hidden="true">⇅</span>;
  return <span className="text-blue-700" aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const ariaLabel =
    currentSort === sortKey
      ? `Sort ${label} ${currentDir}`
      : `Sort ${label}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSort(sortKey);
    }
  };

  return (
    <th
      scope="col"
      tabIndex={0}
      role="columnheader"
      aria-sort={currentSort === sortKey ? (currentDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      aria-label={ariaLabel}
      className="px-3 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      onClick={() => onSort(sortKey)}
      onKeyDown={handleKeyDown}
    >
      <span className={`inline-flex items-center gap-1 ${currentSort === sortKey ? 'text-blue-700' : ''}`}>
        {label}
        <SortArrow active={currentSort === sortKey} direction={currentDir} />
      </span>
    </th>
  );
}

export default function AnalyticsView({ estimates, baseCurrency }: AnalyticsViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sortLabels: Record<SortKey, string> = {
    date: 'Date',
    client: 'Client',
    currency: 'Currency',
    amountInvoice: 'Amount (Invoice)',
    amountBase: 'Amount (Base)',
    rate: 'Applied Rate',
    status: 'Status',
  };
  const [announcement, setAnnouncement] = useState<string>('');

  const sorted = useMemo(() => {
    if (estimates.length === 0) return [];

    // Typed guard: extract the base-currency total for an estimate, returning 0
    // for any missing, non-finite, or absent snapshot fields instead of NaN.
    const getAmountBase = (e: Estimate): number => {
      if (typeof e.currency === 'string' && e.currency === baseCurrency) {
        try {
          const t = computeTotals(e).total;
          return typeof t === 'number' && Number.isFinite(t) ? t : 0;
        } catch {
          return 0;
        }
      }
      const snapshot = e.invoiceCurrencyInfo?.amounts?.total?.baseAmount;
      return typeof snapshot === 'number' && Number.isFinite(snapshot) ? snapshot : 0;
    };

    return sortEstimates(estimates, sortKey, sortDir, {
      baseCurrency,
      getAmountBase,
    });
  }, [estimates, sortKey, sortDir, baseCurrency]);

  const handleSort = (key: SortKey) => {
    let newDir: 'asc' | 'desc';
    if (sortKey === key) {
      newDir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDir(newDir);
    } else {
      setSortKey(key);
      newDir = 'asc';
      setSortDir('asc');
    }
    const label = sortLabels[key];
    const dirText = newDir === 'asc' ? 'ascending' : 'descending';
    setAnnouncement(`Table sorted by ${label}, ${dirText}`);
  };

  const totals = useMemo(() => dualCurrencyTotals(estimates, baseCurrency), [estimates, baseCurrency]);
  const totalInvoices = estimates.length;
  const totalBaseCurrency = useMemo(() => {
    let sum = 0;
    for (const [, val] of totals.byBaseCurrency) {
      sum += val.total;
    }
    return sum;
  }, [totals]);

  const topCurrencies = useMemo(() => {
    return Array.from(totals.byInvoiceCurrency.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  }, [totals]);

  return (
    <div className="space-y-6">
      <div
        style={{
          position: 'fixed',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Total Invoices</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{totalInvoices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Total in {baseCurrency}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totalBaseCurrency, baseCurrency)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-gray-500 mb-2">Top Currencies</p>
          {topCurrencies.length === 0 ? (
            <p className="text-sm text-gray-400">No invoices yet</p>
          ) : (
            <div className="space-y-1">
              {topCurrencies.map(([code, data]) => (
                <div key={code} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{code}</span>
                  <span className="text-gray-600">
                    {data.count} — {formatCurrency(data.total, code)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader label="Date" sortKey="date" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Client" sortKey="client" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Currency" sortKey="currency" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Amount (Invoice)" sortKey="amountInvoice" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Amount (Base)" sortKey="amountBase" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Applied Rate" sortKey="rate" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="Status" sortKey="status" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    No invoices to display.
                  </td>
                </tr>
              ) : (
                sorted.map((est, idx) => {
                  const estTotals = computeTotals(est);
                  const date = est.issuedAt ? new Date(est.issuedAt) : null;
                  const rate = est.invoiceCurrencyInfo?.rate?.rate ?? 1;
                  const baseAmount =
                    est.invoiceCurrencyInfo?.amounts?.total?.baseAmount ?? 0;
                  const isBaseSame = est.currency === baseCurrency;

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {date ? date.toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{est.client?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{est.currency}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatCurrency(estTotals.total, est.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {isBaseSame
                          ? formatCurrency(estTotals.total, baseCurrency)
                          : formatCurrency(baseAmount, baseCurrency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {rate != null
                          ? isBaseSame
                            ? '1'
                            : typeof rate === 'number'
                              ? rate.toFixed(rate < 1 ? 4 : 2)
                              : String(rate)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            est.isIssued
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {est.isIssued ? 'Issued' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
