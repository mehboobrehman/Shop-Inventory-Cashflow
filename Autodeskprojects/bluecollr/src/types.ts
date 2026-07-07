export interface Company {
  name: string;
  phone: string;
  email: string;
  logoDataUrl?: string;
}

export interface Client {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  baseAmount: number;
}

export type CurrencyCode = string;

/** MVP currency union — callers should accept either Currency or CurrencyCode. */
export type Currency = 'USD' | 'GBP' | 'CAD' | 'AUD' | 'EUR';

export interface Estimate {
  company: Company;
  client: Client;
  lineItems: LineItem[];
  notes: string;
  taxRate: number;
  deposit: number;
  currency: CurrencyCode;
  invoiceCurrencyInfo: InvoiceCurrencyInfo | null;
  isIssued: boolean;
  issuedAt?: string;
}

export type PaymentStatus = 'idle' | 'success' | 'canceled';

export interface PaymentResult {
  status: PaymentStatus;
  sessionId?: string;
  reset?: () => void;
}

export type RateSource = 'ecb' | 'openexchangerates' | 'frankfurter' | 'manual';

export interface RateMetadata {
  source: RateSource;
  rate: number;
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  fetchedAt: string | null;
  expiresAt: string | null;
  provider?: string;
  manualNote?: string;
}

export interface CurrencyRoundRule {
  decimals: number;
  step: number;
}

export interface CurrencyMeta {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  decimalDigits: number;
  rounding?: CurrencyRoundRule;
  isActive?: boolean;
}

export interface LineItemBaseAmount {
  baseAmount: number;
  convertedAmount: number;
}

export interface InvoiceCurrencyInfo {
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

export interface BusinessSettings {
  baseCurrency: CurrencyCode;
  showBaseCurrencyEquivalent: boolean;
  defaultTaxRate: number;
  perCurrencyTaxRate: boolean;
  perCurrencyTaxRates: Record<CurrencyCode, number>;
}

export interface RateProvider {
  name: string;
  fetchRates(baseCurrency: string): Promise<RateCacheEntry>;
}

export interface RateCacheEntry {
  rates: Record<string, number>;
  base: string;
  fetchedAt: string;
  expiresAt: string;
  source: string;
  provider?: string;
}
