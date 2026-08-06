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
    it('returns the most recent item for an account', () => {
      const items: FinancialItem[] = [
        baseItem,
        { ...baseItem, id: '2', value: 2000, lastUpdated: '2026-08-05' }
      ];
      
      const result = getMostRecentItems(items);
      expect(result.length).toBe(1);
      expect(result[0].value).toBe(2000);
    });

    it('filters out items older than 1 year relative to max date', () => {
      const items: FinancialItem[] = [
        { ...baseItem, id: '1', name: 'Old Account', lastUpdated: '2025-01-01' },
        { ...baseItem, id: '2', name: 'New Account', lastUpdated: '2026-08-05' } // Max date
      ];
      
      const result = getMostRecentItems(items);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('New Account');
    });

    it('filters out excluded items', () => {
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
  });

  describe('groupAccountHistory', () => {
    it('groups items by account key', () => {
      const items: FinancialItem[] = [
        baseItem,
        { ...baseItem, id: '2', lastUpdated: '2026-08-05' },
        { ...baseItem, id: '3', name: 'Other Account' }
      ];
      
      const result = groupAccountHistory(items);
      expect(result.length).toBe(2);
      
      const mainGroup = result.find(g => g.name === 'Chase Checking');
      expect(mainGroup?.history.length).toBe(2);
      expect(mainGroup?.latestItem.id).toBe('2');
    });
  });
});
