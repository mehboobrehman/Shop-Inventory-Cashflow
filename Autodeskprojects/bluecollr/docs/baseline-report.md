# BlueCollr — Baseline Verification Report

**Date:** 2026-07-05  
**Agent:** Software Architect  
**Task ID:** be1cb01a-d9c0-4000-8ec4-6c5d7ec819bc  
**Project:** BlueCollr (e61764e9-783e-48c0-982c-80d4b7c97a29)

---

## 1. Build & Dev Verification

### 1.1 `npm run build`
- **Result:** PASSED — zero errors
- **Output summary:**
  - Next.js 16.2.10 (Turbopack)
  - Compiled successfully in 13.9s
  - TypeScript finished in 11.0s
  - Generating static pages: 7/7 in 1220ms
  - **Routes compiled:** `/`, `/_not-found`, `/api/rates`, `/api/settings`, `/estimate`
  - 3 static prerendered, 2 dynamic server-rendered

**Actual build output (quoted):**
```
✓ Compiled successfully in 13.9s
  Running TypeScript ...  Finished TypeScript in 11.0s ...
  Collecting page data using 8 workers ...
  Generating static pages using 8 workers (0/7) ...
  Generating static pages using 8 workers (7/7) in 1220ms
```

### 1.2 `npm run dev`
- **Result:** BLOCKER — dev server cannot be cleanly verified
- **Finding:** Port 3000 is occupied by a stale Next.js dev server (PID 17572). This process originates from the BlueCollr directory (`node_modules\next\dist\server\lib\start-server.js`), yet it serves stale cached HTML with `<title>BentoPDF - Free Online PDF Tools | Privacy-First PDF Toolkit</title>` rather than BlueCollr content.
- A second `npm run dev` attempt entered "Ready in 3.6s" on port 3001, then immediately exited with code 1, reporting: "Another next dev server is already running." (PID 17572 on port 3000).
- **No listenable BlueCollr dev server is currently running.**
- **Source verification:** The current `src/app/page.tsx` and `src/app/layout.tsx` both contain "BlueCollr" branding, confirming the issue is runtime cache/stale process, not source code.

---

## 2. File Inventory

### 2.1 `src/` directory (68 total items)

| Directory | Files | Notes |
|-----------|-------|-------|
| `src/app/` | 6 | `layout.tsx`, `page.tsx`, `favicon.ico`, `globals.css`, `estimate/page.tsx`, `estimate/EstimateClient.tsx` |
| `src/app/api/` | 2 | `settings/route.ts`, `rates/route.ts` |
| `src/components/` | 10 .tsx + many artifacts | Active components: `AnalyticsView.tsx`, `CurrencyChangeDialog.tsx`, `CurrencySelector.tsx`, `MarkdownEditor.tsx`, `PaymentModal.tsx`, `PdfPreview.tsx`, `RateDisplay.tsx`, `RateOverrideModal.tsx`. Also contains stray test/artifact files (e.g., `test_src.txt`, `gen.js`, `script.py`, `w.py`, `tmp_test/test.txt`). |
| `src/hooks/` | 2 | `useLocalStorage.ts`, `usePaymentStatus.ts` |
| `src/lib/` | 1 | `db.ts` |
| `src/types/` | 1 | `html2pdf.d.ts` |
| `src/utils/` | 6 + artifacts | `analytics.ts`, `currency.ts`, `currencyData.ts`, `exchangeRates.ts`, plus `test123.txt`, `w.py`, `_test_write.txt`, `tmp_test/test.txt` |
| `src/` root | 2 | `types.ts`, `test_src.txt` |
| `src/newdir/` | 1 | `test.txt` |

### 2.2 `db/` directory (12 files)

| Path | Count | Notes |
|------|-------|-------|
| `db/schema/` | 6 | `business_settings.sql`, `invoices.sql`, `audit_log.sql`, `auditlog.sql` (duplicate name variant), `ratelog.sql`, `rate_log.sql` (duplicate name variant) |
| `db/migrations/` | 6 | Three up/down pairs: initial schema, immutability audit, business settings |

