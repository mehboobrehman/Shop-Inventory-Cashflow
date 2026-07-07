import type { CurrencyCode, CurrencyMeta } from '@/types';
import { getAllCurrencies as dataGetAllCurrencies, validCurrency as dataValidCurrency } from './currencyData';

/** Record of all currencies keyed by ISO code (full dataset from currencyData). */
export const CURRENCIES: Record<string, CurrencyMeta> = Object.fromEntries(
  dataGetAllCurrencies().map((c) => [c.code, c])
);

/** Convert an amount from one currency to another using the given exchange rate. */
export function convertAmount(amount: number, _from: CurrencyCode, _to: CurrencyCode, rate: number): number {
  if (amount === 0 || rate === 1) return amount;
  return amount * rate;
}

/** Alias kept for callers that import the older name. */
export const convertCurrency = convertAmount;

/**
 * Round an amount using the currency's rounding rules (step + decimals).
 *
 * Edge cases:
 *  - roundCurrency(0, 'USD') => 0   (never NaN for valid input)
 *  - roundCurrency(-100, 'GBP') => -100  (sign is preserved)
 *  - roundCurrency(1234.56, 'JPY') => 1235  (0-decimal rounds to whole unit)
 */
export function roundCurrency(amount: number, currencyCode: CurrencyCode): number {
  const entry = getAllCurrencies().find((c) => c.code === currencyCode);
  const decimals = entry?.rounding?.decimals ?? entry?.decimalDigits ?? 2;
  const step = entry?.rounding?.step ?? 1;
  const factor = 10 ** decimals;

  if (step > 1) {
    return Math.round((amount * factor) / step) * step / factor;
  }
  return Math.round(amount * factor) / factor;
}

/**
 * Format an amount for the given currency using locale-aware Intl.NumberFormat.
 *
 * Verified edge-case behavior (Intl.NumberFormat):
 *  1. Zero values
 *       formatCurrency(0, 'USD') => '$0.00'
 *       Zero never produces an empty string or NaN.
 *
 *  2. Negative amounts
 *       formatCurrency(-100, 'GBP') => '-£100.00'
 *       Minus placement follows the locale's currency rules (e.g. '-$100.00' for en-US).
 *
 *  3. No-symbol / commodity currencies
 *       When the locale is invalid (e.g. pseudo-locale 'en-XAU' for commodities)
 *       or the currency has no known symbol, Intl.NumberFormat falls back to
 *       displaying the currency code (e.g. 'XAU 1,000.00'). The wrapper catches
 *       RangeError for invalid locales and falls back to 'en-US'.
 *
 *  4. Large numbers
 *       formatCurrency(1000000, 'USD') => '$1,000,000.00'
 *       Thousands separators are applied automatically per locale; no scientific
 *       notation is produced for normal invoice-scale amounts.
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  const entry = getAllCurrencies().find((c) => c.code === currencyCode);
  const locale = entry?.locale ?? 'en-US';
  const decimals = entry?.rounding?.decimals ?? entry?.decimalDigits ?? 2;
  const rounded = roundCurrency(amount, currencyCode);

  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  };

  try {
    return new Intl.NumberFormat(locale, opts).format(rounded);
  } catch {
    // Fallback for invalid pseudo-locales (e.g. commodity codes: en-XAU, en-XAG).
    // Intl.NumberFormat throws RangeError on unknown locales; en-US always works.
    return new Intl.NumberFormat('en-US', opts).format(rounded);
  }
}

/** Backward-compatible re-export of the full dataset. */
export function getAllCurrencies(): CurrencyMeta[] {
  return dataGetAllCurrencies();
}

/** Re-export rate lookup so callers can import computeRate / getRate from a single module. */
export { computeRate, getRate } from './exchangeRates'

/** Backward-compatible re-export. */
export function isValidCurrencyCode(code: string): boolean {
  return dataValidCurrency(code);
}
