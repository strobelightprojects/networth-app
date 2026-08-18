import { describe, it, expect } from 'vitest';
import { DEFAULT_PORTFOLIO, SAMPLE_PORTFOLIOS } from '../data/samplePortfolios';
import { getMostRecentItems, groupAccountHistory } from '../utils/itemHelpers';

describe('samplePortfolios and Default Data', () => {
  it('defines a valid DEFAULT_PORTFOLIO structure', () => {
    expect(DEFAULT_PORTFOLIO).toBeDefined();
    expect(DEFAULT_PORTFOLIO.id).toBe('main-portfolio');
    expect(DEFAULT_PORTFOLIO.name).toBe('My Net Worth Portfolio');
    expect(DEFAULT_PORTFOLIO.currency).toBe('USD');
    expect(Array.isArray(DEFAULT_PORTFOLIO.items)).toBe(true);
    expect(Array.isArray(DEFAULT_PORTFOLIO.history)).toBe(true);
  });

  it('calculates 0 items for empty default portfolio', () => {
    const activeItems = getMostRecentItems(DEFAULT_PORTFOLIO.items);
    expect(activeItems.length).toBe(0);
    const groups = groupAccountHistory(DEFAULT_PORTFOLIO.items);
    expect(groups.length).toBe(0);
  });

  it('contains at least one valid portfolio in SAMPLE_PORTFOLIOS', () => {
    expect(SAMPLE_PORTFOLIOS.length).toBeGreaterThanOrEqual(1);
    expect(SAMPLE_PORTFOLIOS[0].id).toBe(DEFAULT_PORTFOLIO.id);
  });
});
