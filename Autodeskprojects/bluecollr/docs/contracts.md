# Shared Interfaces & Contracts

> **Version:** 1.0 — **Effective:** 2026-07-05
> Canonical reference for frontend and backend agents. Any new type, API shape, or storage contract must be reflected here before implementation.

---

## 1. Core Type Definitions

All shared types live in `src/types.ts`. Do not re-declare these types elsewhere — import them.

### 1.1 `Company`

Represents the contractor's business on every estimate.

```typescript
interface Company {
  name: string;
  phone: string;
  email: string;
  logoDataUrl?: string; // base64 data URL, max ~500 KB
}
```

### 1.2 `Client`

Represents the customer receiving the estimate.

```typescript
interface Client {
  name: string;
  address: string;
  phone: string;
  email: string;
}
```

### 1.3 `LineItem`

One row on the estimate/invoice.

```typescript
interface LineItem {
  id: string;            // UUID; set by crypto.randomUUID() at creation
  description: string;
  quantity: number;
  rate: number;
  baseAmount: number;    // line total in display currency (qty × rate); computed client-side
}
```

### 1.4 `Currency` / `CurrencyCode`

```typescript
// Union of the 5 MVP currencies. Use for UI allowlists and early checkouts.
type Currency = 'USD' | 'GBP' | 'CAD' | 'AUD' | 'EUR';

// Full ISO 4217 code stored as plain string. Use for runtime values;
// validate with isValidCurrencyCode() from currencyData.ts.
type CurrencyCode = string;
```

**Rule:** Parameters and state that must accept any of the 170 active currencies use `CurrencyCode`. UI dropdowns with a fixed MVP list may use `Currency`.

### 1.5 `PaymentStatus` / `PaymentResult`

```typescript
type PaymentStatus = 'idle' | 'success' | 'canceled';

interface PaymentResult {
  status: PaymentStatus;
  sessionId?: string;   // Stripe Checkout session ID on success
}
```

### 1.6 `RateSource` / `RateMetadata`

```typescript
type RateSource = 'ecb' | 'openexchangerates' | 'frankfurter' | 'manual';

interface RateMetadata {
  source: RateSource;
  rate: number;            // 1 baseCurrency unit = N targetCurrency units
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  fetchedAt: string | null;   // ISO 8601; null for manual entry
  expiresAt: string | null;   // ISO 8601; null for manual entry
  provider?: string;
  manualNote?: string;
}
```

### 1.7 `CurrencyRoundRule` / `CurrencyMeta`

```typescript
interface CurrencyRoundRule {
  decimals: number;
  step: number;            // 1 = normal rounding; 5 = round to nearest 5 units (CHF)
}

interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;          // BCP 47 locale for Intl.NumberFormat
  decimalDigits: number;
  rounding?: CurrencyRoundRule;
  isActive?: boolean;
}
```

The full 170-currency dataset is in `src/utils/currencyData.ts`. Call `getAllCurrencies()` to retrieve; `getActiveCurrencies()` to filter `isActive === true`.

### 1.8 `BusinessSettings`

```typescript
interface BusinessSettings {
  baseCurrency: CurrencyCode;
  showBaseCurrencyEquivalent: boolean;
  defaultTaxRate: number;
  perCurrencyTaxRate: boolean;
  perCurrencyTaxRates: Record<CurrencyCode, number>;
}
```

Default (fallback when API is unavailable or unauthenticated):

```typescript
const DEFAULT_SETTINGS: BusinessSettings = {
  baseCurrency: 'USD',
  showBaseCurrencyEquivalent: false,
  defaultTaxRate: 0,
  perCurrencyTaxRate: false,
  perCurrencyTaxRates: {},
};
```

### 1.9 `InvoiceCurrencyInfo` / `LineItemBaseAmount`

Used when an estimate is issued or when currency changes mid-edit.

