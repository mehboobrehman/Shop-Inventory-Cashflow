import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { BusinessSettings } from '@/types';
import { getSql } from '@/lib/db';

const DEFAULT_SETTINGS: BusinessSettings = {
  baseCurrency: 'USD',
  showBaseCurrencyEquivalent: false,
  defaultTaxRate: 0,
  perCurrencyTaxRate: false,
  perCurrencyTaxRates: {},
};

const USER_ID_COOKIE = 'bluecollr_user_id';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function validatePayload(data: unknown): { valid: boolean; error?: string } {
  if (data === null || typeof data !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const obj = data as Record<string, unknown>;

  if ('baseCurrency' in obj) {
    if (typeof obj.baseCurrency !== 'string' || !/^[A-Z]{3}$/.test(obj.baseCurrency)) {
      return { valid: false, error: 'baseCurrency must be a 3-letter ISO currency code.' };
    }
  }
  if ('showBaseCurrencyEquivalent' in obj && typeof obj.showBaseCurrencyEquivalent !== 'boolean') {
    return { valid: false, error: 'showBaseCurrencyEquivalent must be a boolean.' };
  }
  if ('defaultTaxRate' in obj && !Number.isFinite(obj.defaultTaxRate)) {
    return { valid: false, error: 'defaultTaxRate must be a number.' };
  }
  if ('perCurrencyTaxRate' in obj && typeof obj.perCurrencyTaxRate !== 'boolean') {
    return { valid: false, error: 'perCurrencyTaxRate must be a boolean.' };
  }
  if ('perCurrencyTaxRates' in obj) {
    const v = obj.perCurrencyTaxRates;
    if (typeof v !== 'object' || v === null || Array.isArray(v)) {
      return { valid: false, error: 'perCurrencyTaxRates must be a record of currency codes to tax rates.' };
    }
    const record = v as Record<string, unknown>;
    for (const key of Object.keys(v)) {
      if (typeof record[key] !== 'number' || !Number.isFinite(record[key])) {
        return { valid: false, error: 'perCurrencyTaxRates values must be finite numbers.' };
      }
    }
  }

  return { valid: true };
}

function rowToSettings(row: {
  base_currency: string;
  show_base_currency_equivalent: boolean;
  default_tax_rate: number;
  per_currency_tax_rate: boolean;
  per_currency_tax_rates: Record<string, number> | null;
} | null): BusinessSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    baseCurrency: row.base_currency,
    showBaseCurrencyEquivalent: row.show_base_currency_equivalent,
    defaultTaxRate: row.default_tax_rate,
    perCurrencyTaxRate: row.per_currency_tax_rate,
    perCurrencyTaxRates: row.per_currency_tax_rates ?? {},
  };
}

async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies();
  let userId = cookieStore.get(USER_ID_COOKIE)?.value;
  if (!userId) {
    userId = crypto.randomUUID();
    cookieStore.set(USER_ID_COOKIE, userId, {
      httpOnly: true,
      secure: false,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return userId;
}

export async function GET(): Promise<NextResponse> {
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch {
    return NextResponse.json({ error: 'Failed to identify user.' }, { status: 500 });
  }

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(DEFAULT_SETTINGS, { headers: { 'X-Data-Source': 'default' } });
  }

  try {
    const result = await sql`
      SELECT base_currency, show_base_currency_equivalent, default_tax_rate, per_currency_tax_rate, per_currency_tax_rates
      FROM business_settings
      WHERE user_id = ${userId}
    ` as any as { rows: Array<{
      base_currency: string;
      show_base_currency_equivalent: boolean;
      default_tax_rate: number;
      per_currency_tax_rate: boolean;
      per_currency_tax_rates: Record<string, number> | null;
    }> };

    const settings = rowToSettings(result.rows[0] ?? null);
    return NextResponse.json(settings);
  } catch (err) {
    console.error('Settings GET query failed:', err);
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validation = validatePayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch {
    return NextResponse.json({ error: 'Failed to identify user.' }, { status: 500 });
  }

  const patchData = body as Partial<BusinessSettings>;
  const perCurrencyTaxRates = JSON.stringify(patchData.perCurrencyTaxRates ?? {});

  const sql = getSql();
  if (!sql) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }

  try {
    const result = await sql`
      INSERT INTO business_settings (user_id, base_currency, show_base_currency_equivalent, default_tax_rate, per_currency_tax_rate, per_currency_tax_rates)
      VALUES (${userId}, ${patchData.baseCurrency ?? 'USD'}, ${patchData.showBaseCurrencyEquivalent ?? false}, ${patchData.defaultTaxRate ?? 0}, ${patchData.perCurrencyTaxRate ?? false}, ${perCurrencyTaxRates as any})
      ON CONFLICT (user_id) DO UPDATE SET
        base_currency = COALESCE(${patchData.baseCurrency ?? null}, business_settings.base_currency),
        show_base_currency_equivalent = COALESCE(${patchData.showBaseCurrencyEquivalent ?? null}, business_settings.show_base_currency_equivalent),
        default_tax_rate = COALESCE(${patchData.defaultTaxRate ?? null}, business_settings.default_tax_rate),
        per_currency_tax_rate = COALESCE(${patchData.perCurrencyTaxRate ?? null}, business_settings.per_currency_tax_rate),
        per_currency_tax_rates = COALESCE(${perCurrencyTaxRates as any}, business_settings.per_currency_tax_rates),
        updated_at = now()
      RETURNING base_currency, show_base_currency_equivalent, default_tax_rate, per_currency_tax_rate, per_currency_tax_rates
    ` as any as { rows: Array<{
      base_currency: string;
      show_base_currency_equivalent: boolean;
      default_tax_rate: number;
      per_currency_tax_rate: boolean;
      per_currency_tax_rates: Record<string, number> | null;
    }> };

    const row = result.rows[0];
    const settings: BusinessSettings = {
      baseCurrency: row.base_currency,
      showBaseCurrencyEquivalent: row.show_base_currency_equivalent,
      defaultTaxRate: row.default_tax_rate,
      perCurrencyTaxRate: row.per_currency_tax_rate,
      perCurrencyTaxRates: row.per_currency_tax_rates ?? {},
    };
    return NextResponse.json(settings);
  } catch (err) {
    console.error('Settings PATCH query failed:', err);
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}
