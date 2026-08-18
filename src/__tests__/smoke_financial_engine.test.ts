import { describe, it, expect } from 'vitest';
import { getMostRecentItems, groupAccountHistory } from '../utils/itemHelpers';
import { convertCurrencyAmount, DEFAULT_USD_RATES } from '../utils/currency';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { FinancialItem } from '../types';

describe('Smoke Financial Calculation & Currency Engine', () => {
  it('smoke tests high-volume multi-currency asset liability net worth math', () => {
    const items: FinancialItem[] = [
      { id: '1', name: 'US Brokerage', type: 'asset', category: 'Stocks & ETFs', value: 1000000, currency: 'USD', lastUpdated: '2024-01-01' },
      { id: '2', name: 'London Flat', type: 'asset', category: 'Real Estate', value: 500000, currency: 'GBP', lastUpdated: '2024-01-01' },
      { id: '3', name: 'Swiss Cash', type: 'asset', category: 'Cash & Savings', value: 200000, currency: 'CHF', lastUpdated: '2024-01-01' },
      { id: '4', name: 'Mortgage UK', type: 'liability', category: 'Mortgage', value: 300000, currency: 'GBP', lastUpdated: '2024-01-01' },
      { id: '5', name: 'US Auto Loan', type: 'liability', category: 'Auto Loan', value: 25000, currency: 'USD', lastUpdated: '2024-01-01' },
      { id: '6', name: 'Whole Life Policy', type: 'insurance', category: 'Whole Life Insurance', value: 1000000, currency: 'USD', lastUpdated: '2024-01-01' },
    ];

    const activeItems = getMostRecentItems(items);
    expect(activeItems.length).toBe(6);

    const totalAssetsUSD = activeItems
      .filter((i) => i.type === 'asset')
      .reduce((sum, i) => sum + convertCurrencyAmount(i.value, i.currency, 'USD', DEFAULT_USD_RATES).convertedValue, 0);

    const totalLiabilitiesUSD = activeItems
      .filter((i) => i.type === 'liability')
      .reduce((sum, i) => sum + convertCurrencyAmount(i.value, i.currency, 'USD', DEFAULT_USD_RATES).convertedValue, 0);

    const netWorthUSD = totalAssetsUSD - totalLiabilitiesUSD;

    expect(totalAssetsUSD).toBeGreaterThan(1500000);
    expect(totalLiabilitiesUSD).toBeGreaterThan(300000);
    expect(netWorthUSD).toBe(totalAssetsUSD - totalLiabilitiesUSD);
  });

  it('smoke tests historical groupings and deduplication of account records', () => {
    const historicalItems: FinancialItem[] = [
      { id: '1', name: 'Vanguard IRA', type: 'asset', category: 'Retirement 401k/IRA', value: 50000, currency: 'USD', lastUpdated: '2023-01-01' },
      { id: '2', name: 'Vanguard IRA', type: 'asset', category: 'Retirement 401k/IRA', value: 75000, currency: 'USD', lastUpdated: '2024-01-01' },
      { id: '3', name: 'Chase Sapphire', type: 'liability', category: 'Credit Card', value: 3000, currency: 'USD', lastUpdated: '2024-01-01' },
    ];

    const groups = groupAccountHistory(historicalItems);
    expect(groups.length).toBe(2);

    const iraGroup = groups.find((g) => g.name === 'Vanguard IRA');
    expect(iraGroup?.history.length).toBe(2);
    expect(iraGroup?.latestItem.value).toBe(75000);
  });

  it('smoke tests currency conversion across all major supported currency pairs', () => {
    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR', 'SGD'];

    for (const from of currencies) {
      for (const to of currencies) {
        const { convertedValue, exchangeRate } = convertCurrencyAmount(1000, from, to, DEFAULT_USD_RATES);
        expect(convertedValue).toBeGreaterThan(0);
        expect(exchangeRate).toBeGreaterThan(0);
      }
    }
  });

  it('smoke tests formatters across various currencies and magnitude scales', () => {
    expect(formatCurrency(1250000, 'USD')).toContain('$');
    expect(formatCurrency(1250000, 'EUR')).toContain('€');
    expect(formatCurrency(1250000, 'GBP')).toContain('£');
    expect(formatCurrency(1250000, 'JPY')).toContain('¥');

    expect(formatPercent(45.678)).toBe('+45.7%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});
