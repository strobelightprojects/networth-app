export type ExtendedCurrencyCode = 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CAD' 
  | 'AUD' 
  | 'JPY' 
  | 'CHF' 
  | 'INR' 
  | 'SGD' 
  | 'MXN' 
  | 'BRL' 
  | 'CNY' 
  | 'HKD' 
  | 'NZD' 
  | 'SEK';

export interface CurrencyDetails {
  code: ExtendedCurrencyCode;
  name: string;
  symbol: string;
  flag: string;
}

export const CURRENCY_LIST: CurrencyDetails[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SG$', flag: '🇸🇬' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
];

// Fallback rates relative to USD (USD = 1)
export const DEFAULT_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.922,
  GBP: 0.781,
  CAD: 1.365,
  AUD: 1.522,
  JPY: 154.8,
  CHF: 0.895,
  INR: 83.5,
  SGD: 1.348,
  MXN: 18.25,
  BRL: 5.42,
  CNY: 7.26,
  HKD: 7.81,
  NZD: 1.64,
  SEK: 10.45,
};

let liveRatesCache: { base: string; rates: Record<string, number>; timestamp: number } | null = null;

/**
 * Fetch real-time exchange rates with USD as baseline (or custom base)
 */
export async function fetchLiveExchangeRates(base: string = 'USD'): Promise<{
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  isLive: boolean;
}> {
  const now = Date.now();
  
  // Check memory cache (valid for 10 minutes)
  if (liveRatesCache && liveRatesCache.base === base && (now - liveRatesCache.timestamp) < 600000) {
    return {
      base: liveRatesCache.base,
      rates: liveRatesCache.rates,
      lastUpdated: new Date(liveRatesCache.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: true,
    };
  }

  // Check localStorage cache
  try {
    const local = localStorage.getItem(`fx_rates_${base}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.timestamp && (now - parsed.timestamp) < 600000 && parsed.rates) {
        liveRatesCache = parsed;
        return {
          base: parsed.base,
          rates: parsed.rates,
          lastUpdated: new Date(parsed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }
  } catch (e) {
    console.warn('localStorage FX rate read error', e);
  }

  // Attempt live network fetch
  try {
    const res = await fetch(`/api/exchange-rates?base=${encodeURIComponent(base)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        const cacheObj = {
          base: data.base || base,
          rates: data.rates,
          timestamp: now,
        };
        liveRatesCache = cacheObj;
        try {
          localStorage.setItem(`fx_rates_${base}`, JSON.stringify(cacheObj));
        } catch {}
        
        return {
          base: data.base || base,
          rates: data.rates,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live FX rates from backend API, falling back to client fetch', err);
  }

  // Direct client fetch fallback to open exchange rate API
  try {
    const clientRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    if (clientRes.ok) {
      const data = await clientRes.json();
      if (data && data.rates) {
        const cacheObj = {
          base: data.base_code || base,
          rates: data.rates,
          timestamp: now,
        };
        liveRatesCache = cacheObj;
        try {
          localStorage.setItem(`fx_rates_${base}`, JSON.stringify(cacheObj));
        } catch {}

        return {
          base: data.base_code || base,
          rates: data.rates,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLive: true,
        };
      }
    }
  } catch (err2) {
    console.warn('Direct FX API fetch failed, using default rates', err2);
  }

  // Fallback default
  return {
    base,
    rates: DEFAULT_USD_RATES,
    lastUpdated: 'Fallback default',
    isLive: false,
  };
}

/**
 * Convert an amount from one currency to another using provided rates
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = DEFAULT_USD_RATES
): { convertedValue: number; exchangeRate: number } {
  const fromUpper = (fromCurrency || 'USD').toUpperCase();
  const toUpper = (toCurrency || 'USD').toUpperCase();

  if (fromUpper === toUpper) {
    return { convertedValue: amount, exchangeRate: 1.0 };
  }

  // Get rates relative to USD baseline
  const fromRateInUSD = rates[fromUpper] || DEFAULT_USD_RATES[fromUpper] || 1.0;
  const toRateInUSD = rates[toUpper] || DEFAULT_USD_RATES[toUpper] || 1.0;

  // Amount in USD = amount / fromRateInUSD
  // Amount in target = (amount / fromRateInUSD) * toRateInUSD
  const exchangeRate = toRateInUSD / fromRateInUSD;
  const convertedValue = amount * exchangeRate;

  return {
    convertedValue: Math.round(convertedValue * 100) / 100,
    exchangeRate: Math.round(exchangeRate * 100000) / 100000,
  };
}

/**
 * Detect currency from string or cell header
 */
export function detectCurrencyCodeFromText(text: string): ExtendedCurrencyCode | null {
  if (!text) return null;
  const upper = text.toUpperCase().trim();

  // Check explicit ISO codes
  for (const c of CURRENCY_LIST) {
    if (upper.includes(c.code)) return c.code;
  }

  // Check currency symbols
  if (text.includes('€')) return 'EUR';
  if (text.includes('£')) return 'GBP';
  if (text.includes('¥')) return upper.includes('CNY') || text.includes('元') ? 'CNY' : 'JPY';
  if (text.includes('CA$') || text.includes('CAD')) return 'CAD';
  if (text.includes('A$') || text.includes('AUD')) return 'AUD';
  if (text.includes('₹')) return 'INR';
  if (text.includes('R$')) return 'BRL';
  if (text.includes('MX$')) return 'MXN';
  if (text.includes('CHF')) return 'CHF';
  if (text.includes('SG$') || text.includes('SGD')) return 'SGD';

  return null;
}

export function getCurrencySymbol(code: string): string {
  const item = CURRENCY_LIST.find((c) => c.code === code.toUpperCase());
  return item ? item.symbol : '$';
}
