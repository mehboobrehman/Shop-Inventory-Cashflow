# Currency Provider Substitution Procedure

This document explains how to replace the default exchange-rate provider (ECB) with an alternative without changing any consumer code.

---

## 1. Where to place a new provider module

Add a new class in an existing or new module under `src/utils/`.

- **Recommended location:** `src/utils/exchangeRates.ts` (add alongside `ECBRateProvider` and `FrankfurterRateProvider`).
- **Alternative location:** A dedicated file such as `src/utils/openExchangeRatesProvider.ts` if the implementation is large.

The provider must implement the `RateProvider` interface exported from `src/utils/exchangeRates.ts`.

---

## 2. The `RateProvider` contract

```typescript
export interface RateProvider {
  name: string;
  fetchRates(baseCurrency: string): Promise<RateCacheEntry>;
}
```

### Requirements

| Requirement | Detail |
|-------------|--------|
| `name` | Stable, unique identifier. Used for UI labelling and cache discrimination. |
| `baseCurrency` | The currency the returned rates are expressed relative to. |
| Return values | Must match the `RateCacheEntry` shape exactly (see below). |
| Errors | Must **reject** on transport or parse errors. Do not swallow failures or return 1:1 fallbacks silently. |
| Caller changes | None. `getRate()` calls the provider but does not need to be modified. |

---

## 3. `RateCacheEntry` shape

```typescript
export interface RateCacheEntry {
  rates: Record<string, number>;  // targetCurrency -> rate (relative to base)
  base: string;                   // base currency code (e.g. 'EUR', 'USD')
  fetchedAt: string;              // ISO 8601 timestamp
  expiresAt: string;              // ISO 8601 timestamp (cache TTL boundary)
  source: string;                 // UI-facing source label (e.g. 'ecb', 'frankfurter')
  provider?: string;              // optional provider identifier
}
```

### Invariants to preserve

- **Rates are relative to `base`**: `rates['USD']` means 1 unit of `base` = `rates['USD']` units of USD.
- **`base` consistency**: If the API returns rates relative to EUR, set `base: 'EUR'`.
- **`expiresAt` convention**: `getRate()` treats the cache as stale when `new Date(expiresAt) <= Date.now()`. Typical TTL is 24 hours.
- **`fetchedAt` convention**: Set to the time the fetch completed. Consumers display this in the UI.
- **No missing currencies**: If the API does not include the base currency in the response, inject it manually: `{ [base]: 1, ...response.rates }`.

---

## 4. Caching semantics

| Aspect | Behavior |
|--------|----------|
| **Cache key** | `bluecollr_exchange_rates_v2` (localStorage) |
| **TTL** | 24 hours (`CACHE_TTL_MS`) |
| **Stale policy** | On cache miss or expiry, `getRate()` calls `provider.fetchRates('EUR')` and updates the cache. |
| **Concurrency** | Multiple in-flight requests may race; the last write wins in localStorage. `getRate()` does not deduplicate requests. |
| **Loading state** | Up to the caller (e.g. `EstimateClient.tsx` manages `isEcbrLoading` / `RateDisplay`). |

**Important:** Switching providers does **not** invalidate the existing cache automatically. If you change the provider, clear the cache or wait for expiry:

```typescript
localStorage.removeItem('bluecollr_exchange_rates_v2');
```

---

## 5. Error contract

- `fetchRates()` must reject (`throw`) on network failure, non-2xx HTTP status, or malformed payload.
- `getRate()` propagates the rejection to the caller.
- **Caller responsibility:** Catch the rejection, surface a plain-language message (e.g. "Rates temporarily unavailable"), and offer a manual-rate fallback.

---

## 6. How to wire a new provider

No wiring is required inside `exchangeRates.ts`. The default provider is injected at the call site:

```typescript
// Existing call (default ECB):
const rate = await getRate('USD', 'EUR');

// Switch to Frankfurter:
const rate = await getRate('USD', 'EUR', new FrankfurterRateProvider());

// Switch to a hypothetical paid provider:
const rate = await getRate('USD', 'EUR', new PaidRateProvider(apiKey));
```

---

## 7. Environment / config keys

If your provider requires an API key:

1. Use a `NEXT_PUBLIC_` prefixed environment variable for client-side access.
2. Store it in `.env.local` (do **not** commit secrets to version control).
3. Access it inside the provider class:

```typescript
private apiKey = process.env.NEXT_PUBLIC_OPENEXCHANGERATES_API_KEY;
```

---

## 8. Available implementations

| Provider | Class | Key required | CORS | Notes |
|----------|-------|-------------|------|-------|
| ECB (default) | `ECBRateProvider` | No | Yes | XML feed; always returns rates relative to EUR. |
| Frankfurter | `FrankfurterRateProvider` | No | Yes | JSON API; supports explicit `from` base currency. |
| OpenExchangeRates (stub) | `OpenExchangeRatesProvider` | Yes | Depends | Commented-out stub in `exchangeRates.ts`. Uncomment to activate. |

---

## 9. Checklist for provider substitution

- [ ] New provider class implements `RateProvider`.
- [ ] `fetchRates()` returns a fully populated `RateCacheEntry`.
- [ ] Rates are relative to the declared `base`.
- [ ] `fetchedAt` and `expiresAt` are ISO 8601 strings.
- [ ] Errors are thrown, not swallowed.
- [ ] Caller code (e.g. `EstimateClient.tsx`) does not need changes.
- [ ] Cache is cleared if a provider swap requires fresh data.

---

## 10. Related files

| File | Role |
|------|------|
| `src/utils/exchangeRates.ts` | `RateProvider` interface, `getRate()`, all provider implementations. |
| `src/utils/currency.ts` | Re-exports `getRate` for consumer convenience. |
| `src/app/estimate/EstimateClient.tsx` | Primary consumer; passes provider via `getRate()`. |
| `src/components/RateDisplay.tsx` | Displays rate source, fetched date, and applied rate. |
