import { describe, it, expect } from 'vitest';
import { mergePortfolios, convertItemToCurrency } from '../utils/portfolioMerger';
import { PortfolioData, FinancialItem } from '../types';

describe('portfolioMerger utility', () => {
  const portfolioA: PortfolioData = {
    id: 'p-1',
    name: 'Retirement & Savings',
    currency: 'USD',
    items: [
      {
        id: 'item-1',
        name: 'Vanguard 401k',
        category: 'Retirement (401k/IRA)',
        type: 'asset',
        value: 100000,
        lastUpdated: '2026-01-15',
      },
      {
        id: 'item-2',
        name: 'Chase Checking',
        category: 'Cash & Equivalents',
        type: 'asset',
        value: 15000,
        lastUpdated: '2026-02-10',
      },
      {
        id: 'item-3',
        name: 'Mortgage Loan',
        category: 'Mortgage',
        type: 'liability',
        value: 250000,
        lastUpdated: '2026-02-10',
      },
    ],
    history: [
      { date: '2026-01', totalAssets: 95000, totalLiabilities: 255000, netWorth: -160000 },
      { date: '2026-02', totalAssets: 115000, totalLiabilities: 250000, netWorth: -135000 },
    ],
  };

  const portfolioB: PortfolioData = {
    id: 'p-2',
    name: 'Crypto & Brokerage',
    currency: 'USD',
    items: [
      {
        id: 'item-4',
        name: 'Bitcoin Cold Storage',
        category: 'Crypto',
        type: 'asset',
        value: 50000,
        lastUpdated: '2026-02-15',
      },
      {
        id: 'item-5',
        name: 'Chase Checking',
        category: 'Cash & Equivalents',
        type: 'asset',
        value: 20000,
        lastUpdated: '2026-02-15',
      },
    ],
    history: [
      { date: '2026-01', totalAssets: 40000, totalLiabilities: 0, netWorth: 40000 },
      { date: '2026-02', totalAssets: 70000, totalLiabilities: 0, netWorth: 70000 },
    ],
  };

  const portfolioEUR: PortfolioData = {
    id: 'p-3',
    name: 'European Holdings',
    currency: 'EUR',
    items: [
      {
        id: 'item-6',
        name: 'Munich Apartment',
        category: 'Real Estate',
        type: 'asset',
        value: 300000,
        currency: 'EUR',
        lastUpdated: '2026-02-15',
      },
    ],
    history: [
      { date: '2026-02', totalAssets: 300000, totalLiabilities: 0, netWorth: 300000 },
    ],
  };

  it('converts item correctly across different currencies', () => {
    const item: FinancialItem = {
      id: 'i-1',
      name: 'Euro Cash',
      category: 'Cash & Equivalents',
      type: 'asset',
      value: 1000,
      currency: 'EUR',
      lastUpdated: '2026-01-01',
    };
    // Default USD rate for EUR is 0.922 -> 1000 EUR in USD = 1000 / 0.922 = 1084.60
    const converted = convertItemToCurrency(item, 'EUR', 'USD');
    expect(converted.value).toBeGreaterThan(1000);
    expect(converted.currency).toBe('EUR');
    expect(converted.originalValue).toBe(1000);
  });

  it('merges multiple portfolios into a new portfolio with keep_all duplicate strategy', () => {
    const res = mergePortfolios([portfolioA, portfolioB], {
      mode: 'create_new',
      sourcePortfolioIds: ['p-1', 'p-2'],
      newPortfolioName: 'Consolidated Wealth',
      targetCurrency: 'USD',
      duplicateStrategy: 'keep_all',
      mergeHistory: true,
      deleteSourcesAfterMerge: false,
    });

    expect(res.mergedPortfolio.name).toBe('Consolidated Wealth');
    expect(res.mergedPortfolio.currency).toBe('USD');
    expect(res.mergedPortfolio.items.length).toBe(5); // 3 from A + 2 from B
    expect(res.updatedPortfolios.length).toBe(3); // new portfolio + 2 original
    expect(res.deletedPortfolioIds.length).toBe(0);

    // Check merged history
    expect(res.mergedPortfolio.history).toEqual([
      { date: '2026-01', totalAssets: 135000, totalLiabilities: 255000, netWorth: -120000 },
      { date: '2026-02', totalAssets: 185000, totalLiabilities: 250000, netWorth: -65000 },
    ]);
  });

  it('merges portfolios and deduplicates with keep_latest strategy', () => {
    const res = mergePortfolios([portfolioA, portfolioB], {
      mode: 'create_new',
      sourcePortfolioIds: ['p-1', 'p-2'],
      newPortfolioName: 'Latest Accounts',
      targetCurrency: 'USD',
      duplicateStrategy: 'keep_latest',
      mergeHistory: true,
      deleteSourcesAfterMerge: false,
    });

    // Chase Checking should be kept with the latest value (20000 from portfolioB with date 2026-02-15)
    expect(res.mergedPortfolio.items.length).toBe(4);
    const chase = res.mergedPortfolio.items.find((i) => i.name === 'Chase Checking');
    expect(chase?.value).toBe(20000);
    expect(chase?.lastUpdated).toBe('2026-02-15');
  });

  it('merges portfolios and aggregates with sum_values strategy', () => {
    const res = mergePortfolios([portfolioA, portfolioB], {
      mode: 'create_new',
      sourcePortfolioIds: ['p-1', 'p-2'],
      newPortfolioName: 'Summed Portfolio',
      targetCurrency: 'USD',
      duplicateStrategy: 'sum_values',
      mergeHistory: true,
      deleteSourcesAfterMerge: false,
    });

    // Chase Checking should sum 15000 + 20000 = 35000
    expect(res.mergedPortfolio.items.length).toBe(4);
    const chase = res.mergedPortfolio.items.find((i) => i.name === 'Chase Checking');
    expect(chase?.value).toBe(35000);
  });

  it('handles deleteSourcesAfterMerge option cleanly', () => {
    const res = mergePortfolios([portfolioA, portfolioB], {
      mode: 'create_new',
      sourcePortfolioIds: ['p-1', 'p-2'],
      newPortfolioName: 'Merged Only',
      targetCurrency: 'USD',
      duplicateStrategy: 'keep_all',
      mergeHistory: true,
      deleteSourcesAfterMerge: true,
    });

    expect(res.deletedPortfolioIds).toEqual(['p-1', 'p-2']);
    expect(res.updatedPortfolios.length).toBe(1);
    expect(res.updatedPortfolios[0].id).toBe(res.mergedPortfolio.id);
  });

  it('merges into an existing target portfolio', () => {
    const res = mergePortfolios([portfolioA, portfolioB], {
      mode: 'merge_into_target',
      sourcePortfolioIds: ['p-2'], // merging B into A
      targetPortfolioId: 'p-1',
      targetCurrency: 'USD',
      duplicateStrategy: 'sum_values',
      mergeHistory: true,
      deleteSourcesAfterMerge: true,
    });

    expect(res.mergedPortfolio.id).toBe('p-1');
    expect(res.mergedPortfolio.name).toBe('Retirement & Savings');
    expect(res.deletedPortfolioIds).toEqual(['p-2']);
    expect(res.updatedPortfolios.length).toBe(1);
    expect(res.updatedPortfolios[0].id).toBe('p-1');
  });

  it('converts currencies properly when merging foreign portfolio', () => {
    const res = mergePortfolios([portfolioA, portfolioEUR], {
      mode: 'create_new',
      sourcePortfolioIds: ['p-1', 'p-3'],
      newPortfolioName: 'Global Wealth',
      targetCurrency: 'USD',
      duplicateStrategy: 'keep_all',
      mergeHistory: true,
      deleteSourcesAfterMerge: false,
    });

    expect(res.mergedPortfolio.currency).toBe('USD');
    const property = res.mergedPortfolio.items.find((i) => i.name === 'Munich Apartment');
    expect(property).toBeDefined();
    expect(property?.value).toBeGreaterThan(300000); // 300,000 EUR converted to USD
  });

  it('throws an error if no source portfolios are selected', () => {
    expect(() =>
      mergePortfolios([portfolioA], {
        mode: 'create_new',
        sourcePortfolioIds: [],
        targetCurrency: 'USD',
        duplicateStrategy: 'keep_all',
        mergeHistory: true,
        deleteSourcesAfterMerge: false,
      })
    ).toThrow('At least one portfolio must be selected for merging.');
  });
});