```typescript
interface LineItemBaseAmount {
  baseAmount: number;          // value in business base currency at the captured rate
  convertedAmount: number;     // value in invoice currency after conversion rounding
}

interface InvoiceCurrencyInfo {
  currency: CurrencyCode;
  rate: RateMetadata | null;
  amounts: {
    lineItems: LineItemBaseAmount[];
    subtotal: LineItemBaseAmount;
    tax: LineItemBaseAmount;
    deposit: LineItemBaseAmount;
    total: LineItemBaseAmount;
  };
}
```

**Immutability contract:** Once an invoice is issued, `InvoiceCurrencyInfo` must not change. All amounts are frozen at the time of issuance; any subsequent rate changes do not affect the stored record.

### 1.10 `Estimate`

The canonical form state and persisted draft shape.

```typescript
interface Estimate {
  company: Company;
  client: Client;
  lineItems: LineItem[];
  notes: string;
  taxRate: number;             // percentage (e.g. 8.5 = 8.5%); divide by 100 for calculation
  deposit: number;             // flat amount in display currency
  currency: CurrencyCode;
  invoiceCurrencyInfo: InvoiceCurrencyInfo | null;
  isIssued: boolean;
  issuedAt?: string;           // ISO 8601 timestamp; present only when isIssued === true
}
```

**Computed fields (not stored)** — callers must derive these on read:

| Field | Formula |
|-------|---------|
| `subtotal` | `Σ(lineItem.quantity × lineItem.rate)` |
| `taxAmount` | `subtotal × taxRate / 100` |
| `total` | `subtotal + taxAmount − deposit` |

Derivation lives in `computeTotals(estimate: Estimate): EstimateTotals` in `src/utils/analytics.ts`.

### 1.11 Analytics Types

Defined in `src/utils/analytics.ts`:

```typescript
interface EstimateTotals {
  subtotal: number;
  taxAmount: number;
  deposit: number;
  total: number;
  currency: string;               // ISO 4217 code
}

interface BaseCurrencyTotals extends EstimateTotals {
  originalCurrency: string;
}

interface DashboardKPIs {
  totalRevenue: number;
  totalIssued: number;
  totalDraft: number;
  averageTicket: number;
}

interface DualCurrencyResult {
  byInvoiceCurrency: Map<string, { count: number; total: number }>;
  byBaseCurrency: Map<string, { count: number; total: number }>;
}

interface FilterOptions {
  status: 'all' | 'draft' | 'issued';
  dateRange?: DateRangeFilter;
  client?: string;
}

> **Note:** `DateRangeFilter` is defined in `src/utils/analytics.ts:4` and is the canonical source for this shape.
```

---

## 2. Exchange Rate Contracts

### 2.1 `RateProvider` interface

Defined in `src/utils/exchangeRates.ts`. Any new rate provider must implement this:

```typescript
interface RateProvider {
  name: string;
  fetchRates(baseCurrency: string): Promise<RateCacheEntry>;
}
```

### 2.2 `RateCacheEntry`

```typescript
interface RateCacheEntry {
  rates: Record<string, number>;  // keyed by ISO code; values relative to `base`
  base: string;                   // the `baseCurrency` requested
  fetchedAt: string;              // ISO 8601
  expiresAt: string;              // ISO 8601 — cache is stale after this
  source: string;                 // short identifier: 'ecb', 'frankfurter', etc.
  provider?: string;              // implementation name (e.g. 'frankfurter', 'ecb_daily')
}
```

**Rate convention:** All stored rates are `1 baseCurrency = N targetCurrency`. `baseCurrency` is always `EUR` for ECB (cross-converted client-side); Frankfurter supports arbitrary base currencies.

### 2.3 Client-side cache

Client-side cached rates (browser localStorage):

| Key | Shape |
|-----|-------|
| `bluecollr_exchange_rates_v2` | `RateCacheEntry` |

TTL: 24 hours. On load, `getRate()` checks the cache first; serves stale data with HTTP 503 from the API if the provider is down.

### 2.4 Server-side cache

`src/app/api/rates/route.ts` stores a separate in-memory cache keyed by `from` currency (base of ECB/Frankfurter response), not by the user's `from-to` pair. Cache TTL is also 24 hours. The server cache is non-persistent across process restarts.

