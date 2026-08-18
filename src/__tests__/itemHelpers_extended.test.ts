import { describe, it, expect } from 'vitest';
import { getMostRecentItems, groupAccountHistory } from '../utils/itemHelpers';
import { FinancialItem } from '../types';

describe('itemHelpers extended', () => {
  const sampleItems: FinancialItem[] = [
    {
      id: 'item-1-v1',
      name: 'Checking Account',
      type: 'asset',
      category: 'Cash & Equivalents',
      value: 5000,
      currency: 'USD',
      lastUpdated: '2024-01-01',
    },
    {
      id: 'item-1-v2',
      name: 'Checking Account',
      type: 'asset',
      category: 'Cash & Equivalents',
      value: 6500,
      currency: 'USD',
      lastUpdated: '2024-06-01',
    },
    {
      id: 'item-2',
      name: 'Vanguard Roth IRA',
      type: 'asset',
      category: 'Retirement (401k/IRA)',
      value: 50000,
      currency: 'USD',
      lastUpdated: '2024-06-01',
    },
    {
      id: 'item-3',
      name: 'Old Closed Bank Account',
      type: 'asset',
      category: 'Cash & Equivalents',
      value: 100,
      currency: 'USD',
      lastUpdated: '2021-01-01', // Outdated > 1 year relative to anchor 2024-06-01
    },
    {
      id: 'item-4',
      name: 'Credit Card Debt',
      type: 'liability',
      category: 'Credit Cards',
      value: 2000,
      currency: 'USD',
      lastUpdated: '2024-06-01',
      isExcluded: true,
    },
  ];

  describe('getMostRecentItems', () => {
    it('returns empty array when passed empty or null items', () => {
      expect(getMostRecentItems([])).toEqual([]);
      expect(getMostRecentItems(null as any)).toEqual([]);
    });

    it('deduplicates multiple historical snapshots of the same account, picking the latest', () => {
      const recent = getMostRecentItems(sampleItems);
      const checking = recent.find((item) => item.name === 'Checking Account');
      expect(checking).toBeDefined();
      expect(checking?.value).toBe(6500);
      expect(checking?.id).toBe('item-1-v2');
    });

    it('filters out accounts not updated in over 1 year relative to anchor date', () => {
      const recent = getMostRecentItems(sampleItems);
      const oldAccount = recent.find((item) => item.name === 'Old Closed Bank Account');
      expect(oldAccount).toBeUndefined();
    });

    it('filters out excluded items unless includeExcluded is true', () => {
      const recentDefault = getMostRecentItems(sampleItems);
      expect(recentDefault.find((item) => item.name === 'Credit Card Debt')).toBeUndefined();

      const recentWithExcluded = getMostRecentItems(sampleItems, true);
      expect(recentWithExcluded.find((item) => item.name === 'Credit Card Debt')).toBeDefined();
    });

    it('preserves items with empty lastUpdated field', () => {
      const undatedItem: FinancialItem = {
        id: 'undated-1',
        name: 'Fine Jewelry',
        type: 'asset',
        category: 'Vehicle & Physical',
        value: 10000,
        currency: 'USD',
        lastUpdated: '',
      };
      const result = getMostRecentItems([undatedItem]);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Fine Jewelry');
    });
  });

  describe('groupAccountHistory', () => {
    it('returns empty array on empty input', () => {
      expect(groupAccountHistory([])).toEqual([]);
      expect(groupAccountHistory(null as any)).toEqual([]);
    });

    it('groups multiple versions of an account together sorted newest first', () => {
      const groups = groupAccountHistory(sampleItems);
      const checkingGroup = groups.find((g) => g.name === 'Checking Account');

      expect(checkingGroup).toBeDefined();
      expect(checkingGroup?.history.length).toBe(2);
      expect(checkingGroup?.latestItem.id).toBe('item-1-v2');
      expect(checkingGroup?.history[0].id).toBe('item-1-v2');
      expect(checkingGroup?.history[1].id).toBe('item-1-v1');
    });

    it('correctly handles distinct accounts with distinct account keys', () => {
      const groups = groupAccountHistory(sampleItems);
      expect(groups.length).toBe(4);
    });
  });
});
