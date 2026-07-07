'use client';
import { useEffect, useMemo, useRef } from 'react';
import type { CurrencyCode } from '@/types';
import { formatCurrency, getAllCurrencies, roundCurrency } from '@/utils/currency';

export interface CurrencyChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currencyFrom: CurrencyCode;
  currencyTo: CurrencyCode;
  currentAmounts: number[];
  convertedAmounts: (number | null)[];
  currentSubtotal: number;
  rate: number | null;
  rateError?: string | null;
  isLoadingRate?: boolean;
  isIssued?: boolean;
  onConvert: () => void;
  onReset: () => void;
}

function getCurrencyMeta(code: CurrencyCode) {
  return getAllCurrencies().find((c) => c.code === code);
}

export default function CurrencyChangeDialog({
  isOpen,
  onClose,
  currencyFrom,
  currencyTo,
  currentAmounts,
  convertedAmounts,
  currentSubtotal,
  rate,
  rateError,
  isLoadingRate,
  isIssued = false,
  onConvert,
  onReset,
}: CurrencyChangeDialogProps) {
  if (!isOpen) return null;

  const previousMeta = getCurrencyMeta(currencyFrom);
  const newMeta = getCurrencyMeta(currencyTo);
  const previousSymbol = previousMeta?.symbol ?? currencyFrom;
  const newSymbol = newMeta?.symbol ?? currencyTo;

  const convertedSubtotal = useMemo(() => {
    if (rate && rate > 0) {
      return roundCurrency(currentSubtotal * rate, currencyTo);
    }
    return null;
  }, [currentSubtotal, rate, currencyTo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector);
    const lastFocusable = dialog.querySelectorAll<HTMLElement>(focusableSelector);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!firstFocusable || lastFocusable.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable[lastFocusable.length - 1]?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable[lastFocusable.length - 1]) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    firstFocusable?.focus();

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-change-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close currency change dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 id="currency-change-dialog-title" className="text-xl font-bold text-gray-900">
          Change Currency?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Changing currency won&apos;t change amounts. Convert to reprices in the new currency, or Reset to go back.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <span className="text-sm text-gray-500">Current</span>
            <p className="text-base font-medium text-gray-900">{currencyFrom} ({previousSymbol})</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 flex-shrink-0"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <div className="flex-1">
            <span className="text-sm text-gray-500">New</span>
            <p className="text-base font-medium text-gray-900">{currencyTo} ({newSymbol})</p>
          </div>
        </div>

        <div className="mt-6 max-h-60 overflow-y-auto">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span className="flex-1 text-left">Item</span>
            <span className="w-24 text-right">Current</span>
            <span className="w-24 text-right">Converted</span>
          </div>
          {currentAmounts.map((amount, idx) => {
            const converted = convertedAmounts[idx];
            return (
              <div key={idx} className="flex justify-between text-base">
                <span className="flex-1 text-gray-700 truncate pr-2">Item {idx + 1}</span>
                <span className="w-24 text-right font-medium text-gray-900">{formatCurrency(amount, currencyFrom)}</span>
                <span className="w-24 text-right font-medium text-gray-900">
                  {converted !== null && converted !== undefined ? formatCurrency(converted, currencyTo) : '-'}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span className="flex-1 text-left">Subtotal</span>
            <span className="w-24 text-right">{formatCurrency(currentSubtotal, currencyFrom)}</span>
            <span className="w-24 text-right">
              {convertedSubtotal !== null ? formatCurrency(convertedSubtotal, currencyTo) : isLoadingRate ? 'Loading...' : '-'}
            </span>
          </div>
        </div>

        {rateError && !isLoadingRate && (
          <p className="mt-2 text-sm text-red-600">{rateError}</p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="h-10 w-full rounded border border-gray-300 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onReset}
            className="h-10 w-full rounded border border-gray-300 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
            type="button"
          >
            Reset to zero (clear all)
          </button>
          <button
            onClick={onConvert}
            disabled={isIssued || rate == null || !!rateError}
            className="h-10 w-full rounded bg-blue-600 px-4 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] sm:w-auto"
            type="button"
          >
            Convert (keep amounts)
          </button>
        </div>

        {isIssued ? (
          <p className="mt-3 text-sm text-red-600">
            Convert is not available for issued invoices. Reset to zero (clear all) to return to original currency.
          </p>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            Convert will reprices all line items in {currencyTo} at the current rate.
          </p>
        )}

        <p className="mt-3 text-center text-xs text-gray-400">
          Esc = cancel - Tab = move between controls
        </p>
      </div>
    </div>
  );
}
