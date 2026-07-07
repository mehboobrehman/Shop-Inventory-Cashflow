'use client';

import type { RateMetadata } from '@/types';
import { getAllCurrencies } from '@/utils/currency';

export interface RateDisplayProps {
  rate: RateMetadata | null | 'loading' | 'error';
  onRequestManualOverride: () => void;
  onRetry: () => void;
}

export default function RateDisplay({
  rate,
  onRequestManualOverride,
  onRetry,
}: RateDisplayProps) {
  if (rate === 'loading') {
    return (
      <div
        aria-live='polite'
        className='rounded-md border border-gray-200 bg-white p-4'
      >
        <span className='sr-only'>Loading exchange rates...</span>
        <div className='h-4 w-64 animate-pulse rounded bg-gray-200' />
        <div className='mt-2 h-3 w-48 animate-pulse rounded bg-gray-200' />
      </div>
    );
  }

  if (rate === 'error') {
    return (
      <div
        aria-live='assertive'
        className='rounded-md border border-red-200 bg-red-50 p-4'
      >
        <p className='text-base text-red-900'>Rates are temporarily unavailable. You can enter a rate manually to continue.</p>
        <div className='mt-3 flex flex-col sm:flex-row gap-2'>
          <button
            type='button'
            onClick={onRetry}
            className='h-10 rounded bg-blue-600 px-4 text-base font-semibold text-white hover:bg-blue-700 active:scale-[0.98]'
          >
            Try again
          </button>
          <button
            type='button'
            onClick={onRequestManualOverride}
            className='h-10 rounded border border-gray-300 bg-white px-4 text-base font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
          >
            Enter rate manually
          </button>
        </div>
      </div>
    );
  }

  if (rate === null) {
    return null;
  }

  const formatUpdatedDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(new Date(iso));
  };

  const sourceLabel = {
    ecb: 'ECB',
    openexchangerates: 'OpenExchangeRates',
    frankfurter: 'Frankfurter',
    manual: 'Manual',
  } as const;

  const sourceName = sourceLabel[rate.source] ?? rate.source;

  const decimals =
    getAllCurrencies().find((c) => c.code === rate.targetCurrency)
      ?.decimalDigits ?? 2;

  return (
    <div
      aria-live='polite'
      className='rounded-md border border-gray-200 bg-white p-4'
    >
      <p className='text-base font-medium text-gray-900'>
        Source: {sourceName} · Updated: {formatUpdatedDate(rate.fetchedAt)} · 1{' '}
        {rate.baseCurrency} = {rate.rate.toFixed(decimals)} {rate.targetCurrency}
      </p>
      <div className='mt-3'>
        <button
          type='button'
          onClick={onRequestManualOverride}
          className='h-9 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]'
        >
          Override rate
        </button>
      </div>
    </div>
  );
}
