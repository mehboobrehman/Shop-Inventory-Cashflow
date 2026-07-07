import type { RateMetadata, RateSource, RateProvider, RateCacheEntry } from '@/types';

// Defined here to avoid a circular import with currency.ts:
//   currency.ts  ->  export { getRate } from './exchangeRates'
//   exchangeRates.ts  ->  (used to) import { computeRate } from '@/utils/currency'
// Breaking the cycle by housing computeRate in exchangeRates.ts and re-exporting it.
export function computeRate(entry: RateCacheEntry, from: string, to: string): number {
  if (from === to) return 1;
  const fromRate = entry.rates[from];
  const toRate = entry.rates[to];
  if (!fromRate || !toRate) return 1;
  if (entry.base === from) return toRate;
  if (entry.base === to) return 1 / fromRate;
  return toRate / fromRate;
}

/**
 * Abstraction for exchange-rate data sources.
 *
 * How to substitute providers:
 * 1. Implement this interface in a new module (e.g. `FrankfurterRateProvider`).
 * 2. Pass your implementation as the third argument to `getRate(from, to, provider)`.
 * 3. Do **not** modify `getRate()` — it works against the interface only.
 *
 * Implementation requirements:
 * - `fetchRates(baseCurrency)` must reject on transport/parse errors (do not swallow failures).
 * - It must return rates relative to the requested `baseCurrency`.
 * - The returned object must include valid ISO 8601 `fetchedAt` and `expiresAt` fields.
 * - `name` should be unique and stable (used for cache keys and UI labelling).
 */

/**
 * Shape of the cached rate response stored in localStorage.
 *
 * A provider must return an object matching this shape so the cache
 * layer and `getRate()` can treat every provider identically.
 *
 * Required constraints:
 * - `rates` values are relative to `base` (i.e. `rates['USD']` means 1 base-currency unit = N USD).
 * - `base` must be the currency the rates are expressed relative to (ECB returns EUR).
 * - `expiresAt` is an ISO 8601 string; after this time the cache is stale and
 *   `getRate()` will call `provider.fetchRates()` again on the next request.
 * - `source` is a short string identifier used when surfacing the origin in the UI.
 */

/** Re-export of canonical definitions from `src/types.ts`. */

export type { RateProvider, RateCacheEntry } from '@/types';

const CACHE_KEY = 'bluecollr_exchange_rates_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

function parseEcbXml(text: string): Record<string, number> {
  const rates: Record<string, number> = { EUR: 1 };
  const regex = /<Cube[^>]*currency=['"]([A-Z]{3})['"][^>]*rate=['"]([\d.]+)['"][^>]*\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    rates[match[1]] = parseFloat(match[2]);
  }
  return rates;
}

export class ECBRateProvider implements RateProvider {
  name = 'ecb_daily';

  /**
   * Fetch ECB's daily EUR-anchored rate table and cross-convert when needed.
   *
   * ECB only publishes rates relative to EUR. The `baseCurrency` parameter is
   * never ignored — if the caller requests a non-EUR base, the fetched EUR
   * rates are converted in-library as `rate[target] = eurRate[target] / eurRate[base]`
   * so callers receive rates relative to their requested base currency.
   */
  async fetchRates(baseCurrency: string): Promise<RateCacheEntry> {
    const res = await fetch(ECB_URL);
    if (!res.ok) {
      throw new Error('ECB rate fetch failed: ' + res.status);
    }
    const text = await res.text();
    const eurRates = parseEcbXml(text);
    const base = baseCurrency.toUpperCase();

    let rates: Record<string, number>;
    if (base === 'EUR') {
      rates = eurRates;
    } else {
      if (!eurRates[base]) {
        throw new Error(
          `ECB does not provide rate for requested base currency: ${base}`
        );
      }
      const divisor = eurRates[base];
      rates = {};
      for (const [currency, rate] of Object.entries(eurRates)) {
        if (currency === base) continue;
        rates[currency] = rate / divisor;
      }
      rates[base] = 1;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    return {
      rates,
      base,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: 'ecb',
      provider: this.name,
    };
  }
}

/**
 * Open-source, CORS-friendly provider (no API key required).
 *
 * Frankfurter is a free API for current and historical exchange rates
 * published by the European Central Bank. It supports JSON output and
 * allows explicit base-currency requests.
 *
 * To activate: pass `new FrankfurterRateProvider()` into `getRate()`.
 */
export class FrankfurterRateProvider implements RateProvider {
  name = 'frankfurter';

