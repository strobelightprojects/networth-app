import { describe, it, expect } from 'vitest';
import { getMostRecentItems, groupAccountHistory } from '../utils/itemHelpers';
import { FinancialItem } from '../types';

describe('itemHelpers', () => {
  const baseItem: FinancialItem = {
    id: '1',
    name: 'Chase Checking',
    type: 'asset',
    category: 'Cash & Equivalents',
    value: 1000,
    lastUpdated: '2026-08-01'
  };

  describe('getMostRecentItems', () => {
    it('returns empty array when passed empty or null items', () => {
      expect(getMostRecentItems([])).toEqual([]);
      expect(getMostRecentItems(null as any)).toEqual([]);
    });

    it('returns the most recent item for an account', () => {
      const items: FinancialItem[] = [
        baseItem,
        { ...baseItem, id: '2', value: 2000, lastUpdated: '2026-08-05' }
      ];
      
      const result = getMostRecentItems(items);
      expect(result.length).toBe(1);
      expect(result[0].value).toBe(2000);
      expect(result[0].id).toBe('2');
    });

    it('filters out items older than 1 year relative to max date', () => {
      const items: FinancialItem[] = [
        { ...baseItem, id: '1', name: 'Old Account', lastUpdated: '2024-01-01' },
        { ...baseItem, id: '2', name: 'New Account', lastUpdated: '2026-08-05' } // Max date
      ];
      
      const result = getMostRecentItems(items);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('New Account');
    });

    it('filters out excluded items unless includeExcluded is true', () => {
      const items: FinancialItem[] = [
        { ...baseItem, id: '1', isExcluded: true },
        { ...baseItem, id: '2', name: 'Active Account' }
      ];
      
      const result = getMostRecentItems(items);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Active Account');
      
      const resultWithExcluded = getMostRecentItems(items, true);
      expect(resultWithExcluded.length).toBe(2);
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
      const items: FinancialItem[] = [
        baseItem,
        { ...baseItem, id: '2', lastUpdated: '2026-08-05', value: 2500 },
        { ...baseItem, id: '3', name: 'Other Account', lastUpdated: '2026-08-01' }
      ];
      
      const result = groupAccountHistory(items);
      expect(result.length).toBe(2);
      
      const mainGroup = result.find(g => g.name === 'Chase Checking');
      expect(mainGroup?.history.length).toBe(2);
      expect(mainGroup?.latestItem.id).toBe('2');
      expect(mainGroup?.history[0].id).toBe('2');
      expect(mainGroup?.history[1].id).toBe('1');
    });
  });
});
