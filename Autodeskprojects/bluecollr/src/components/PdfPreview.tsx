"use client";

import { Estimate, BusinessSettings, InvoiceCurrencyInfo } from "@/types";
import { formatCurrency, roundCurrency } from "@/utils/currency";

interface PdfPreviewProps {
  estimate: Estimate;
  businessSettings?: BusinessSettings;
  frozenSnapshot?: InvoiceCurrencyInfo | null;
}

export default function PdfPreview({ estimate, businessSettings, frozenSnapshot }: PdfPreviewProps) {
  const subtotal = estimate.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );

  const showBaseCurrency = Boolean(businessSettings?.showBaseCurrencyEquivalent);
  const baseCurrencyCode = businessSettings?.baseCurrency ?? estimate.currency;

  const isFrozen = Boolean(frozenSnapshot);

  const colSpan = showBaseCurrency ? 5 : 4;

  const subtotalVal = frozenSnapshot
    ? frozenSnapshot.amounts.subtotal.convertedAmount
    : (estimate.invoiceCurrencyInfo?.amounts.subtotal?.convertedAmount ?? subtotal);
  const rawTax = frozenSnapshot
    ? frozenSnapshot.amounts.tax.convertedAmount
    : (estimate.invoiceCurrencyInfo?.amounts.tax?.convertedAmount ?? subtotal * (estimate.taxRate / 100));
  const tax = isFrozen ? rawTax : roundCurrency(rawTax, estimate.currency);
  const depositVal = frozenSnapshot
    ? frozenSnapshot.amounts.deposit.convertedAmount
    : (estimate.invoiceCurrencyInfo?.amounts.deposit?.convertedAmount ?? estimate.deposit);
  const total = frozenSnapshot
    ? frozenSnapshot.amounts.total.convertedAmount
    : subtotalVal + tax - depositVal;

  const baseTotal = frozenSnapshot
    ? frozenSnapshot.amounts.total.baseAmount
    : (estimate.invoiceCurrencyInfo?.amounts.total?.baseAmount ?? total);

  const appliedRate = (frozenSnapshot?.rate ?? estimate.invoiceCurrencyInfo?.rate) ?? null;

  return (
    <div className="w-full overflow-x-auto">
      <div
        id="pdf-preview"
        className="bg-white text-gray-900 shadow-sm text-base"
        style={{ width: "210mm", minHeight: "297mm", fontSize: "13px", lineHeight: "1.6" }}
        suppressHydrationWarning
      >
        {frozenSnapshot && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-1.5 text-center text-sm font-semibold text-amber-900">
            Issued — values are locked
          </div>
        )}
        {/* ── Branded Header ─────────────────────────────────██ */}
        <div className="border-b-2 border-gray-800 pb-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            {/* Left: logo + company name */}
            <div className="flex items-center gap-4">
              {estimate.company.logoDataUrl ? (
                <img
                  src={estimate.company.logoDataUrl}
                  alt="Company logo"
                  className="h-20 w-auto object-contain"
                />
              ) : (
                <div
                  className="h-20 w-32 flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 text-sm"
                >
                  (no logo uploaded)
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {estimate.company.name || "Your Company"}
                </h1>
                {estimate.company.phone && (
                  <p className="mt-0.5 text-sm text-gray-600">{estimate.company.phone}</p>
                )}
                {estimate.company.email && (
                  <p className="text-sm text-gray-600">{estimate.company.email}</p>
                )}
              </div>
            </div>
            {/* Right: document label + date */}
            <div className="text-right pt-1">
              <h2 className="text-lg font-bold tracking-widest uppercase text-gray-800">
                Estimate
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Bill To ──────────────────────────────────────────── */}
        <div className="mb-6 text-sm">
          <h3 className="font-semibold text-gray-400 uppercase tracking-wide text-xs mb-1">
            Bill To
          </h3>
          <p className="font-semibold text-gray-900">
            {estimate.client.name || "Client"}
          </p>
          {estimate.client.address && (
            <p className="text-gray-600">{estimate.client.address}</p>
          )}
          <div className="text-gray-600">
            {estimate.client.phone && <span>{estimate.client.phone}</span>}
            {estimate.client.phone && estimate.client.email && <span> · </span>}
            {estimate.client.email && <span>{estimate.client.email}</span>}
          </div>
        </div>

        {/* ── Line Items Table ─────────────────────────────────── */}
        <table className="w-full mb-6 border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left py-2 px-3 font-semibold" style={{ width: showBaseCurrency ? "35%" : "55%" }}>
                Description
              </th>
              {showBaseCurrency && (
                <th className="text-right py-2 px-3 font-semibold" style={{ width: "18%" }}>
                  Base ({baseCurrencyCode})
                </th>
              )}
              <th className="text-right py-2 px-3 font-semibold" style={{ width: "10%" }}>Qty</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ width: showBaseCurrency ? "12%" : "15%" }}>Rate</th>
              <th className="text-right py-2 px-3 font-semibold" style={{ width: showBaseCurrency ? "25%" : "20%" }}>
                Line Total
              </th>
            </tr>
          </thead>
          <tbody>
            {estimate.lineItems.map((item, idx) => {
              const baseAmount = frozenSnapshot
                ? frozenSnapshot.amounts.lineItems[idx]?.baseAmount ?? item.quantity * item.rate
                : (estimate.invoiceCurrencyInfo?.amounts?.lineItems?.[idx]?.baseAmount ?? item.quantity * item.rate);
              const convertedAmount = frozenSnapshot
                ? frozenSnapshot.amounts.lineItems[idx]?.convertedAmount ?? item.quantity * item.rate
                : (estimate.invoiceCurrencyInfo?.amounts?.lineItems?.[idx]?.convertedAmount ?? item.quantity * item.rate);
              return (
                <tr
                  key={item.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-2.5 px-3 border-b border-gray-200 text-gray-800">
                    {item.description || "—"}
                  </td>
                  {showBaseCurrency && (
                    <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800 tabular-nums">
                      {formatCurrency(baseAmount, baseCurrencyCode)}
                    </td>
                  )}
                  <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="text-right py-2.5 px-3 border-b border-gray-200 text-gray-800">
                    {formatCurrency(item.rate, estimate.currency)}
                  </td>
                  <td className="text-right py-2.5 px-3 border-b border-gray-200 font-medium text-gray-900">
                    {formatCurrency(convertedAmount, estimate.currency)}
                  </td>
                </tr>
              );
            })}
            {estimate.lineItems.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="text-center py-5 italic text-gray-500 border-b border-gray-200"
                >
                  No line items — add services or materials above.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Notes ─────────────────────────────────────────────── */}
        {estimate.notes && (
          <div className="mb-6 text-sm">
            <h3 className="font-semibold text-gray-400 uppercase tracking-wide text-xs mb-1">
              Notes
            </h3>
            <p className="whitespace-pre-wrap text-gray-700">{estimate.notes}</p>
          </div>
        )}

        {/* ── Totals ───────────────────────────────────────────── */}
        <div className="flex justify-end mb-6">
          <div className="w-60 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-gray-500 uppercase text-xs tracking-wide">
                Subtotal
              </span>
              <span className="font-medium tabular-nums">{formatCurrency(subtotal, estimate.currency)}</span>
            </div>
            {estimate.taxRate > 0 && (
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-gray-500 uppercase text-xs tracking-wide">
                  Tax ({estimate.taxRate}%)
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(tax, estimate.currency)}</span>
              </div>
            )}
            {estimate.deposit > 0 && (
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="text-gray-500 uppercase text-xs tracking-wide">
                  Deposit
                </span>
                <span className="font-medium tabular-nums">-{formatCurrency(estimate.deposit, estimate.currency)}</span>
              </div>
            )}
            {total < 0 && (
              <div className="bg-yellow-50 border border-yellow-200 px-3 py-1.5 mb-1 text-xs text-yellow-800 rounded-sm">
                Note: deposit exceeds subtotal + tax — this invoice shows a credit. Review amounts before sending.
              </div>
            )}
            <div className="flex justify-between py-2 font-bold text-base border-t-2 border-gray-800 mt-1">
              <span className="uppercase tracking-wide">Total Due</span>
              <span className="tabular-nums">{formatCurrency(total, estimate.currency)}</span>
            </div>
            {showBaseCurrency && (
              <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                <span className="text-gray-500 uppercase text-xs tracking-wide">
                  Total Due ({baseCurrencyCode})
                </span>
                <span className="tabular-nums">{formatCurrency(baseTotal, baseCurrencyCode)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Rate Metadata Footer ─────────────────────────────── */}
        {appliedRate && (
          <div className="border-t border-gray-300 pt-3 text-xs text-gray-500 text-center mb-4">
            <p className="font-medium">
              Exchange rate: 1 {appliedRate.baseCurrency} = {String(appliedRate.rate)} {appliedRate.targetCurrency}
              {appliedRate.fetchedAt && (
                <span className="text-gray-400 ml-1">
                  · Date: {new Date(appliedRate.fetchedAt).toLocaleDateString()}
                </span>
              )}
            </p>
            <p className="text-gray-400 mt-0.5">
              Source: {appliedRate.source}
              {appliedRate.expiresAt && (
                <span> · Expires {new Date(appliedRate.expiresAt).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="border-t border-gray-300 pt-4 text-xs text-gray-400 text-center">
          <p>Thank you for your business. Payment is due upon receipt.</p>
          {estimate.company.name && (
            <p className="mt-0.5">{estimate.company.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
