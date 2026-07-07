import { describe, it, expect, vi } from 'vitest';
import {
  validateInvoiceCurrencyInfo,
  computeTotals,
  dualCurrencyTotals,
} from '../analytics';
import type { Estimate, InvoiceCurrencyInfo, LineItem } from '../../types';

// ─────────────────────────────────────────────
// Helper factories
// ─────────────────────────────────────────────

function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: 'li-1',
    description: 'Test item',
    quantity: 1,
    rate: 150,
    baseAmount: 150,
    ...overrides,
  };
}

function makeEstimate(overrides: Partial<Estimate> = {}): Estimate {
  return {
    company: { name: 'ACME', phone: '000', email: 'a@b.com' },
    client: { name: 'Client', address: '', phone: '', email: '' },
    lineItems: [lineItem()],
    notes: '',
    taxRate: 0,
    deposit: 0,
    currency: 'USD',
    invoiceCurrencyInfo: null,
    isIssued: false,
    ...overrides,
  } as Estimate;
}

function makeSnapshot(opts: {
  currency?: string;
  lineItems?: { baseAmount: number; convertedAmount: number }[];
  subtotal?: { baseAmount: number; convertedAmount: number };
  tax?: { baseAmount: number; convertedAmount: number };
  deposit?: { baseAmount: number; convertedAmount: number };
  total?: { baseAmount: number; convertedAmount: number };
  rate?: { source: 'ecb' | 'openexchangerates' | 'frankfurter' | 'manual'; rate: number; baseCurrency: string; targetCurrency: string; fetchedAt: string; expiresAt: string };
} = {}): InvoiceCurrencyInfo {
  const liSnapshots =
    opts.lineItems ??
    [{ baseAmount: 150, convertedAmount: 225 }];

  return {
    currency: opts.currency ?? 'EUR',
    rate: opts.rate ?? {
      source: 'ecb',
      rate: 1.5,
      baseCurrency: 'EUR',
      targetCurrency: 'USD',
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    amounts: {
      lineItems: liSnapshots,
      subtotal: opts.subtotal ?? { baseAmount: 150, convertedAmount: 225 },
      tax: opts.tax ?? { baseAmount: 0, convertedAmount: 0 },
      deposit: opts.deposit ?? { baseAmount: 0, convertedAmount: 0 },
      total: opts.total ?? { baseAmount: 150, convertedAmount: 225 },
    },
  };
}

// ─────────────────────────────────────────────
// 1. validateInvoiceCurrencyInfo
// ─────────────────────────────────────────────

describe('validateInvoiceCurrencyInfo', () => {
  it('returns false for null', () => {
    expect(validateInvoiceCurrencyInfo(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validateInvoiceCurrencyInfo(undefined)).toBe(false);
  });

  it('returns true for a complete, well-formed snapshot', () => {
    const snap = makeSnapshot({
      subtotal: { baseAmount: 100, convertedAmount: 150 },
      tax: { baseAmount: 10, convertedAmount: 15 },
      deposit: { baseAmount: 0, convertedAmount: 0 },
      total: { baseAmount: 110, convertedAmount: 165 },
    });
    expect(validateInvoiceCurrencyInfo(snap)).toBe(true);
  });

  it('returns false for a partial snapshot (missing line item baseAmount)', () => {
    const snap = makeSnapshot({
      lineItems: [{ baseAmount: NaN, convertedAmount: 225 }],
    });
    expect(validateInvoiceCurrencyInfo(snap)).toBe(false);
  });

  it('returns false for a partial snapshot (missing total convertedAmount)', () => {
    const snap = makeSnapshot({
      total: { baseAmount: 150, convertedAmount: Infinity },
    });
    expect(validateInvoiceCurrencyInfo(snap)).toBe(false);
  });

  it('returns false for a partial snapshot with empty-string currency', () => {
    const snap: InvoiceCurrencyInfo = {
      currency: '',
      rate: null,
      amounts: {
        lineItems: [],
        subtotal: { baseAmount: 0, convertedAmount: 0 },
        tax: { baseAmount: 0, convertedAmount: 0 },
        deposit: { baseAmount: 0, convertedAmount: 0 },
        total: { baseAmount: 0, convertedAmount: 0 },
      },
    };
    expect(validateInvoiceCurrencyInfo(snap)).toBe(false);
  });

  it('returns true for a zero-value snapshot (all fields zero)', () => {
    const snap = makeSnapshot({
      subtotal: { baseAmount: 0, convertedAmount: 0 },
      tax: { baseAmount: 0, convertedAmount: 0 },
      deposit: { baseAmount: 0, convertedAmount: 0 },
      total: { baseAmount: 0, convertedAmount: 0 },
      lineItems: [],
    });
    expect(validateInvoiceCurrencyInfo(snap)).toBe(true);
  });

  it('returns false when a line item baseAmount is undefined', () => {
    const snap = makeSnapshot({
      lineItems: [{ baseAmount: undefined as unknown as number, convertedAmount: 225 }],
    });
    expect(validateInvoiceCurrencyInfo(snap)).toBe(false);
  });

  it('returns false when the totals array (subtotal) baseAmount is null', () => {
    const snap = makeSnapshot();
    (snap.amounts.subtotal as any) = null;
    expect(validateInvoiceCurrencyInfo(snap)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// 2. computeTotals
// ─────────────────────────────────────────────

describe('computeTotals', () => {
  it('returns all zeros for an empty line-items array', () => {
    const e = makeEstimate({ lineItems: [], taxRate: 10, deposit: 0 });
    const t = computeTotals(e);
    expect(t.subtotal).toBeCloseTo(0);
    expect(t.taxAmount).toBeCloseTo(0);
    expect(t.deposit).toBeCloseTo(0);
    expect(t.total).toBeCloseTo(0);
    expect(t.currency).toBe('USD');
  });

  it('returns all zeros when all line-item amount contributions are zero', () => {
    const e = makeEstimate({
      lineItems: [
        lineItem({ quantity: 0, rate: 50 }),
        lineItem({ quantity: 2, rate: 0 }),
      ],
      taxRate: 0,
      deposit: 0,
    });
    const t = computeTotals(e);
    expect(t.subtotal).toBeCloseTo(0);
    expect(t.taxAmount).toBeCloseTo(0);
    expect(t.deposit).toBeCloseTo(0);
    expect(t.total).toBeCloseTo(0);
  });

  it('single item qty=1 rate=150, taxRate=10, deposit=20', () => {
    const e = makeEstimate({
      lineItems: [lineItem({ quantity: 1, rate: 150 })],
      taxRate: 10,
      deposit: 20,
    });
    const t = computeTotals(e);
    expect(t.subtotal).toBeCloseTo(150);
    expect(t.taxAmount).toBeCloseTo(15);
    expect(t.deposit).toBeCloseTo(20);
    expect(t.total).toBeCloseTo(145);
  });

  it('total = subtotal + tax - deposit with two items', () => {
    // 2*50 + 1*100 = 200; tax 8% = 16; deposit 30; total = 186
    const e = makeEstimate({
      lineItems: [lineItem({ quantity: 2, rate: 50 }), lineItem({ quantity: 1, rate: 100 })],
      taxRate: 8,
      deposit: 30,
    });
    const t = computeTotals(e);
    expect(t.subtotal).toBeCloseTo(200);
    expect(t.taxAmount).toBeCloseTo(16);
    expect(t.deposit).toBeCloseTo(30);
    expect(t.total).toBeCloseTo(186);
  });

  it('handles negative line-item quantities/rates', () => {
    // (-1)*100 + 2*50 = 0
    const e = makeEstimate({
      lineItems: [lineItem({ quantity: -1, rate: 100 }), lineItem({ quantity: 2, rate: 50 })],
      taxRate: 0,
      deposit: 0,
    });
    const t = computeTotals(e);
    expect(t.subtotal).toBeCloseTo(0);
    expect(t.total).toBeCloseTo(0);
  });

  it('handles non-numeric lineItem values (NaN coerced to 0)', () => {
    const e = makeEstimate({
      lineItems: [{ id: 'x', description: 'bad', quantity: NaN, rate: 100 }],
    } as unknown as Estimate);
    const t = computeTotals(e);
    // Number(NaN) || 0 = 0, Number(100) || 0 = 100; 0 * 100 = 0
    expect(t.subtotal).toBeCloseTo(0);
    expect(t.total).toBeCloseTo(0);
  });

  it('returns currency copy from estimate', () => {
    const e = makeEstimate({ currency: 'GBP', taxRate: 20, deposit: 50 });
    const t = computeTotals(e);
    expect(t.currency).toBe('GBP');
  });
});

// ─────────────────────────────────────────────
// 3. dualCurrencyTotals
// ─────────────────────────────────────────────

describe('dualCurrencyTotals', () => {
  it('returns empty maps for an empty estimates list with no warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = dualCurrencyTotals([], 'EUR');

    expect(result.byInvoiceCurrency.size).toBe(0);
    expect(result.byBaseCurrency.size).toBe(0);
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('same-currency invoice populates both maps correctly (no snapshot)', () => {
    // Two USD invoices with no snapshot: same-currency fallback path
    const inv1 = makeEstimate({ currency: 'USD', isIssued: true });
    const inv2 = makeEstimate({
      currency: 'USD',
      lineItems: [lineItem({ quantity: 2, rate: 50 })],
      isIssued: true,
    });

    const result = dualCurrencyTotals([inv1, inv2], 'USD');

    // Both recorded in byInvoiceCurrency under USD
    expect(result.byInvoiceCurrency.get('USD')?.count).toBe(2);

    // Both added via same-currency fallback (no snapshot, currency matches baseCurrency)
    expect(result.byBaseCurrency.get('USD')?.count).toBe(2);
    expect(result.byBaseCurrency.get('USD')?.total).toBeCloseTo(
      computeTotals(inv1).total + computeTotals(inv2).total,
    );
  });

  it('different-currency invoice with valid snapshot uses baseAmount for base totals', () => {
    // EUR invoice mapped to USD base — snapshot provides baseAmount
    const snap = makeSnapshot({
      currency: 'EUR',
      subtotal: { baseAmount: 100, convertedAmount: 150 },
      tax: { baseAmount: 10, convertedAmount: 15 },
      deposit: { baseAmount: 0, convertedAmount: 0 },
      total: { baseAmount: 110, convertedAmount: 165 },
      rate: {
        source: 'ecb',
        rate: 1.5,
        baseCurrency: 'EUR',
        targetCurrency: 'USD',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      lineItems: [{ baseAmount: 100, convertedAmount: 150 }],
    });

    const inv = makeEstimate({
      currency: 'EUR',
      lineItems: [lineItem({ quantity: 1, rate: 150 })],
      invoiceCurrencyInfo: snap,
      isIssued: true,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = dualCurrencyTotals([inv], 'USD');

    expect(result.byInvoiceCurrency.get('EUR')?.count).toBe(1);
    expect(result.byInvoiceCurrency.get('EUR')?.total).toBeCloseTo(
      computeTotals(inv).total,
    );

    // Base totals use the frozen baseAmount from the validated snapshot
    expect(result.byBaseCurrency.get('USD')?.count).toBe(1);
    expect(result.byBaseCurrency.get('USD')?.total).toBeCloseTo(110);

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('different-currency invoice with corrupted snapshot excluded from base totals and logs warning', () => {
    // Validation fails because lineItems[0].convertedAmount is NaN
    const snap: InvoiceCurrencyInfo = {
      currency: 'EUR',
      rate: {
        source: 'ecb',
        rate: 1.5,
        baseCurrency: 'EUR',
        targetCurrency: 'USD',
        fetchedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      amounts: {
        lineItems: [{ baseAmount: 100, convertedAmount: NaN }],
        subtotal: { baseAmount: 100, convertedAmount: 150 },
        tax: { baseAmount: 0, convertedAmount: 0 },
        deposit: { baseAmount: 0, convertedAmount: 0 },
        total: { baseAmount: 100, convertedAmount: 150 },
      },
    };

    const inv = makeEstimate({
      currency: 'EUR',
      lineItems: [lineItem({ quantity: 1, rate: 150 })],
      invoiceCurrencyInfo: snap,
      isIssued: true,
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = dualCurrencyTotals([inv], 'USD');

    // Invoice currency map always records the estimate
    expect(result.byInvoiceCurrency.get('EUR')?.count).toBe(1);

    // Corrupted snapshot → must NOT appear in base-currency totals
    expect(result.byBaseCurrency.get('USD')).toBeUndefined();

    // Warning logged
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('Incomplete InvoiceCurrencyInfo');
    expect(warnSpy.mock.calls[0][0]).toContain('Client');

    warnSpy.mockRestore();
  });

  it('same-currency invoice with valid snapshot still uses snapshot baseAmount (not computed total)', () => {
    // Total from 1*rate=600 = 600, but snapshot says baseAmount=550
    const snap = makeSnapshot({
      currency: 'USD',
      subtotal: { baseAmount: 500, convertedAmount: 500 },
      tax: { baseAmount: 50, convertedAmount: 50 },
      deposit: { baseAmount: 0, convertedAmount: 0 },
      total: { baseAmount: 550, convertedAmount: 550 },
    });

    const inv = makeEstimate({
      currency: 'USD',
      lineItems: [lineItem({ quantity: 1, rate: 600 })],
      invoiceCurrencyInfo: snap,
      isIssued: true,
    });

    const result = dualCurrencyTotals([inv], 'USD');

    // hasValidSnapshot=true; inCurr === baseCurrency → snapshot baseAmount used (550), not 600
    expect(result.byBaseCurrency.get('USD')?.total).toBeCloseTo(550);
  });

  it('records empty-string currency under the empty-string key (guard only skips null/undefined/non-string)', () => {
    const inv = makeEstimate({ currency: '' } as unknown as Estimate);
    const result = dualCurrencyTotals([inv], 'USD');
    expect(result.byInvoiceCurrency.has('')).toBe(true);
    // Empty string !== 'USD', and there is no snapshot, so byBaseCurrency stays empty.
    expect(result.byBaseCurrency.size).toBe(0);
  });

  it('uses computeTotals rounding in byInvoiceCurrency', () => {
    // qty=3 rate=10.005 → 3*10.005 = 30.015 → roundCurrency USD → 30.02
    const inv = makeEstimate({
      lineItems: [lineItem({ quantity: 3, rate: 10.005 })],
    });
    const result = dualCurrencyTotals([inv], 'USD');
    expect(result.byInvoiceCurrency.get('USD')?.total).toBeCloseTo(30.02);
  });
});
