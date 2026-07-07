'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CurrencyCode, Estimate, LineItem, BusinessSettings, InvoiceCurrencyInfo, RateMetadata } from '@/types';
import { loadDraft, useAutoSave } from '@/hooks/useLocalStorage';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import PdfPreview from '@/components/PdfPreview';
import PaymentModal from '@/components/PaymentModal';
import CurrencySelector from '@/components/CurrencySelector';
import RateDisplay from '@/components/RateDisplay';
import RateOverrideModal from '@/components/RateOverrideModal';
import CurrencyChangeDialog from '@/components/CurrencyChangeDialog';
import AnalyticsView from '@/components/AnalyticsView';
import { convertAmount, roundCurrency, formatCurrency, getAllCurrencies } from '@/utils/currency';
import { validCurrency, getActiveCurrencies } from '@/utils/currencyData';
import { validateInvoiceCurrencyInfo } from '@/utils/analytics';
import { getRate } from '@/utils/exchangeRates';

const emptyLineItem: LineItem = {
  id: crypto.randomUUID(),
  description: '',
  quantity: 1,
  rate: 0,
  baseAmount: 0,
};

const BUSINESS_SETTINGS_KEY = 'bluecollr_business_settings';
const ISSUED_INVOICES_KEY = 'bluecollr_issued_invoices';
const DRAFT_KEY = 'bluecollr_draft';

const defaultBusinessSettings: BusinessSettings = {
  baseCurrency: 'USD',
  showBaseCurrencyEquivalent: true,
  defaultTaxRate: 0,
  perCurrencyTaxRate: false,
  perCurrencyTaxRates: {},
};