---

## 3. API Contracts

All routes are Next.js Route Handlers under `src/app/api/`. All responses are JSON. Errors follow `{ error: string }`; validation errors may also include `code?: string`.

### 3.1 `GET /api/settings`

Returns the authenticated user's business settings or defaults.

**Query parameters:** none

**Response 200:**

```json
{
  "baseCurrency": "USD",
  "showBaseCurrencyEquivalent": true,
  "defaultTaxRate": 0,
  "perCurrencyTaxRate": false,
  "perCurrencyTaxRates": {}
}
```

**Authentication:** Cookie-based user ID (`bluecollr_user_id`). If no cookie exists, a new UUID is created and set as an `httpOnly` cookie. Falls back to `DEFAULT_SETTINGS` if `DATABASE_URL` is absent.

---

### 3.2 `PATCH /api/settings`

Upserts the user's business settings.

**Request body (all fields optional — partial update):**

| Field | Type | Notes |
|-------|------|-------|
| `baseCurrency` | `string` | 3-letter ISO code; validated `/^[A-Z]{3}$/` |
| `showBaseCurrencyEquivalent` | `boolean` | |
| `defaultTaxRate` | `number` | Finite number |
| `perCurrencyTaxRate` | `boolean` | |
| `perCurrencyTaxRates` | `Record<string, number>` | Keys are ISO codes; values are finite numbers |

**Response 200:**

```json
{
  "baseCurrency": "USD",
  "showBaseCurrencyEquivalent": true,
  "defaultTaxRate": 0,
  "perCurrencyTaxRate": false,
  "perCurrencyTaxRates": {}
}
```

**Response 400:** `{ "error": "<validation message>" }`
**Response 500:** `{ "error": "Failed to save settings." }`

---

### 3.3 `GET /api/rates`

Returns the exchange rate for a currency pair.

**Query parameters:**

| Param | Required | Constraints |
|-------|----------|-------------|
| `from` | yes | 3-letter ISO code, uppercase |
| `to` | yes | 3-letter ISO code, uppercase |

**Response 200:**

```json
{
  "rate": 1.08,
  "source": "frankfurter",
  "fetchedAt": "2026-07-03T14:00:00.000Z",
  "expiresAt": "2026-07-04T14:00:00.000Z"
}
```

**Response 400:** `{ "error": "Missing or invalid query parameters..." }`
**Response 503:** (stale cache served) same shape as 200 but HTTP 503
**Response 500:** `{ "error": "Failed to fetch exchange rates." }`

**Backend contract notes:**
- Uses `frankfurter.dev` provider (ECB fallback planned).
- In-memory server-side cache: 24-hour TTL, keyed by `from`.
- No `baseCurrency` field in response — the `from` query param is the base.

---

## 4. localStorage Contracts

All client-side persistence uses `localStorage` with JSON serialization. Timestamps are stored as ISO 8601 strings — never as `Date` objects (JSON serialization would lose them).

### 4.1 Draft Estimate (`bluecollr_draft`)

```typescript
interface StoredDraft {
  company: Company;
  client: Client;
  lineItems: LineItem[];
  notes: string;
  taxRate: number;
  deposit: number;
  currency: CurrencyCode;
  invoiceCurrencyInfo: InvoiceCurrencyInfo | null;
  isIssued: boolean;
  issuedAt?: string;            // ISO 8601; absent or null when not issued
}
```

**Read:** `loadDraft<T>()` in `src/hooks/useLocalStorage.ts` parses with `JSON.parse` and returns `T | null`.

**Write:** `useAutoSave(key, value)` in `src/hooks/useLocalStorage.ts` — debounced 300 ms write on every value change + immediate flush on `visibilitychange` (tab hide/unload).

**Migration note (v1 → current):** Older drafts may have had `currency: Currency` (the 5-element union). The current code stores `currency: CurrencyCode` (plain string). `loadDraft<T>()` casts via a generic — old drafts with a 5-letter union value are still valid strings and load without error.

