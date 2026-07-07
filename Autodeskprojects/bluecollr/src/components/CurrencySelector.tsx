'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { CurrencyMeta } from '@/types';
import { getActiveCurrencies, searchCurrencies, validCurrency } from '@/utils/currencyData';

export interface CurrencySelectorProps {
  value: string;
  onChange: (code: string) => void;
  allowCustomInput?: boolean;
  autoSelectPriority?: 'customer' | 'locale' | 'business';
  baseCurrency?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
  previewValue?: string;
}

const MIN_TOUCH_HEIGHT = 44;

export default function CurrencySelector({
  value,
  onChange,
  allowCustomInput = false,
  autoSelectPriority: _autoSelectPriority,
  baseCurrency: _baseCurrency,
  error,
  id = 'currency-selector',
  disabled = false,
  previewValue,
}: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customError, setCustomError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLSpanElement>(null);

  const activeCurrencies = useRef<CurrencyMeta[]>(getActiveCurrencies());

  const filteredResults = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        const all = [...activeCurrencies.current];
        return all;
      }
      const results = searchCurrencies(trimmed);
      const active = results.filter((c) => c.isActive);
      const inactive = results.filter((c) => !c.isActive);
      return [...active, ...inactive];
    },
    []
  );

  const [results, setResults] = useState<CurrencyMeta[]>(() => filteredResults(''));

  useEffect(() => {
    if (!isOpen && previewValue) {
      const meta = activeCurrencies.current.find((c) => c.code === previewValue);
      setInputValue(meta ? formatItem(meta) : previewValue);
    }
  }, [isOpen, previewValue]);

  useEffect(() => {
    setResults(filteredResults(query));
    setActiveIndex(-1);
  }, [query, filteredResults]);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector('[data-index="' + activeIndex + '"]') as HTMLElement | null;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, activeIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const text = e.target.value;
    setInputValue(text);
    setQuery(text);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => {
          const max = results.length - 1;
          return prev < max ? prev + 1 : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => {
          return prev > 0 ? prev - 1 : 0;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          selectCurrency(results[activeIndex].code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const selectCurrency = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setQuery('');
    setActiveIndex(-1);
    const meta = results.find((c) => c.code === code) ?? activeCurrencies.current.find((c) => c.code === code);
    const display = meta ? formatItem(meta) : code;
    setInputValue(display);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = meta
        ? `${code} — ${meta.name} (${meta.symbol || code})`
        : `${code} selected`;
    }
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };
  const handleCustomBlur = () => {
    if (!customCode.trim()) {
      setCustomError('');
      return;
    }
    const upper = customCode.trim().toUpperCase();
    if (validCurrency(upper)) {
      setCustomError('');
      selectCurrency(upper);
    } else {
      setCustomError('Invalid currency code');
    }
  };

  const formatItem = (currency: CurrencyMeta) => {
    return `${currency.code} — ${currency.name} (${currency.symbol || currency.code})`;
  };

  const listboxId = `${id}-listbox`;
  const errorId = error ? `${id}-error` : undefined;
  const customErrorId = customError ? `${id}-custom-error` : undefined;

  return (
    <div ref={containerRef} className="w-full">
      <label htmlFor={`${id}-input`} className="block text-base font-medium text-gray-700 mb-1">
        Currency
      </label>
      <span
        ref={liveRegionRef}
        id={`${id}-live`}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="relative">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          disabled={disabled}
          title="Search by currency name, code, or symbol (e.g. USD, Euro)"
          className={`w-full rounded-md border px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${error ? 'border-red-500' : 'border-gray-300'} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
          style={{ minHeight: MIN_TOUCH_HEIGHT }}
          placeholder="Search currency..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-invalid={!!error || undefined}
          aria-describedby={[errorId, customErrorId].filter(Boolean).join(' ') || undefined}
          aria-activedescendant={
            isOpen && activeIndex >= 0 && activeIndex < results.length
              ? `${id}-option-${activeIndex}`
              : undefined
          }
        />

        {isOpen && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
          >
            {results.length === 0 ? (
              <li
                role="option"
                aria-selected="false"
                className="px-3 py-2 text-gray-500"
                style={{ minHeight: MIN_TOUCH_HEIGHT }}
              >
                No currencies found
              </li>
            ) : (
              results.map((currency, index) => {
                const isActive = currency.isActive ?? true;
                const isSelected = value === currency.code;
                const isFocused = index === activeIndex;
                return (
                  <li
                    key={currency.code}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${currency.code} — ${currency.name} (${currency.symbol || currency.code})`}
                    tabIndex={-1}
                    className={`cursor-pointer px-3 py-2 ${isFocused ? 'bg-blue-50' : ''} ${isSelected ? 'font-semibold text-blue-600' : 'text-gray-900'}`}
                    style={{ minHeight: MIN_TOUCH_HEIGHT }}
                    onMouseMove={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCurrency(currency.code)}
                  >
                    <span className={isActive ? '' : 'text-gray-400'}>
                      {formatItem(currency)}
                      {!isActive && ' (inactive)'}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600"
          aria-live="assertive"
        >
          {error}
        </p>
      )}

      {allowCustomInput && (
        <div className="mt-2">
          <label htmlFor={`${id}-custom`} className="block text-sm font-medium text-gray-700">
            Or enter a 3-letter ISO code
          </label>
          <input
            id={`${id}-custom`}
            type="text"
            maxLength={3}
            className={`mt-1 w-24 rounded-md border px-3 py-2 text-base uppercase shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${customError ? 'border-red-500' : 'border-gray-300'}`}
            style={{ minHeight: MIN_TOUCH_HEIGHT }}
            placeholder="e.g. USD"
            value={customCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setCustomCode(val);
              if (validCurrency(val)) {
                setCustomError('');
              }
            }}
            onBlur={handleCustomBlur}
            autoComplete="off"
            aria-invalid={!!customError}
            aria-describedby={customErrorId}
          />
          {customError && (
            <p
              id={customErrorId}
              className="mt-1 text-sm text-red-600"
              aria-live="assertive"
            >
              {customError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