function loadBusinessSettings(): BusinessSettings {
  if (typeof window === 'undefined') return defaultBusinessSettings;
  try {
    const raw = localStorage.getItem(BUSINESS_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BusinessSettings>;
      return { ...defaultBusinessSettings, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return defaultBusinessSettings;
}

function loadDefaultRate(targetCurrency: string): RateMetadata {
  if (typeof window === 'undefined') {
    return { source: 'manual', rate: 1, baseCurrency: 'USD', targetCurrency, fetchedAt: null, expiresAt: null };
  }
  try {
    const raw = localStorage.getItem('bluecollr_exchange_rates_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.rates && parsed?.base) {
        const rate = parsed.rates[targetCurrency] ?? (targetCurrency === parsed.base ? 1 : 0);
        return {
          source: 'ecb',
          rate,
          baseCurrency: parsed.base,
          targetCurrency,
          fetchedAt: parsed.fetchedAt ?? null,
          expiresAt: parsed.expiresAt ?? null,
          provider: parsed.provider ?? 'ecb_daily',
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  try {
    const raw = localStorage.getItem('bluecollr_rates_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.rates && parsed?.base) {
        const targetCode = parsed.target ?? parsed.base;
        const rate = parsed.rates[targetCode] ?? 1;
        return {
          source: parsed.source ?? 'ecb',
          rate,
          baseCurrency: parsed.base ?? 'USD',
          targetCurrency: targetCode,
          fetchedAt: parsed.fetchedAt ?? null,
          expiresAt: parsed.expiresAt ?? null,
          provider: parsed.source ?? 'ecb',
        };
      }
    }
  } catch {
    // ignore parse errors
  }
  return { source: 'manual', rate: 1, baseCurrency: 'USD', targetCurrency, fetchedAt: null, expiresAt: null };
}

function getCurrencyFromLocale(locale: string): CurrencyCode | null {
  const mapping: Record<string, CurrencyCode> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-AU': 'AUD',
    'en-CA': 'CAD',
    'en-IE': 'EUR',
    'fr-FR': 'EUR',
    'de-DE': 'EUR',
  };
  return mapping[locale] ?? null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function EstimateClient() {
  const initialSettings = useMemo(() => loadBusinessSettings(), []);
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);
  const [apiAvailable, setApiAvailable] = useState(false);
  const didInitialFetch = useRef(false);
  const suppressSyncAfterHydration = useRef(false);
  const [settingsSyncError, setSettingsSyncError] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // AC3: Hydrate settings from /api/settings on mount when the API is available.
  useEffect(() => {
    let canceled = false;
    fetch('/api/settings')
      .then(r => {
        if (!canceled && r.ok) return r.json();
        throw new Error('API unavailable');
      })
      .then((data: BusinessSettings) => {
        if (!canceled) {
          suppressSyncAfterHydration.current = true;
          didInitialFetch.current = true;
          setSettings(data);
          setApiAvailable(true);
        }
      })
      .catch(() => {
        // API unavailable; fall back to localStorage values.
        setSettingsSyncError("Settings may not be saved to your account. Your browser has a local copy and changes will persist here.");
      })
      .finally(() => {
        // Mark hydration complete so PdfPreview can render safely; server and client
        // have now synchronized state and further renders will match SSR output.
        if (!canceled) {
          setMounted(true);
        }
      });
    return () => { canceled = true; };
  }, []);

  // AC3: Push settings changes back to /api/settings after the initial hydrate.
  useEffect(() => {
    if (!didInitialFetch.current) {
      didInitialFetch.current = true;
      return;
    }
    if (!apiAvailable) return;
    if (suppressSyncAfterHydration.current) {
      suppressSyncAfterHydration.current = false;
      return;
    }

    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then(r => {
      if (!r.ok) throw new Error('Sync failed');
      setSettingsSyncError('');
    }).catch(() => {
      setSettingsSyncError("Settings may not be saved to your account. Your browser has a local copy and changes will persist here.");
    });
  }, [settings, apiAvailable]);

  // Persist updated business settings to localStorage.
  useEffect(() => {
    localStorage.setItem(BUSINESS_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const [generating, setGenerating] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [hydrationWarning, setHydrationWarning] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem]);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [ecbRateError, setEcbRateError] = useState<string>('');
  const [isEcbrLoading, setIsEcbrLoading] = useState(false);
  const [showManualRateInput, setShowManualRateInput] = useState(false);
  const [rateFetchTrigger, setRateFetchTrigger] = useState(0);
  const [isIssued, setIsIssued] = useState(false);
  const [issuedAt, setIssuedAt] = useState<string | undefined>(undefined);
  const [frozenInvoiceCurrencyInfo, setFrozenInvoiceCurrencyInfo] = useState<InvoiceCurrencyInfo | null>(null);
  const [currencyPreview, setCurrencyPreview] = useState<CurrencyCode | null>(null);
  const [previousCurrency, setPreviousCurrency] = useState<CurrencyCode | null>(null);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [lineItemErrors, setLineItemErrors] = useState<Record<string, { quantity?: string; rate?: string }>>({});
  const [currency, setCurrencyInternal] = useState<CurrencyCode>(() => {
    const draft = loadDraft<{ customerPreferredCurrency?: CurrencyCode; currency?: CurrencyCode }>();
    if (draft?.customerPreferredCurrency && validCurrency(draft.customerPreferredCurrency)) return draft.customerPreferredCurrency;
    if (draft?.currency && validCurrency(draft.currency)) return draft.currency;
    const locale = new Intl.NumberFormat().resolvedOptions().locale ?? 'en-US';
    const localeCurrency = getCurrencyFromLocale(locale);
    if (localeCurrency && validCurrency(localeCurrency)) return localeCurrency;
    return loadBusinessSettings().baseCurrency;
  });

  const [defaultRate, setDefaultRate] = useState<RateMetadata | null>(() => loadDefaultRate(currency));
  const [currencyRates, setCurrencyRates] = useState<Record<CurrencyCode, RateMetadata | null>>({});
  const currencyRequestSeq = useRef(0);

  const [issuedInvoices, setIssuedInvoices] = useState<Estimate[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ISSUED_INVOICES_KEY);
      if (raw) return JSON.parse(raw) as Estimate[];
    } catch { /* ignore parse errors */ }
    return [];
  });

  // Prime the ECB exchange-rate cache and update defaultRate when the invoice
  // currency or base currency changes. getRate reads its 24h cache first; it
  // only hits the network when the cache is stale or missing.
  useEffect(() => {
    if (isIssued) return;
    // Skip ECB fetch when a valid restored rate is already present: on mount,
    // defaultRate is initialised from localStorage (loadDefaultRate) and the
    // draft-restoration effect may later set it to a manual override. If that
    // manual rate is already in state here, the in-flight ECB promise would
    // otherwise overwrite it after setState flushes.
    const restoredRate = defaultRate;
    if (restoredRate && restoredRate.rate > 0 && restoredRate.targetCurrency === currency) return;

    setIsEcbrLoading(true);
    setEcbRateError('');
    const seq = ++currencyRequestSeq.current;
    let canceled = false;
    getRate(settings.baseCurrency, currency)
      .then((rateMeta) => {
        if (canceled || seq !== currencyRequestSeq.current) return;
        setDefaultRate(rateMeta);
        setCurrencyRates((prev) => ({ ...prev, [currency]: rateMeta }));
        setIsEcbrLoading(false);
      })
      .catch(() => {
        if (canceled || seq !== currencyRequestSeq.current) return;
        setDefaultRate(null);
        setCurrencyRates((prev) => ({ ...prev, [currency]: null }));
        setEcbRateError('Rates are temporarily unavailable.');
        setIsEcbrLoading(false);
      });
    return () => { canceled = true; };
  }, [currency, settings.baseCurrency, rateFetchTrigger, isIssued]);

  // Persist issued invoices to localStorage whenever the list changes.
  useEffect(() => {
    localStorage.setItem(ISSUED_INVOICES_KEY, JSON.stringify(issuedInvoices));
  }, [issuedInvoices]);

  // Effective rate for currency conversion: prefer cached rate if it matches the
  // invoice currency; use 1 (no conversion) otherwise.
  const rateForInvoice = useMemo(
    () => (defaultRate && currency !== defaultRate.baseCurrency && defaultRate.targetCurrency === currency && defaultRate.rate > 0 ? defaultRate.rate : 1),
    [currency, defaultRate]
  );

  const handleManualRateSubmit = useCallback((rate: number, note: string) => {
    if (isIssued) return;
    const manualMeta: RateMetadata = {
      source: 'manual',
      rate,
      baseCurrency: settings.baseCurrency,
      targetCurrency: currency,
      fetchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      provider: 'ecb_fallback',
      manualNote: note,
    };
    setDefaultRate(manualMeta);
    setCurrencyRates((prev) => ({ ...prev, [currency]: manualMeta }));
    setEcbRateError('');
  }, [settings.baseCurrency, currency, isIssued]);

  const handleCurrencySelect = useCallback((newCurrency: string) => {
    if (isIssued) return;
    const upper = newCurrency.toUpperCase() as CurrencyCode;
    const hasAmounts = lineItems.some((item) => item.quantity > 0 && item.rate > 0);
    if (!hasAmounts) {
      setCurrencyInternal(upper);
      setEcbRateError('');
      return;
    }
    setPreviousCurrency(currency);
    setCurrencyPreview(upper);
    setShowCurrencyDialog(true);
  }, [currency, isIssued, lineItems]);

  const handleCurrencyDialogClose = useCallback(() => {
    setCurrencyPreview(null);
    setShowCurrencyDialog(false);
    setPreviousCurrency(null);
  }, []);

  const dialogRate = useMemo(() => {
    if (!showCurrencyDialog || !currencyPreview || !previousCurrency) return null;
    if (previousCurrency === currencyPreview) return 1;
    if (defaultRate && defaultRate.targetCurrency === currencyPreview && defaultRate.baseCurrency === settings.baseCurrency && previousCurrency === settings.baseCurrency) {
      return defaultRate.rate;
    }
    if (defaultRate && defaultRate.baseCurrency === currencyPreview && defaultRate.targetCurrency === previousCurrency && previousCurrency === settings.baseCurrency) {
      return 1 / defaultRate.rate;
    }
    return null;
  }, [showCurrencyDialog, currencyPreview, previousCurrency, defaultRate, settings.baseCurrency]);

  const handleCurrencyConvert = useCallback(() => {
    if (!currencyPreview) return;
    setEcbRateError('');
    const rate = dialogRate;
    let converted = false;
    if (rate && rate > 0) {
      setLineItems((items) =>
        items.map((item) => {
          const currentTotal = item.quantity * item.rate;
          const convertedTotal = roundCurrency(convertAmount(currentTotal, previousCurrency!, currencyPreview, rate), currencyPreview);
          const newRate = item.quantity > 0 ? roundCurrency(convertedTotal / item.quantity, currencyPreview) : item.rate;
          const baseRate = defaultRate && defaultRate.targetCurrency === currencyPreview && defaultRate.rate > 0 ? 1 / defaultRate.rate : null;
          const baseAmount = baseRate
            ? roundCurrency(convertAmount(convertedTotal, currencyPreview, settings.baseCurrency, baseRate), settings.baseCurrency)
            : convertedTotal;
          return { ...item, rate: newRate, baseAmount };
        })
      );
      const rates = settings.perCurrencyTaxRates ?? {};
      const perCurrencyRate = rates[currencyPreview];
      let newEffectiveTaxRate: number;
      if (settings.perCurrencyTaxRate && perCurrencyRate !== undefined) {
        newEffectiveTaxRate = perCurrencyRate;
      } else {
        const previewRateForInvoice = defaultRate && currencyPreview !== defaultRate.baseCurrency && defaultRate.targetCurrency === currencyPreview && defaultRate.rate > 0 ? defaultRate.rate : 1;
        const convertedTax = convertAmount(settings.defaultTaxRate, settings.baseCurrency, currencyPreview, previewRateForInvoice);
        newEffectiveTaxRate = roundCurrency(convertedTax, currencyPreview);
      }
      setTaxRate(newEffectiveTaxRate);
      const convertedDeposit = roundCurrency(convertAmount(deposit, previousCurrency!, currencyPreview, rate), currencyPreview);
      setDeposit(convertedDeposit);
      converted = true;
    }
    if (converted) {
      setCurrencyInternal(currencyPreview);
    }
    setCurrencyPreview(null);
    setShowCurrencyDialog(false);
    setPreviousCurrency(null);
  }, [currencyPreview, dialogRate, previousCurrency, settings, defaultRate, setTaxRate, deposit]);

  const handleCurrencyReset = useCallback(() => {
    setLineItems((items) => items.map((item) => ({ ...item, quantity: 0, rate: 0 })));
    setDeposit(0);
    setCurrencyPreview(null);
    setShowCurrencyDialog(false);
    setPreviousCurrency(null);
  }, []);

  const dialogCurrentAmounts = useMemo(() => lineItems.map((item) => item.quantity * item.rate), [lineItems]);
  const dialogConvertedAmounts = useMemo(() => {
    if (!dialogRate || dialogRate <= 0 || !currencyPreview) {
      return lineItems.map(() => null);
    }
    return lineItems.map((item) => roundCurrency(item.quantity * item.rate * dialogRate, currencyPreview));
  }, [lineItems, dialogRate, currencyPreview]);

  const rateDisplay = ((): RateMetadata | null | 'loading' | 'error' => {
    if (currency === settings.baseCurrency) return null;
    if (isEcbrLoading) return 'loading';
    if (defaultRate && defaultRate.targetCurrency === currency && defaultRate.rate > 0) return defaultRate;
    return 'error';
  })();

  const handleRequestManualOverride = useCallback(() => {
    if (isIssued) return;
    setShowManualRateInput(true);
  }, [isIssued]);

  const handleRetryRate = useCallback(() => {
    if (isIssued) return;
    setShowManualRateInput(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bluecollr_exchange_rates_v2');
      localStorage.removeItem('bluecollr_rates_cache');
    }
    setRateFetchTrigger((t) => t + 1);
  }, [isIssued]);

  // AC1 + AC2: Effective tax rate honouring perCurrencyTaxRate flag.
  //   perCurrencyTaxRate=true  + map[currency] exists → use it directly (AC3).
  //   Otherwise → convert defaultTaxRate via convertAmount and roundCurrency (AC1/AC2).
  const effectiveTaxRate = useMemo(() => {
    const rates = settings.perCurrencyTaxRates ?? {};
    const perCurrencyRate = rates[currency];

    if (settings.perCurrencyTaxRate && perCurrencyRate !== undefined) {
      return perCurrencyRate;
    }

    const converted = convertAmount(settings.defaultTaxRate, settings.baseCurrency, currency, rateForInvoice);
    return roundCurrency(converted, currency);
  }, [settings, currency, rateForInvoice]);

  // Keep visible taxRate in sync when effectiveTaxRate changes automatically.
  useEffect(() => {
    if (isIssued) return;
    setTaxRate(effectiveTaxRate);
  }, [effectiveTaxRate, isIssued]);

  const updatePerCurrencyRate = useCallback((curr: CurrencyCode, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    setSettings((s) => ({
      ...s,
      perCurrencyTaxRates: { ...s.perCurrencyTaxRates, [curr]: num },
    }));
  }, []);

  const removePerCurrencyRate = useCallback((curr: CurrencyCode) => {
    setSettings((s) => {
      const next = { ...s.perCurrencyTaxRates };
      delete next[curr];
      return { ...s, perCurrencyTaxRates: next };
    });
  }, []);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const paymentStatus = usePaymentStatus();

  useEffect(() => {
    const draft = loadDraft<{
      company?: Partial<Estimate['company']>;
      client?: Partial<Estimate['client']>;
      lineItems?: LineItem[];
      notes?: string;
      taxRate?: number;
      deposit?: number;
      currency?: CurrencyCode;
      customerPreferredCurrency?: CurrencyCode;
      currencyRates?: Record<CurrencyCode, RateMetadata | null>;
      isIssued?: boolean;
      issuedAt?: string;
      frozenInvoiceCurrencyInfo?: InvoiceCurrencyInfo | null;
    }>();

    if (draft?.currencyRates && typeof draft.currencyRates === 'object') {
      const restoredRates = draft.currencyRates as Record<CurrencyCode, RateMetadata | null>;
      setCurrencyRates(restoredRates);
      // Restore the current currency's rate into defaultRate so manually-entered
      // rates aren't overwritten by the ECB fetch on mount.
      if (restoredRates[currency] && restoredRates[currency]!.rate > 0) {
        setDefaultRate(restoredRates[currency]);
      }
    }

    if (!draft) return;
    if (draft.company) {
      setCompanyName(draft.company.name ?? '');
      setCompanyPhone(draft.company.phone ?? '');
      setCompanyEmail(draft.company.email ?? '');
      setLogoDataUrl(draft.company.logoDataUrl ?? '');
    }
    if (draft.client) {
      setClientName(draft.client.name ?? '');
      setClientAddress(draft.client.address ?? '');
      setClientPhone(draft.client.phone ?? '');
      setClientEmail(draft.client.email ?? '');
    }
    if (draft.lineItems && draft.lineItems.length > 0) setLineItems(draft.lineItems);
    if (draft.isIssued && draft.frozenInvoiceCurrencyInfo) {
      if (validateInvoiceCurrencyInfo(draft.frozenInvoiceCurrencyInfo)) {
        setIsIssued(true);
        if (draft.issuedAt) setIssuedAt(draft.issuedAt);
        setFrozenInvoiceCurrencyInfo(draft.frozenInvoiceCurrencyInfo);
      } else {
        setHydrationWarning('Invoice record missing or corrupted — draft restored as editable.');
        // Clear the stale isIssued flag from the persisted draft so it cannot
        // re-trigger on the next load.
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            if ('isIssued' in parsed) {
              delete (parsed as Record<string, unknown>).isIssued;
              localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
            }
          }
        } catch { /* ignore */ }
      }
    }
    if (draft.notes !== undefined) setNotes(draft.notes);
    // Removed per-currency fallback branch: draft taxRate is stored as the rate that
    // was effective at save time; effectiveTaxRate keeps it in sync with current settings.
    if (draft.taxRate !== undefined) setTaxRate(draft.taxRate);
    if (draft.deposit !== undefined) setDeposit(draft.deposit);
    if (draft.customerPreferredCurrency && validCurrency(draft.customerPreferredCurrency)) {
      setCurrencyInternal(draft.customerPreferredCurrency);
    } else if (draft.currency && validCurrency(draft.currency)) {
      setCurrencyInternal(draft.currency);
    } else if (draft.currency) {
      setEcbRateError('We updated estimate formats. Please re-select your currency.');
      setCurrencyInternal(settings.baseCurrency);
    }
    setDraftRestored(true);
  }, [settings.baseCurrency]);

  useEffect(() => {
    if (!draftRestored) return;
    setShowRestoredNotice(true);
    const timeout = setTimeout(() => setShowRestoredNotice(false), 3000);
    return () => clearTimeout(timeout);
  }, [draftRestored]);

  // Autosave only editable form data. isIssued / frozenInvoiceCurrencyInfo are
  // issued-state artifacts written by handleIssueInvoice; including them here
  // corrupts the draft so that reloading sets isIssued=true before the user
  // has touched anything, which breaks the tax-settings toggle (and all other
  // !isIssued-gated UI) on page load.
  const autosavePayload = useMemo(
    () => ({
      company: { name: companyName, phone: companyPhone, email: companyEmail },
      client: { name: clientName, address: clientAddress, phone: clientPhone, email: clientEmail },
      lineItems,
      notes,
      taxRate,
      deposit,
      currency,
      currencyRates,
    }),
    [companyName, companyPhone, companyEmail, clientName, clientAddress, clientPhone, clientEmail, lineItems, notes, taxRate, deposit, currency, currencyRates]
  );

  const { status: saveStatus } = useAutoSave('bluecollr_draft', autosavePayload);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const MAX_LOGO_BYTES = 500 * 1024;
      if (file.size > MAX_LOGO_BYTES) {
        const kb = (file.size / 1024).toFixed(1);
        const mb = (file.size / (1024 * 1024)).toFixed(2);
        setTimeout(() => setEcbRateError(`Logo must be under 500 KB. Current file: ${kb} KB (${mb} MB).`), 0);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { setLogoDataUrl(reader.result as string); };
      reader.readAsDataURL(file);
    },
    []
  );

  const addLineItem = () => setLineItems((items) => [...items, { ...emptyLineItem }]);
  const removeLineItem = (id: string) => setLineItems((items) => items.filter((item) => item.id !== id));

  // Invariant: defaultRate is fetched as baseCurrency → targetCurrency. We only use it
  // when the cached pair EXACTLY matches (baseCurrency, invoiceCurrency); otherwise
  // defaultRate would represent the wrong cross-rate for this invoice currency.
  const computeBaseAmount = useCallback((invoiceAmount: number, invoiceCurrency: CurrencyCode) => {
    const baseCurrency = settings.baseCurrency;
    if (invoiceCurrency === baseCurrency || !Number.isFinite(invoiceAmount)) return invoiceAmount;
    const inverseRate = defaultRate && defaultRate.targetCurrency === invoiceCurrency && defaultRate.rate > 0
      ? 1 / defaultRate.rate
      : null;
    if (!inverseRate) return invoiceAmount;
    return roundCurrency(convertAmount(invoiceAmount, invoiceCurrency, baseCurrency, inverseRate), baseCurrency);
  }, [settings.baseCurrency, defaultRate]);

  const getCurrencyDecimals = useCallback((code: CurrencyCode): number => {
    const entry = getAllCurrencies().find((c) => c.code === code);
    return entry?.rounding?.decimals ?? entry?.decimalDigits ?? 2;
  }, []);

  const lineItemStep = getCurrencyDecimals(currency) === 0 ? 1 : 0.01;

  const validateLineItemField = useCallback((id: string, field: 'quantity' | 'rate', value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      setLineItemErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: 'Value cannot be negative' },
      }));
    } else {
      setLineItemErrors((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id][field];
          if (Object.keys(next[id]).length === 0) delete next[id];
        }
        return next;
      });
    }
  }, []);

  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    setLineItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      if (patch.quantity !== undefined && (!Number.isFinite(patch.quantity) || patch.quantity < 0)) merged.quantity = 0;
      if (patch.rate !== undefined && (!Number.isFinite(patch.rate) || patch.rate < 0)) merged.rate = 0;
      const lineTotal = merged.quantity * merged.rate;
      const baseAmount = computeBaseAmount(lineTotal, currency);
      return { ...merged, baseAmount };
    }));
  };

  // Clear the empty-line-item guard reactively once the user adds content.
  useEffect(() => {
    if (lineItems.some((li) => li.quantity !== 0 || li.rate !== 0)) {
      setEcbRateError((prev) => prev === 'Add at least one line item before generating a PDF.' ? '' : prev);
    }
  }, [lineItems]);

  // AC3: Build InvoiceCurrencyInfo snapshot. All amounts in invoice currency;
  // baseAmount reflects the true base-currency equivalent (inverse rate when applicable).
  // For issued invoices, return the frozen snapshot directly — never derive from live state.
  const invoiceCurrencyInfo: InvoiceCurrencyInfo | null = useMemo(() => {
    if (isIssued && frozenInvoiceCurrencyInfo) return frozenInvoiceCurrencyInfo;
    if (!currency) return null;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = roundCurrency(subtotal * (taxRate / 100), currency);
    const depositRounded = roundCurrency(deposit, currency);
    const total = subtotal + tax - depositRounded;

    const baseRate =
      currency === settings.baseCurrency
        ? 1
        : defaultRate && defaultRate.targetCurrency === currency && defaultRate.rate > 0
          ? 1 / defaultRate.rate
          : 1;

    const baseSubtotal = convertAmount(subtotal, currency, settings.baseCurrency, baseRate);
    const baseTax = convertAmount(tax, currency, settings.baseCurrency, baseRate);
    const baseDeposit = convertAmount(depositRounded, currency, settings.baseCurrency, baseRate);
    const baseTotal = convertAmount(total, currency, settings.baseCurrency, baseRate);

    return {
      currency,
      rate: defaultRate,
      amounts: {
        lineItems: lineItems.map((item) => {
          const lineTotal = item.quantity * item.rate;
          const baseLineTotal = convertAmount(lineTotal, currency, settings.baseCurrency, baseRate);
          return { baseAmount: roundCurrency(baseLineTotal, settings.baseCurrency), convertedAmount: lineTotal };
        }),
        subtotal: { baseAmount: baseSubtotal, convertedAmount: subtotal },
        tax: { baseAmount: baseTax, convertedAmount: tax },
        deposit: { baseAmount: baseDeposit, convertedAmount: depositRounded },
        total: { baseAmount: baseTotal, convertedAmount: total },
      },
    };
  }, [isIssued, frozenInvoiceCurrencyInfo, currency, lineItems, taxRate, deposit, defaultRate, settings.baseCurrency]);

  const handleGeneratePdf = async () => {
    const isEmptyEstimate = lineItems.every((li) => li.quantity === 0 && li.rate === 0);
    if (isEmptyEstimate) {
      setEcbRateError('Add at least one line item before generating a PDF.');
      return;
    }
    setEcbRateError('');
    setGenerating(true);
    const previewEl = document.getElementById('pdf-preview');
    if (!previewEl) { setGenerating(false); return; }
    const opt = {
      margin: 0,
      filename: 'estimate-' + Date.now() + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, foreignObjectRendering: true, onclone: (clonedDoc: Document) => {
        const view = clonedDoc.defaultView;
        if (!view) return;
        const original = view.CSS.supports;
        view.CSS.supports = (...args: unknown[]) => {
          const prop = typeof args[0] === 'string' ? args[0] : '';
          const val = typeof args[1] === 'string' ? args[1] : '';
          if (prop.includes('color') || val.includes('lab') || val.includes('oklab')) return false;
          return (original as (...a: unknown[]) => boolean).apply(view.CSS, args);
        };
      } },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    };
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(previewEl).save();
    } catch {
      // PDF generation failed — shown via UI feedback.
      setGenerating(false);
    } finally {
      setGenerating(false);
    }
  };

  const estimate: Estimate = {
    company: { name: companyName, phone: companyPhone, email: companyEmail, logoDataUrl },
    client: { name: clientName, address: clientAddress, phone: clientPhone, email: clientEmail },
    lineItems,
    notes,
    taxRate,
    deposit,
    currency,
    invoiceCurrencyInfo,
    isIssued,
    issuedAt,
  };

  // AC1: Clicking Issue Invoice sets isIssued=true, captures issuedAt, and freezes all
  // monetary values in InvoiceCurrencyInfo (Object.freeze makes it non-extensible in strict mode).
  // Also persist the issued invoice to the localStorage-backed issued invoices list so
  // AnalyticsView can display the full history.
  const handleIssueInvoice = useCallback(() => {
    const isEmptyEstimate = lineItems.every((li) => li.quantity === 0 && li.rate === 0);
    if (isEmptyEstimate) {
      setEcbRateError('Add at least one line item before generating a PDF.');
      return;
    }
    setEcbRateError('');
    if (isIssued) return;
    const frozenLineItems = invoiceCurrencyInfo!.amounts.lineItems.map((li) => Object.freeze({ ...li }));
    const frozenAmounts = Object.freeze({ ...invoiceCurrencyInfo!.amounts, lineItems: frozenLineItems });
    const frozen = Object.freeze({ ...invoiceCurrencyInfo!, amounts: frozenAmounts }) as InvoiceCurrencyInfo;
    setFrozenInvoiceCurrencyInfo(frozen);
    setIssuedAt(new Date().toISOString());
    setIsIssued(true);
    const issuedEstimate: Estimate = {
      ...estimate,
      isIssued: true,
      issuedAt: new Date().toISOString(),
      invoiceCurrencyInfo: frozen,
    };
    setIssuedInvoices((prev) => [...prev, issuedEstimate]);
  }, [invoiceCurrencyInfo, isIssued, estimate]);

  const statusLabel = saveStatus === 'error' ? 'Storage full - save failed.'
    : showRestoredNotice ? 'Draft restored'
    : saveStatus === 'saved' ? 'Auto-saved'
    : 'Saved automatically to this browser.';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">BlueCollr</h1>
              <p className="mt-2 text-base sm:text-lg text-gray-700">Professional estimates for trade contractors.</p>
              <p className="mt-1 text-base text-gray-600">Mobile-friendly quoting you can use right from the job site.</p>
            </div>
            <div className="flex items-center gap-2" role="tablist" aria-label="View mode">
              <button
                type="button"
                role="tab"
                title="Estimate view"
                aria-selected={!analytics}
                onClick={() => setAnalytics(false)}
                className={`h-10 px-4 rounded text-base font-semibold border ${!analytics ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Estimate
              </button>
              <button
                type="button"
                role="tab"
                title="Analytics view"
                aria-selected={analytics}
                onClick={() => setAnalytics(true)}
                className={`h-10 px-4 rounded text-base font-semibold border ${analytics ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Analytics
              </button>
            </div>
          </div>
        </header>

        {paymentStatus.status === 'success' && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <p className="text-base font-medium text-green-800">Payment confirmed. Your Pro unlock is complete.</p>
            </div>
          </div>
        )}

        {paymentStatus.status === 'canceled' && (
          <div className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <p className="text-base font-medium text-gray-700">Payment canceled. No charge was made.</p>
              </div>
              <button
                type="button"
                onClick={() => { paymentStatus.reset?.(); }}
                className="h-9 shrink-0 rounded border border-gray-300 bg-white px-3 text-base font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                aria-label="Dismiss canceled payment notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {hydrationWarning && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-base font-medium text-blue-800">{hydrationWarning}</p>
              </div>
              <button
                type="button"
                onClick={() => setHydrationWarning('')}
                className="h-9 shrink-0 rounded border border-blue-300 bg-blue-50 px-3 text-base font-medium text-blue-800 hover:bg-blue-100 active:scale-[0.98]"
                aria-label="Dismiss notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {isIssued && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-300 p-4" role="status" aria-live="polite">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <p className="text-base font-semibold text-amber-900">This invoice is issued — values are locked and cannot be changed.</p>
                <span className="ml-auto inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-800 border border-amber-200">Issued</span>
              </div>
              {issuedAt && (
                <p className="text-sm text-amber-700 ml-8">Issued on {new Date(issuedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {settingsSyncError && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-300 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-base font-medium text-amber-800">{settingsSyncError}</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsSyncError('')}
                className="h-9 shrink-0 rounded border border-amber-300 bg-amber-50 px-3 text-base font-medium text-amber-800 hover:bg-amber-100 active:scale-[0.98]"
                aria-label="Dismiss settings sync notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {analytics ? (
          <AnalyticsView estimates={issuedInvoices} baseCurrency={settings.baseCurrency} />
        ) : (
          <>
            <form className="space-y-6 sm:space-y-8" onSubmit={(e) => { e.preventDefault(); handleGeneratePdf(); }}>
              <section className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Company Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Company Name"><input title="Your business name shown on the estimate" disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
              <Field label="Phone"><input disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></Field>
              <Field label="Email"><input disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} /></Field>
            </div>
            <div className="mt-4">
              <Field label="Logo">
                <label className={`flex h-12 w-full items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-center text-base font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 ${isIssued ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <span className="truncate px-2">{logoDataUrl ? 'Change logo image' : 'Choose a logo image'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" disabled={isIssued} />
                </label>
              </Field>
              {logoDataUrl && <div className="mt-3"><img src={logoDataUrl} alt="Logo preview" className="h-16 w-16 object-contain border rounded" /></div>}
              {ecbRateError && ecbRateError.startsWith('Logo must be under') && (
                <p className="mt-2 text-sm text-red-600" role="alert">{ecbRateError}</p>
              )}
            </div>
            <div className="mt-4">
              <CurrencySelector
                value={showCurrencyDialog ? currencyPreview ?? currency : currency}
                onChange={handleCurrencySelect}
                id="estimate-currency"
                error={ecbRateError}
                disabled={isIssued}
                previewValue={showCurrencyDialog ? currencyPreview ?? undefined : undefined}
                allowCustomInput
              />
            </div>
            {!isIssued && currency !== settings.baseCurrency && (
              <RateDisplay
                rate={rateDisplay}
                onRequestManualOverride={handleRequestManualOverride}
                onRetry={handleRetryRate}
              />
            )}
            {!isIssued && showManualRateInput && (
              <RateOverrideModal
                isOpen={showManualRateInput}
                baseCurrency={settings.baseCurrency}
                targetCurrency={currency}
                fetchError={ecbRateError}
                onClose={() => setShowManualRateInput(false)}
                onSubmit={handleManualRateSubmit}
              />
            )}

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBaseCurrencyEquivalent}
                  onChange={(e) => setSettings((s) => ({ ...s, showBaseCurrencyEquivalent: e.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-base text-gray-800">Show base-currency equivalent ({settings.baseCurrency})</span>
              </label>
            </div>

            <div className="mt-4">
              {!isIssued && (
                <button title="Configure tax rates for this estimate" type="button" onClick={() => setShowTaxSettings((v) => !v)} className="text-base font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2" aria-expanded={showTaxSettings} aria-controls="tax-settings-panel">
                  {showTaxSettings ? 'Hide' : 'Show'} tax rate settings
                </button>
              )}
              {!isIssued && showTaxSettings && (
                <div id="tax-settings-panel" className="mt-4 space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <fieldset className="border-0 p-0 m-0">
                    <legend className="text-base font-medium text-gray-700 mb-2">Tax rate configuration</legend>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={settings.perCurrencyTaxRate} onChange={(e) => setSettings((s) => ({ ...s, perCurrencyTaxRate: e.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-base text-gray-800">Use per-currency tax rates</span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">When enabled, set a custom tax rate for each currency below. When disabled, the base tax rate is converted via the current exchange rate and rounded before applying to invoice-currency subtotals.</p>
                  </fieldset>
                  {settings.perCurrencyTaxRate && (
                    <fieldset className="border-0 p-0 m-0">
                      <legend className="text-base font-medium text-gray-700 mb-2">Per-currency tax rates (%)</legend>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {getActiveCurrencies().map((currency) => {
                          const current = settings.perCurrencyTaxRates[currency.code];
                          return (
                            <div key={currency.code} className="flex items-center gap-2">
                              <label htmlFor={"tax-rate-" + currency.code} className="text-base text-gray-700 w-28 shrink-0">{currency.code} - {currency.name}</label>
                              <input id={"tax-rate-" + currency.code} type="number" min="0" step="0.1" value={current ?? ''} onChange={(e) => updatePerCurrencyRate(currency.code, e.target.value)} placeholder="-" className="h-10 w-24 rounded border border-gray-300 px-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              {current !== undefined && <button title={"Remove " + currency.code + " tax rate"} type="button" onClick={() => removePerCurrencyRate(currency.code)} aria-label={"Remove tax rate override for " + currency.code} className="h-10 w-10 shrink-0 rounded border border-red-200 bg-red-50 text-base font-semibold text-red-700 hover:bg-red-100 active:scale-[0.98]">x</button>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Leave blank to fall back to the converted base tax rate for that currency.</p>
                    </fieldset>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Client Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Client Name"><input title="Customer name for this estimate" disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={clientName} onChange={(e) => setClientName(e.target.value)} /></Field>
              <Field label="Address"><input disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></Field>
              <Field label="Client Phone"><input disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} /></Field>
              <Field label="Client Email"><input disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></Field>
            </div>
          </section>

          <section className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Line Items</h2>
              {!isIssued && <button title="Add new line item" type="button" onClick={addLineItem} className="h-12 w-full sm:w-auto rounded bg-blue-600 px-4 text-base font-semibold text-white hover:bg-blue-700 active:scale-[0.98]">Add Item</button>}
            </div>
            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_96px_96px_auto_auto] sm:items-center">
                  <Field label="Description"><input title="Service or material description" disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={item.description} onChange={(e) => updateLineItem(item.id, { description: e.target.value })} placeholder="Service or material" /></Field>
                  <Field label="Qty">
                    <input
                      title="Number of units"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="number"
                      min="0"
                      step={lineItemStep}
                      disabled={isIssued}
                      className="h-12 w-full rounded border border-gray-300 px-3 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isFinite(val)) return;
                        validateLineItemField(item.id, 'quantity', val);
                        updateLineItem(item.id, { quantity: val });
                      }}
                      onBlur={() => {
                        if (item.quantity < 0) updateLineItem(item.id, { quantity: 0 });
                      }}
                      aria-invalid={!!lineItemErrors[item.id]?.quantity}
                      aria-describedby={lineItemErrors[item.id]?.quantity ? 'error-' + item.id + '-qty' : undefined}
                    />
                    {lineItemErrors[item.id]?.quantity && (
                      <p id={'error-' + item.id + '-qty'} className="mt-1 text-sm text-red-600" aria-live="assertive">
                        {lineItemErrors[item.id].quantity}
                      </p>
                    )}
                  </Field>
                  <Field label="Rate">
                    <input
                      title="Price per unit in invoice currency"
                      inputMode="decimal"
                      type="number"
                      min="0"
                      step={lineItemStep}
                      disabled={isIssued}
                      className="h-12 w-full rounded border border-gray-300 px-3 text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                      value={item.rate}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isFinite(val)) return;
                        validateLineItemField(item.id, 'rate', val);
                        updateLineItem(item.id, { rate: val });
                      }}
                      onBlur={() => {
                        if (item.rate < 0) updateLineItem(item.id, { rate: 0 });
                      }}
                      aria-invalid={!!lineItemErrors[item.id]?.rate}
                      aria-describedby={lineItemErrors[item.id]?.rate ? 'error-' + item.id + '-rate' : undefined}
                    />
                    {lineItemErrors[item.id]?.rate && (
                      <p id={'error-' + item.id + '-rate'} className="mt-1 text-sm text-red-600" aria-live="assertive">
                        {lineItemErrors[item.id].rate}
                      </p>
                    )}
                  </Field>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-gray-900">{formatCurrency(item.quantity * item.rate, currency)}</span>
                    {!isIssued && lineItems.length > 1 && <button type="button" onClick={() => removeLineItem(item.id)} aria-label={"Remove line item " + (idx + 1)} className="h-12 w-12 flex-shrink-0 rounded border border-red-200 bg-red-50 px-3 text-base font-semibold text-red-700 hover:bg-red-100 active:scale-[0.98]">Remove</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
            <div className="space-y-4">
              <Field label="Notes"><textarea disabled={isIssued} className="h-28 sm:h-auto min-h-[6.5rem] w-full rounded border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={"Tax Rate (%) - effective: " + effectiveTaxRate.toFixed(2) + "%"}>
                  <input inputMode="decimal" type="number" min="0" step="0.1" disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                </Field>
                <Field label={"Deposit (" + currency + ")"}>
                  <input inputMode="decimal" type="number" min="0" step="0.01" disabled={isIssued} className="h-12 w-full rounded border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
                </Field>
              </div>
            </div>
          </section>

          <section className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-base text-gray-600" aria-live="polite">{statusLabel}</div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold border ${isIssued ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`} aria-label={isIssued ? 'Status: Issued' : 'Status: Draft'}>{isIssued ? 'Issued' : 'Draft'}</span>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
              {!isIssued && (
                <button title="Lock and issue this estimate" type="button" onClick={handleIssueInvoice} className="h-12 w-full sm:w-auto rounded bg-amber-500 px-5 text-base font-semibold text-white hover:bg-amber-600 active:scale-[0.98]">Issue Invoice</button>
              )}
              <button title="Download estimate as PDF file" type="submit" disabled={generating} className="h-12 w-full sm:w-auto rounded bg-blue-600 px-6 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98]">{generating ? 'Generating PDF...' : 'Generate PDF'}</button>
            </div>
          </section>
        </form>

        <section className="mt-10 sm:mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Live Preview</h2>
            <button onClick={() => setShowPaymentModal(true)} title="Upgrade to Pro version" className="h-10 px-4 rounded bg-amber-500 text-white text-base font-semibold hover:bg-amber-600 active:scale-[0.98]" type="button">Upgrade to Pro - {formatCurrency(49, currency)}</button>
          </div>
          <div className="rounded-md sm:rounded-lg border border-gray-200 bg-white">
            {mounted && (
              <PdfPreview estimate={estimate} businessSettings={settings} frozenSnapshot={isIssued ? frozenInvoiceCurrencyInfo : null} />
            )}
          </div>
        </section>
          </>
        )}
      </div>
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} prefilledEmail={companyEmail} currency={currency} />
      <CurrencyChangeDialog
        isOpen={showCurrencyDialog}
        onClose={handleCurrencyDialogClose}
        currencyFrom={previousCurrency ?? currency}
        currencyTo={currencyPreview ?? currency}
        currentAmounts={dialogCurrentAmounts}
        convertedAmounts={dialogConvertedAmounts}
        currentSubtotal={lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0)}
        rate={dialogRate}
        rateError={ecbRateError}
        isLoadingRate={isEcbrLoading}
        isIssued={isIssued}
        onConvert={handleCurrencyConvert}
        onReset={handleCurrencyReset}
      />
    </main>
  );
}
