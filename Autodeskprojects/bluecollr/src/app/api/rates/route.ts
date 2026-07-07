import { NextResponse, type NextRequest } from 'next/server';
import type { RateCacheEntry, RateProvider } from '@/utils/exchangeRates';
import { FrankfurterRateProvider } from '@/utils/exchangeRates';
import { computeRate } from '@/utils/currency';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// In-memory server-side cache keyed by from-currency (base of provider call).
// Stores the raw entry plus the epoch ms at which it expires.
const serverCache = new Map<string, { entry: RateCacheEntry; expires: number }>();

const provider: RateProvider = new FrankfurterRateProvider();

function getCached(base: string): { entry: RateCacheEntry; expires: number } | null {
  const cached = serverCache.get(base);
  if (!cached) return null;
  return cached;
}

function setCached(base: string, entry: RateCacheEntry): void {
  serverCache.set(base, {
    entry,
    expires: Date.now() + CACHE_TTL_MS,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const rawFrom = searchParams.get('from');
  const rawTo = searchParams.get('to');
  const from = (rawFrom && rawFrom.trim().toUpperCase()) || '';
  const to = (rawTo && rawTo.trim().toUpperCase()) || '';

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json(
      { error: 'Missing or invalid query parameters. Usage: ?from=USD&to=EUR (3-letter ISO codes).' },
      { status: 400 }
    );
  }

  const cached = getCached(from);

  // Return fresh cache when available.
  if (cached && cached.expires > Date.now()) {
    const rate = computeRate(cached.entry, from, to);
    return NextResponse.json({
      rate,
      source: cached.entry.source,
      fetchedAt: cached.entry.fetchedAt,
      expiresAt: cached.entry.expiresAt,
    });
  }

  // Try to fetch fresh data.
  try {
    const entry = await provider.fetchRates(from);
    setCached(from, entry);

    const rate = computeRate(entry, from, to);
    return NextResponse.json({
      rate,
      source: entry.source,
      fetchedAt: entry.fetchedAt,
      expiresAt: entry.expiresAt,
    });
  } catch (err) {
    // If provider is down but stale cache exists, serve stale data with a non-200 status.
    if (cached) {
      const rate = computeRate(cached.entry, from, to);
      return NextResponse.json(
        {
          rate,
          source: cached.entry.source,
          fetchedAt: cached.entry.fetchedAt,
          expiresAt: cached.entry.expiresAt,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch exchange rates.' }, { status: 500 });
  }
}