  private baseUrl = 'https://api.frankfurter.dev/v1';

  async fetchRates(baseCurrency: string): Promise<RateCacheEntry> {
    const base = baseCurrency.toUpperCase();
    const res = await fetch(`${this.baseUrl}/latest?from=${encodeURIComponent(base)}`);
    if (!res.ok) {
      throw new Error(`Frankfurter rate fetch failed: ${res.status}`);
    }
    const json = await res.json();
    const rates: Record<string, number> = { [base]: 1, ...(json.rates ?? {}) };

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

    return {
      rates,
      base,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: 'frankfurter',
      provider: this.name,
    };
  }
}

/**
 * Example stub for a commercial provider that requires an API key.
 *
 * To activate:
 * 1. Set the environment variable (e.g. `OPENEXCHANGERATES_API_KEY`).
 * 2. Replace `new ECBRateProvider()` in your `getRate()` call with
 *    `new OpenExchangeRatesProvider()`.
 *
 * The provider must still satisfy the `RateProvider` interface — `getRate()`
 * does not need any changes.
 */
// export class OpenExchangeRatesProvider implements RateProvider {
//   name = 'openexchangerates';
//   private apiKey = process.env.NEXT_PUBLIC_OPENEXCHANGERATES_API_KEY;
//
//   async fetchRates(baseCurrency: string): Promise<RateCacheEntry> {
//     if (!this.apiKey) {
//       throw new Error('Missing OPENEXCHANGERATES_API_KEY');
//     }
//     const res = await fetch(
//       `https://openexchangerates.org/api/latest.json?app_id=${this.apiKey}&base=${encodeURIComponent(baseCurrency)}`
//     );
//     if (!res.ok) {
//       throw new Error('OpenExchangeRates fetch failed: ' + res.status);
//     }
//     const json = await res.json();
//     const rates: Record<string, number> = { [baseCurrency.toUpperCase()]: 1, ...(json.rates ?? {}) };
//
//     const now = new Date();
//     const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
//
//     return {
//       rates,
//       base: baseCurrency.toUpperCase(),
//       fetchedAt: now.toISOString(),
//       expiresAt: expiresAt.toISOString(),
//       source: 'openexchangerates',
//       provider: this.name,
//     };
//   }
// }

function getCachedRates(): RateCacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateCacheEntry;
    if (!parsed.rates || !parsed.base || !parsed.expiresAt) return null;
    const expiresAt = new Date(parsed.expiresAt);
    if (expiresAt.getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCachedRates(entry: RateCacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // silently fail if localStorage is full or unavailable
  }
}

export async function getRate(
  from: string,
  to: string,
  provider: RateProvider = new ECBRateProvider()
): Promise<RateMetadata> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  if (fromCode === toCode) {
    return {
      source: 'manual',
      rate: 1,
      baseCurrency: fromCode,
      targetCurrency: toCode,
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      provider: 'ecb_fallback',
    };
  }

  const cached = getCachedRates();

  if (cached) {
    const rate = computeRate(cached, fromCode, toCode);

    return {
      source: cached.source as RateSource,
      rate,
      baseCurrency: fromCode,
      targetCurrency: toCode,
      fetchedAt: cached.fetchedAt,
      expiresAt: cached.expiresAt,
      provider: cached.provider ?? 'ecb_daily',
    };
  }

  const fresh = await provider.fetchRates(fromCode);
  setCachedRates(fresh);

  const rate = computeRate(fresh, fromCode, toCode);

  return {
    source: fresh.source as RateSource,
    rate,
    baseCurrency: fromCode,
    targetCurrency: toCode,
    fetchedAt: fresh.fetchedAt,
    expiresAt: fresh.expiresAt,
    provider: provider.name,
  };
}
