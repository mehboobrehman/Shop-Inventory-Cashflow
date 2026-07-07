import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'bluecollr_draft';

export function loadDraft<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useAutoSave<T>(key: string, value: T) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, 300);

    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility, { passive: true });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [key, value]);

  return { status };
}
