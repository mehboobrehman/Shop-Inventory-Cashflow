# Project Decisions

Architectural and design decisions made during development.
All agents should read this before starting work and log new decisions here.

## Responsive refactor: HTML body sizing + layout viewport
**When**: 2026-07-02 19:20:01

Added an explicit layout viewport meta tag to prevent mobile zoom/scaling issues. Tuned body sizing in the preview for smaller screens, while preserving A4 PDF output size by separating wrapper styling from print-ready dimensions.

**Impact**: src/app/layout.tsx, src/app/page.tsx, src/components/PdfPreview.tsx

## Currency: union type in types.ts with 5 MVP currencies
**When**: 2026-07-03 07:07:39

Followed the project plan exactly: defined Currency as a union type in types.ts (the central type module) and imported it in EstimateClient.tsx. This avoids circular imports and keeps types co-located. The 5 currencies (USD, GBP, CAD, AUD, EUR) match the MVP scope from the product plan.

**Impact**: src/types.ts, src/app/estimate/EstimateClient.tsx

## Verify per-currency tax rate support (round 2 review)
**When**: 2026-07-03 19:29:38

All 4 code-review issues were already fixed in the current codebase during the previous implementation round. I verified each fix against the literal acceptance criteria, ran LSP diagnostics, and called verify_implementation, which passed and auto-moved the task to review.

**Impact**: src/app/estimate/EstimateClient.tsx, src/components/PdfPreview.tsx, src/types.ts, src/utils/currency.ts

## Use issuedInvoices list instead of [estimate] for AnalyticsView
**When**: 2026-07-04 22:57:20

Review round 1 identified that AnalyticsView only received the active draft [estimate], making it impossible to display a history of stored invoices. Persisting to localStorage under bluecollr_issued_invoices gives a growing list without any database or backend requirement.

**Impact**: src/app/estimate/EstimateClient.tsx (ESM/state), src/components/AnalyticsView.tsx (props), src/utils/analytics.ts (dualCurrencyTotals)

## DB: PostgreSQL schema in db/ with plain SQL migrations
**When**: 2026-07-05 01:41:53

The project is a client-side Next.js app with no existing backend/database layer. For a schema/migration task, I created a dedicated db/ directory with plain SQL files (up/down pairs) instead of forcing in an ORM or migration tool. This keeps the schema immediately runnable via psql, Supabase SQL editor, or any migration runner. UUIDs are used for all primary keys to support future multi-user, offline-capable clients. JSONB on invoices.data stores the full frozen invoice payload; created_at/issued_at use TIMESTAMPTZ for timezone-safe audit trails. CHECK constraints replace ENUM for the audit_log.action field to avoid Postgres type-object lifecycle issues in down migrations while still enforcing the allowed values. Immutability is enforced via a BEFORE UPDATE trigger on invoices.

**Impact**: db/schema/*.sql, db/migrations/*.sql; future backend engineers will run these against PostgreSQL to bootstrap the tables before connecting Next.js Route Handlers.

## Contracts: single docs/contracts.md for all cross-layer shapes
**When**: 2026-07-05 13:04:44

The project already has src/types.ts holding all TypeScript interfaces. Creating a second "types directory" would split definition from documentation and create confusion. A single docs/contracts.md is the standard architecture-doc pattern: source types remain in src/types.ts; contracts.md is the human-readable, cross-referenced contract reference covering TS interfaces, API request/response shapes (validated against actual src/app/api/*/route.ts files), and localStorage key schemas. New contracts additions are appended to this file by convention.

**Impact**: src/types.ts, src/utils/analytics.ts, src/app/api/settings/route.ts, src/app/api/rates/route.ts, src/utils/exchangeRates.ts, src/hooks/useLocalStorage.ts

## ECB XML parser: fix quote handling in parseEcbXml regex
**When**: 2026-07-05 17:27:50

ECB's eurofxref-daily.xml uses single quotes for Cube attributes (currency='...' rate='...'), but parseEcbXml used double-quote-matching regex. This caused the parser to return only { EUR: 1 }, breaking all rate lookups and making cross-conversion impossible. The fix updates the regex to accept both single and double quotes, restoring correct rate parsing and allowing ECBRateProvider.fetchRates() to compute proper cross-conversion for non-EUR bases. The baseCurrency parameter was already used for cross-conversion; the parser failure masked its effect.

**Impact**: src/utils/exchangeRates.ts — parseEcbXml regex updated to handle ['"] quote styles. All ECB rate lookups (from any base currency) now work correctly. Frankfurter, OpenExchangeRates stubs, and all call sites are unaffected.
