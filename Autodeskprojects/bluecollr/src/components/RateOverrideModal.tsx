'use client';

import { useState, useRef, useCallback, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import type { CurrencyCode } from '@/types';

export interface RateOverrideModalProps {
  isOpen: boolean;
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  fetchError?: string | null;
  onClose: () => void;
  onSubmit: (rate: number, note: string) => void;
}

export interface RateOverrideModalHandle {
  focusRateInput: () => void;
}

const RateOverrideModal = forwardRef<RateOverrideModalHandle, RateOverrideModalProps>(
  ({ isOpen, baseCurrency, targetCurrency, fetchError, onClose, onSubmit }, ref) => {
    const [rate, setRate] = useState('');
    const [note, setNote] = useState('');
    const [rateError, setRateError] = useState('');
    const [noteError, setNoteError] = useState('');

    const dialogRef = useRef<HTMLDivElement>(null);
    const rateInputRef = useRef<HTMLInputElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);

    useLayoutEffect(() => {
      onCloseRef.current = onClose;
    }, [onClose]);

    useImperativeHandle(ref, () => ({
      focusRateInput: () => {
        rateInputRef.current?.focus();
      },
    }));

    useLayoutEffect(() => {
      if (!isOpen) return;

      setRate('');
      setNote('');
      setRateError('');
      setNoteError('');
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      rateInputRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          previouslyFocusedRef.current?.focus();
          onCloseRef.current();
          return;
        }

        if (e.key === 'Tab') {
          const dialog = dialogRef.current;
          if (!dialog) return;

          const focusable = dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || document.activeElement === dialog) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    const handleSubmit = useCallback(() => {
      const parsedRate = parseFloat(rate);
      let hasError = false;

      if (!rate || isNaN(parsedRate) || parsedRate <= 0) {
        setRateError('Rate must be greater than zero');
        hasError = true;
      } else {
        setRateError('');
      }

      if (note.trim().length < 10) {
        setNoteError('Please provide a reason for using a manual rate (minimum 10 characters)');
        hasError = true;
      } else {
        setNoteError('');
      }

      if (hasError) return;

      onSubmit(parsedRate, note.trim());
      previouslyFocusedRef.current?.focus();
      onCloseRef.current();
    }, [rate, note, onSubmit, onClose]);

    const handleClose = useCallback(() => {
      previouslyFocusedRef.current?.focus();
      onCloseRef.current();
    }, [onClose]);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-label="Override exchange rate"
        aria-modal="true"
        aria-labelledby="rate-override-title"
        aria-describedby="manual-rate-dialog-desc"
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
          aria-hidden="true"
        />
        <div
          ref={dialogRef}
          className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 id="rate-override-title" className="text-lg font-bold text-gray-900">
              Override exchange rate
            </h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              type="button"
              className="rounded-md p-1 text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
          </div>
          <p id="manual-rate-dialog-desc" className="text-sm text-gray-500">
            Enter the current exchange rate manually and provide a reason for the override.
          </p>
          {fetchError && (
            <p className="mt-2 text-sm text-red-600" role="status" aria-live="assertive">
              {fetchError}
            </p>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="manual-rate" className="block text-base font-medium text-gray-700">
                1 {baseCurrency} = [enter rate] {targetCurrency}
              </label>
              <p id="rate-helper" className="mt-1 text-sm text-gray-500">
                Enter the exchange rate value.
              </p>
              <input
                ref={rateInputRef}
                id="manual-rate"
                type="number"
                step="0.0001"
                min="0"
                required
                placeholder="Enter rate (e.g. 1.2345)"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  if (rateError) setRateError('');
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={!!rateError}
                aria-describedby="rate-helper"
                aria-errormessage={rateError ? 'rate-error' : undefined}
              />
              {rateError && (
                <p id="rate-error" className="mt-1 text-sm text-red-600" role="alert">
                  {rateError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="audit-note" className="block text-base font-medium text-gray-700">
                Reason for manual rate override
              </label>
              <p id="audit-note-helper" className="mt-1 text-sm text-gray-500">
                Required for audit trail.
              </p>
              <textarea
                id="audit-note"
                rows={3}
                required
                aria-required="true"
                minLength={10}
                placeholder="e.g. Negotiated Q3 rate"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteError) setNoteError('');
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-invalid={!!noteError}
                aria-describedby="audit-note-helper"
                aria-errormessage={noteError ? 'note-error' : undefined}
              />
              {noteError && (
                <p id="note-error" className="mt-1 text-sm text-red-600" role="alert">
                  {noteError}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                onClick={handleClose}
                type="button"
                className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                type="button"
                className="w-full sm:w-auto rounded-md bg-blue-600 px-4 py-2 text-base font-semibold text-white hover:bg-blue-700 active:scale-[0.98]"
              >
                Apply Rate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RateOverrideModal.displayName = 'RateOverrideModal';

export default RateOverrideModal;
