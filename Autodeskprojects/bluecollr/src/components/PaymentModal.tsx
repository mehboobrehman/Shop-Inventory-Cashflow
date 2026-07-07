'use client';

import { useState, useEffect } from 'react';
import type { CurrencyCode } from '@/types';
import { formatCurrency } from '@/utils/currency';

const BUSINESS_SETTINGS_KEY = 'bluecollr_business_settings';

function loadBaseCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  try {
    const raw = localStorage.getItem(BUSINESS_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { baseCurrency?: string };
      const bc = parsed.baseCurrency;
      if (bc === 'USD' || bc === 'GBP' || bc === 'CAD' || bc === 'AUD' || bc === 'EUR') {
        return bc;
      }
    }
  } catch {
    // ignore parse errors
  }
  return 'USD';
}

const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/test_XXXXX';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledEmail?: string;
  currency?: CurrencyCode;
}

export default function PaymentModal({ isOpen, onClose, prefilledEmail, currency: currencyProp }: PaymentModalProps) {
  const [redirecting, setRedirecting] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(currencyProp ?? loadBaseCurrency());

  useEffect(() => {
    setCurrency(currencyProp ?? loadBaseCurrency());
  }, [currencyProp]);

  if (!isOpen) return null;

  const handlePay = () => {
    setRedirecting(true);
    const url = new URL(STRIPE_PAYMENT_URL);
    if (prefilledEmail) {
      url.searchParams.set('prefilled_email', prefilledEmail);
    }
    url.searchParams.set('currency', currency);
    window.location.href = url.toString();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close payment modal"
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

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 id="payment-modal-title" className="text-xl font-bold text-gray-900">
            Unlock Professional Estimates
          </h2>
          <p className="mt-2 text-gray-600">
            Get lifetime access to BlueCollr for a single payment.
          </p>

          <div className="mt-4 inline-flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{formatCurrency(49, currency)}</span>
            <span className="text-base text-gray-500">one-time</span>
          </div>

          <ul className="mt-4 space-y-2 text-left text-base text-gray-700">
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Unlimited PDF estimates
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Branded estimates with your logo
            </li>
            <li className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Lifetime access — no subscription
            </li>
          </ul>

          <button
            onClick={handlePay}
            disabled={redirecting}
            className="mt-6 h-12 w-full rounded-lg bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]"
            type="button"
          >
            {redirecting ? 'Redirecting to Stripe…' : `Pay with Stripe — ${formatCurrency(49, currency)}`}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