### 2.3 `app/api/` (under `src/app/api/`)
- `src/app/api/settings/route.ts`
- `src/app/api/rates/route.ts`

---

## 3. Database Cross-Reference

### 3.1 Route handlers vs. migrations

| Route | Tables Referenced | Migration Coverage |
|-------|-------------------|-------------------|
| `GET /api/settings` | `business_settings` | `20260107000000_business_settings.up.sql` ✅ |
| `PATCH /api/settings` | `business_settings` | Same migration ✅ |
| `GET /api/rates` | None (uses in-memory cache + Frankfurter provider) | N/A ✅ |

### 3.2 DB client
- `src/lib/db.ts` exports `getSql()` which returns a `postgres.Sql` singleton when `DATABASE_URL` is present, otherwise `null`. Used by `settings/route.ts` only.

### 3.3 Discrepancies found

1. **`invoices.user_id` mismatch**
   - `db/schema/invoices.sql` declares `user_id UUID NOT NULL`
   - `db/migrations/20260105000000_initial_schema.up.sql` does NOT include `user_id` in the `invoices` table
   - **Impact:** If the migration is run standalone, `invoices` will lack `user_id`. Future backend engineers must reconcile which definition is authoritative.

2. **Duplicate schema files with divergent content**
   - `auditlog.sql` vs `audit_log.sql`:
     - `audit_log.sql`: `action VARCHAR(30) NOT NULL CHECK (...)`, `meta JSONB`, `user_id UUID NOT NULL`, `timestamp TIMESTAMPTZ`
     - `auditlog.sql`: `action TEXT NOT NULL CHECK (...)`, `details JSONB DEFAULT '{}'::jsonb`, `created_at TIMESTAMPTZ DEFAULT now()`, no `user_id`
     - **Migration uses `audit_log`** (without `user_id`, with `details`), which matches `auditlog.sql` but contradicts `audit_log.sql`
   - `ratelog.sql` vs `rate_log.sql`:
     - `rate_log.sql`: `source VARCHAR(50) NOT NULL`, `rate NUMERIC(18, 8) CHECK (rate > 0)`, `base_currency VARCHAR(3)`, `target_currency VARCHAR(3)`, `provider VARCHAR(100)`, `manual_note TEXT`, `fetched_at TIMESTAMPTZ`
     - `ratelog.sql`: `source TEXT NOT NULL CHECK (source IN ('ecb','openexchangerates','manual'))`, `rate NUMERIC NOT NULL`, `base_currency TEXT`, `target_currency TEXT`, `provider TEXT`, `manual_note TEXT`, `fetched_at TIMESTAMPTZ DEFAULT now()`, `created_at TIMESTAMPTZ DEFAULT now()`
     - **Migration uses `ratelog`** (with `CHECK` source constraint and `created_at`), matching `ratelog.sql` but contradicting `rate_log.sql`

### 3.4 Summary
- Every table/column referenced by route handlers has a corresponding CREATE TABLE in migrations. No missing coverage.
- However, there are **two pairs of conflicting schema files** (`auditlog`/`audit_log`, `ratelog`/`rate_log`) and **one schema/migration mismatch** (`invoices.user_id`). These should be resolved before any backend engineer runs the migrations against PostgreSQL.

---

## 4. LSP Diagnostics

All 5 specified files were checked, plus 14 additional source files for completeness.

| File | Errors | Warnings | Status |
|------|--------|----------|--------|
| `src/app/estimate/EstimateClient.tsx` | 0 | 0 | ✅ |
| `src/utils/analytics.ts` | 0 | 0 | ✅ |
| `src/utils/exchangeRates.ts` | 0 | 0 | ✅ |
| `src/components/CurrencySelector.tsx` | 0 | 0 | ✅ |
| `src/components/PdfPreview.tsx` | 0 | 0 | ✅ |