### 4.2 Business Settings (`bluecollr_business_settings`)

```typescript
interface StoredBusinessSettings {
  baseCurrency: CurrencyCode;
  showBaseCurrencyEquivalent: boolean;
  defaultTaxRate: number;
  perCurrencyTaxRate: boolean;
  perCurrencyTaxRates: Record<CurrencyCode, number>;
}
```

**Read:** `loadBusinessSettings()` in `EstimateClient.tsx` — merges on top of `DEFAULT_SETTINGS`.

**Write:** Via `PATCH /api/settings` (server of record). Also cached to `localStorage` on load for offline resilience; the server wins on reconnect.

### 4.3 Issued Invoices (`bluecollr_issued_invoices`)

```typescript
// Top-level stored array —
interface StoredIssuedInvoice extends Omit<Estimate, 'isIssued'> {
  issuedAt: string;  // ISO 8601; always present for issued records
}
// Value: StoredIssuedInvoice[]
```

**Write path:** `EstimateClient.tsx` → reads existing array → appends frozen `Estimate` (post-issue copy) → writes back.

**Read path:** `AnalyticsView.tsx` receives the full array as a prop; does not read localStorage directly.

### 4.4 Exchange Rate Cache (`bluecollr_exchange_rates_v2`)

```typescript
interface StoredRateCache {
  rates: Record<string, number>;
  base: string;
  fetchedAt: string;
  expiresAt: string;
  source: string;
  provider?: string;
}
```

**Read:** `getCachedRates()` in `src/utils/exchangeRates.ts` — returns `null` if missing, malformed, or expired.

**Write:** `setCachedRates(entry)` in `src/utils/exchangeRates.ts` — called after a successful `provider.fetchRates()`.

**Legacy key fallback (`bluecollr_rates_cache`):** `EstimateClient.tsx` reads this key as a fallback when `bluecollr_exchange_rates_v2` is absent, for backward compatibility with users who had an earlier version of the app. New writes always use `_v2`.

---

## 5. Database Schema (PostgreSQL)

Server-side storage introduced for `business_settings`. Define via migrations in `db/migrations/`. See `DECISIONS.md` for schema rationale.

Relevant table shape for settings:

```sql
business_settings (
  user_id                uuid PRIMARY KEY,
  base_currency          varchar(3) NOT NULL DEFAULT 'USD',
  show_base_currency_equivalent boolean NOT NULL DEFAULT false,
  default_tax_rate       numeric NOT NULL DEFAULT 0,
  per_currency_tax_rate  boolean NOT NULL DEFAULT false,
  per_currency_tax_rates jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
)
```

`invoices` table (future) stores the full frozen payload:

```sql
invoices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES business_settings(user_id),
  data        jsonb NOT NULL,         -- full Estimate JSON
  issued_at   timestamptz NOT NULL DEFAULT now()
)
-- BEFORE UPDATE trigger enforces immutability on issued_at
```

---

## 6. Cross-Agent Constraints

- **Frontend agents** must import `Currency`, `CurrencyCode`, `BusinessSettings`, `Estimate`, `LineItem`, `RateMetadata`, `InvoiceCurrencyInfo`, `LineItemBaseAmount`, `RateProvider`, `RateCacheEntry` exclusively from `src/types.ts`. Do not declare mirrors.
- **Backend agents** must serialize JSON field names to exactly match the TypeScript interfaces above. `fetchedAt` is always a string; never a `Date` object.
- **All agents** must treat `InvoiceCurrencyInfo` as immutable once `isIssued` is `true`. Any conversion changes require a new `issuedAt` (a new invoice record).
- **localStorage reads** must use `try/catch JSON.parse` and return `null` on failure — localStorage can contain corrupted data from interrupted writes.
- **Valid currency codes:** active codes come from `getAllCurrencies()` in `src/utils/currencyData.ts`. Inactive codes (e.g. `HRK`, `CUC`) exist in the dataset with `isActive: false` and must be rejected by `validCurrency()`.
