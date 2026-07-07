import type { Estimate, InvoiceCurrencyInfo, LineItemBaseAmount } from '@/types'
import { convertAmount, getRate, roundCurrency } from './currency'

export interface DateRangeFilter {
  start?: string
  end?: string
}
export interface FilterOptions {
  status: 'all' | 'draft' | 'issued'
  dateRange?: DateRangeFilter
  client?: string
}
export interface EstimateTotals {
  subtotal: number
  taxAmount: number
  deposit: number
  total: number
  currency: string
}
export interface BaseCurrencyTotals extends EstimateTotals {
  originalCurrency: string
}
export interface DashboardKPIs {
  totalRevenue: number
  totalIssued: number
  totalDraft: number
  averageTicket: number
}
export interface DualCurrencyResult {
  byInvoiceCurrency: Map<string,{count:number,total:number}>
  byBaseCurrency: Map<string,{count:number,total:number}>
}

/**
 * Validate that an InvoiceCurrencyInfo snapshot is complete:
 * every line item has both baseAmount and convertedAmount defined and finite,
 * and all totals (subtotal, tax, deposit, total) are complete.
 */
export function validateInvoiceCurrencyInfo(info: InvoiceCurrencyInfo | null | undefined): boolean {
  if (!info || !info.currency) return false;
  const items = info.amounts.lineItems ?? [];
  for (let i = 0; i < items.length; i++) {
    const li = items[i];
    if (typeof li.baseAmount !== 'number' || !Number.isFinite(li.baseAmount)) return false;
    if (typeof li.convertedAmount !== 'number' || !Number.isFinite(li.convertedAmount)) return false;
  }
  const checkExpr = (li: LineItemBaseAmount | undefined): boolean =>
    !!li &&
    typeof li.baseAmount === 'number' &&
    Number.isFinite(li.baseAmount) &&
    typeof li.convertedAmount === 'number' &&
    Number.isFinite(li.convertedAmount);
  return (
    checkExpr(info.amounts.subtotal) &&
    checkExpr(info.amounts.tax) &&
    checkExpr(info.amounts.deposit) &&
    checkExpr(info.amounts.total)
  );
}

/** Filter estimates by status, date range, client text. */
export function filterEstimates(estimates: Estimate[], options: FilterOptions): Estimate[] {
  return estimates.filter((e) => {
    if (options.status !== 'all' && e.isIssued !== (options.status === 'issued')) return false
    if (options.dateRange?.start) { const t = new Date(options.dateRange.start); const est = e.issuedAt ? new Date(e.issuedAt) : new Date(0); if (est < t) return false }
    if (options.dateRange?.end) { const t2 = new Date(options.dateRange.end); const est2 = e.issuedAt ? new Date(e.issuedAt) : new Date(0); if (est2 > t2) return false }
    if (options.client) { const q = options.client.toLowerCase(); if (!e.client.name.toLowerCase().includes(q) && !e.company.name.toLowerCase().includes(q)) return false }
    return true
  })
}

/** Filter estimates/invoices by currency code. */
export function filterInvoicesByCurrency(invoices: Estimate[], code: string): Estimate[] {
  const target = code.toLowerCase();
  return invoices.filter((inv) => inv.currency.toLowerCase() === target);
}

/** Stable sort by date|total|client|currency|amountBase|rate|status, asc|desc. */
export function sortEstimates(
  estimates: Estimate[],
  key: 'date' | 'total' | 'client' | 'currency' | 'amountBase' | 'rate' | 'status' | 'amountInvoice',
  direction: 'asc' | 'desc' = 'asc',
  opts?: { baseCurrency?: string; getAmountBase?: (e: Estimate) => number }
): Estimate[] {
  const sorted = [...estimates];
  const sign = direction === 'asc' ? 1 : -1;

  const safeNumber = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  sorted.sort((a, b) => {
    let cmp = 0;
    const totalKey = key === 'amountInvoice' ? 'total' : key;
    if (totalKey === 'date') {
      const da = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const db = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      cmp = da - db;
    } else if (totalKey === 'total') {
      cmp = computeTotals(a).total - computeTotals(b).total;
    } else if (totalKey === 'client') {
      cmp = (a.client?.name ?? '').localeCompare(b.client?.name ?? '');
    } else if (totalKey === 'currency') {
      cmp = (a.currency ?? '').localeCompare(b.currency ?? '');
    } else if (totalKey === 'amountBase') {
      const getBase = opts?.getAmountBase ?? (() => 0);
      cmp = safeNumber(getBase(a)) - safeNumber(getBase(b));
    } else if (totalKey === 'rate') {
      const ra = a.invoiceCurrencyInfo?.rate?.rate;
      const rb = b.invoiceCurrencyInfo?.rate?.rate;
      cmp = safeNumber(ra) - safeNumber(rb);
    } else if (totalKey === 'status') {
      const sa = typeof a.isIssued === 'boolean' ? (a.isIssued ? 1 : 0) : 0;
      const sb = typeof b.isIssued === 'boolean' ? (b.isIssued ? 1 : 0) : 0;
      cmp = sa - sb;
    }
    return cmp * sign;
  });
  return sorted;
}