**Broader check (19 files across components, hooks, pages, lib, utils):**
- **Total errors across all checked files:** 0
- **Total warnings across all checked files:** 0

---

## 5. DECISIONS.md Review

### 5.1 Current entries
| Decision | Date | Status |
|----------|------|--------|
| Responsive refactor: HTML body sizing + layout viewport | 2026-07-02 19:20 | Consistent with `layout.tsx` and `PdfPreview.tsx` |
| Currency: union type in types.ts with 5 MVP currencies | 2026-07-03 07:07 | Consistent with `src/types.ts` and `EstimateClient.tsx` |
| Verify per-currency tax rate support (round 2 review) | 2026-07-03 19:29 | Consistent with reviewed files |
| Use issuedInvoices list instead of [estimate] for AnalyticsView | 2026-07-04 22:57 | Consistent with `EstimateClient.tsx` and `AnalyticsView.tsx` |
| DB: PostgreSQL schema in db/ with plain SQL migrations | 2026-07-05 01:41 | Consistent with `db/schema/*.sql`, `db/migrations/*.sql`, and `lib/db.ts` |
| Contracts: single docs/contracts.md for all cross-layer shapes | 2026-07-05 13:04 | **⚠ OUTDATED/INCOMPLETE** |

### 5.2 Inconsistencies

1. **MISSING `docs/contracts.md`**
   - The 2026-07-05 13:04 decision explicitly states: "A single `docs/contracts.md` is the standard architecture-doc pattern ... New contracts additions are appended to this file by convention."
   - The file `docs/contracts.md` does **not exist** in the project workspace.
   - This creates a gap where API request/response shapes and localStorage key schemas that were promised to be documented there are not yet captured.

2. **Stale dev server / BentoPDF content contamination**
   - Not reflected in DECISIONS.md. DECISIONS.md does not mention the stale Next.js dev server (PID 17572) that is currently serving cached "BentoPDF" HTML from the BlueCollr directory.

### 5.3 Conclusion
DECISIONS.md is largely up to date and consistent with the codebase for the decisions it records. One decision (`Contracts: single docs/contracts.md`) references a deliverable file that has not yet been created.

---

## 6. Key Findings Summary

| Area | Finding | Severity |
|------|---------|----------|
| Build | `npm run build` passes with zero errors | ✅ Good |
| Dev server | Stale PID 17572 on port 3000 serves "BentoPDF" HTML; fresh dev cannot start cleanly | 🚨 **Blocker** |
| DB migrations vs schema | `auditlog`/`audit_log` and `ratelog`/`rate_log` contain conflicting definitions; `invoices.user_id` differs between schema and migration | ⚠️ **Gap** |
| API coverage | `business_settings` tables fully covered; `rates` route has no DB dependency | ✅ Good |
| LSP diagnostics | 0 errors and 0 warnings across all 19 checked files | ✅ Good |
| DECISIONS.md | 6 entries; 1 references non-existent `docs/contracts.md` | ⚠️ **Gap** |
| Source artifacts | `src/` contains ~25 stray test/artifact files (`.txt`, `.py`, `.js`) that may cause confusion | ℹ️ **Noise** |

---

## 7. Recommendations for Next Steps

1. **Immediate:** Kill stale dev server (`taskkill /PID 17572 /F`) and clear `.next` to allow a clean `npm run dev` run. (Out of scope for this baseline — flagged for follow-up.)
2. **Reconcile DB schema:** Choose canonical schema files between `auditlog.sql` ↔ `audit_log.sql` and `ratelog.sql` ↔ `rate_log.sql`. Add or remove `user_id` from `invoices` consistently.
3. **Create `docs/contracts.md`:** Fulfil the logged decision by documenting API shapes and localStorage keys.
4. **Clean source artifacts:** Remove stray test files from `src/` to reduce noise and prevent future build surprises.

---

*End of baseline report.*
