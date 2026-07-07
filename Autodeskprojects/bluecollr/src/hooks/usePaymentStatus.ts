'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PaymentResult } from '@/types';

/**
 * Success banner auto-dismiss delay (ms).
 *
 * Set to 8 seconds so users have enough time to read the confirmation
 * after returning from a Stripe Checkout redirect, which can add
 * noticeable latency on slower connections.
 */
const SUCCESS_BANNER_DURATION_MS = 8000;

export function usePaymentStatus(onDismiss?: () => void): PaymentResult {
  const [result, setResult] = useState<PaymentResult>({ status: 'idle' });
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const reset = useCallback(() => setResult({ status: 'idle' }), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (sessionId) {
      setResult({ status: 'success', sessionId });
      params.delete('session_id');
      const qs = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${qs ? '?' + qs : ''}${window.location.hash}`
      );

      const timer = setTimeout(() => {
        setResult({ status: 'idle' });
        onDismissRef.current?.();
      }, SUCCESS_BANNER_DURATION_MS);

      return () => clearTimeout(timer);
    }

    if (canceled) {
      setResult({ status: 'canceled' });
      params.delete('canceled');
      const qs = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${qs ? '?' + qs : ''}${window.location.hash}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...result, reset };
}