function rawSubtotal(e: Estimate): number {
  if (!Array.isArray(e.lineItems)) return 0;
  return e.lineItems.reduce((s, li) => s + (Number(li.quantity) || 0) * (Number(li.rate) || 0), 0);
}

/** Compute per-estimate totals in own currency. */
export function computeTotals(estimate: Estimate): EstimateTotals {
  const currency = typeof estimate.currency === 'string' ? estimate.currency : 'USD';
  const sub = rawSubtotal(estimate);
  const taxRate = Number(estimate.taxRate) || 0;
  const tax = sub * (taxRate / 100);
  const dep = Number(estimate.deposit) || 0;
  const tot = sub + tax - dep;
  return {
    subtotal: roundCurrency(sub, currency),
    taxAmount: roundCurrency(tax, currency),
    deposit: roundCurrency(dep, currency),
    total: roundCurrency(tot, currency),
    currency,
  };
}

/** Convert all fields to baseCurrency using stored rate or live fetch. */
export async function computeBaseCurrencyTotals(estimate: Estimate, baseCurrency: string): Promise<BaseCurrencyTotals> {
  if (estimate.currency === baseCurrency) return { ...computeTotals(estimate), originalCurrency: estimate.currency }
  const info = estimate.invoiceCurrencyInfo; const rate = info?.rate?.rate ?? (await getRate(estimate.currency, baseCurrency)).rate; const src = computeTotals(estimate)
  return { subtotal: roundCurrency(convertAmount(src.subtotal, estimate.currency, baseCurrency, rate), baseCurrency), taxAmount: roundCurrency(convertAmount(src.taxAmount, estimate.currency, baseCurrency, rate), baseCurrency), deposit: roundCurrency(convertAmount(src.deposit, estimate.currency, baseCurrency, rate), baseCurrency), total: roundCurrency(convertAmount(src.total, estimate.currency, baseCurrency, rate), baseCurrency), currency: baseCurrency, originalCurrency: estimate.currency }
}

/** Aggregate dashboard KPIs in baseCurrency. */
export async function aggregateTotals(estimates: Estimate[], baseCurrency: string): Promise<DashboardKPIs> {
  let revenue = 0, issuedAmt = 0, draftAmt = 0, ic = 0, dc = 0
  for (const est of estimates) { const c = await computeBaseCurrencyTotals(est, baseCurrency); revenue += c.total; if (est.isIssued) { issuedAmt += c.total; ic++ } else { draftAmt += c.total; dc++ } }
  const count = estimates.length
  return { totalRevenue: roundCurrency(revenue, baseCurrency), totalIssued: roundCurrency(issuedAmt, baseCurrency), totalDraft: roundCurrency(draftAmt, baseCurrency), averageTicket: count > 0 ? roundCurrency(revenue / count, baseCurrency) : 0 }
}

/** Group totals by invoice currency and base currency. */
export function dualCurrencyTotals(invoices: Estimate[], baseCurrency: string): DualCurrencyResult {
  const byInv = new Map<string, { count: number; total: number }>();
  const byBase = new Map<string, { count: number; total: number }>();
  for (const inv of invoices) {
    if (!inv || typeof inv.currency !== 'string') continue;
    const info = inv.invoiceCurrencyInfo;
    const inCurr = inv.currency;
    // Use computeTotals (rounded) so summary matches the rounded values shown per row.
    const invT = computeTotals(inv).total;
    const ib = byInv.get(inCurr);
    if (ib) { ib.count++; ib.total += invT } else { byInv.set(inCurr, { count: 1, total: invT }) }

    // Flag incomplete snapshots; trust baseAmount only after validation passes.
    const hasValidSnapshot = info != null
      && info.amounts?.total?.baseAmount != null
      && validateInvoiceCurrencyInfo(info);
    if (info && !hasValidSnapshot) {
      console.warn(`[analytics] Incomplete InvoiceCurrencyInfo for "${inv.client?.name ?? '?'}" — baseAmount or convertedAmount missing on a line item or total; excluded from base-currency totals.`);
    }

    if (hasValidSnapshot) {
      // Frozen snapshot gives a real base-amount conversion.
      const bt = info.amounts.total.baseAmount;
      const bb = byBase.get(baseCurrency);
      if (bb) { bb.count++; bb.total += bt } else { byBase.set(baseCurrency, { count: 1, total: bt }) }
    } else if (inCurr === baseCurrency) {
      // No external rate needed: same currency — rounded total IS the base amount.
      const bb = byBase.get(baseCurrency);
      if (bb) { bb.count++; bb.total += invT } else { byBase.set(baseCurrency, { count: 1, total: invT }) }
    }
    // Else: different currency with no valid snapshot — skip from base-currency
    // totals rather than counting 0 (avoids polluting aggregates).
  }
  return { byInvoiceCurrency: byInv, byBaseCurrency: byBase };
}