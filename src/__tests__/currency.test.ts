import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  convertCurrencyAmount, 
  detectCurrencyCodeFromText, 
  getCurrencySymbol, 
  fetchLiveExchangeRates,
  CURRENCY_LIST,
  DEFAULT_USD_RATES
} from '../utils/currency';

describe('currency utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('convertCurrencyAmount', () => {
    it('returns original amount when from and to currencies match', () => {
      const result = convertCurrencyAmount(100, 'USD', 'USD');
      expect(result.convertedValue).toBe(100);
      expect(result.exchangeRate).toBe(1.0);
    });

    it('correctly converts USD to EUR using default rates', () => {
      const result = convertCurrencyAmount(100, 'USD', 'EUR');
      // 100 * 0.922 = 92.2
      expect(result.convertedValue).toBe(92.2);
      expect(result.exchangeRate).toBe(0.922);
    });

    it('correctly converts non-USD to non-USD currencies', () => {
      // EUR (0.922) to GBP (0.781)
      const result = convertCurrencyAmount(100, 'EUR', 'GBP');
      const expectedRate = 0.781 / 0.922;
      const expectedValue = Math.round(100 * expectedRate * 100) / 100;
      expect(result.convertedValue).toBe(expectedValue);
    });

    it('handles case-insensitivity in currency codes', () => {
      const result = convertCurrencyAmount(50, 'usd', 'eur');
      expect(result.convertedValue).toBe(46.1);
    });
  });

  describe('detectCurrencyCodeFromText', () => {
    it('detects EUR from symbol €', () => {
      expect(detectCurrencyCodeFromText('Price in €')).toBe('EUR');
    });

    it('detects GBP from symbol £', () => {
      expect(detectCurrencyCodeFromText('Total (£)')).toBe('GBP');
    });

    it('detects INR from ₹', () => {
      expect(detectCurrencyCodeFromText('Value ₹5000')).toBe('INR');
    });

    it('detects currency from ISO code in text', () => {
      expect(detectCurrencyCodeFromText('Account balance in CAD')).toBe('CAD');
      expect(detectCurrencyCodeFromText('Checking JPY account')).toBe('JPY');
    });

    it('returns null for plain text without currency identifiers', () => {
      expect(detectCurrencyCodeFromText('Simple account balance')).toBeNull();
    });
  });

  describe('getCurrencySymbol', () => {
    it('returns correct symbols for known currency codes', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
      expect(getCurrencySymbol('CAD')).toBe('CA$');
    });

    it('defaults to $ for unknown currency codes', () => {
      expect(getCurrencySymbol('XYZ')).toBe('$');
    });
  });

  describe('fetchLiveExchangeRates', () => {
    it('falls back to default rates if network fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      const result = await fetchLiveExchangeRates('USD');
      expect(result.isLive).toBe(false);
      expect(result.rates).toEqual(DEFAULT_USD_RATES);
    });

    it('uses cached rates if present in localStorage', async () => {
      const cachedData = {
        base: 'USD',
        rates: { USD: 1.0, EUR: 0.95 },
        timestamp: Date.now() - 1000,
      };
      localStorage.setItem('fx_rates_USD', JSON.stringify(cachedData));

      const result = await fetchLiveExchangeRates('USD');
      expect(result.isLive).toBe(true);
      expect(result.rates.EUR).toBe(0.95);
    });
  });
});
