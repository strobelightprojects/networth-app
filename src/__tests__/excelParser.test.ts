import { describe, it, expect } from 'vitest';
import { extractDateFromFilename, suggestColumnMapping, convertRowsToItems, parseCSVText, parseExcelFile, parseDateString, detectGlobalDateFromSheet } from '../utils/excelParser';
import { ColumnMapping } from '../types';

describe('excelParser', () => {
  describe('parseDateString', () => {
    it('parses YYYY-MM-DD', () => {
      expect(parseDateString('2024-05-15')).toBe('2024-05-15');
      expect(parseDateString('2025/11/03')).toBe('2025-11-03');
    });

    it('parses MM/DD/YYYY', () => {
      expect(parseDateString('05/15/2024')).toBe('2024-05-15');
      expect(parseDateString('12/01/2023')).toBe('2023-12-01');
    });

    it('parses YYYY-MM', () => {
      expect(parseDateString('2024-06')).toBe('2024-06-01');
    });

    it('parses text dates like January 15, 2024', () => {
      expect(parseDateString('January 15, 2024')).toBe('2024-01-15');
    });

    it('returns null for invalid or empty inputs', () => {
      expect(parseDateString('')).toBeNull();
      expect(parseDateString('abc')).toBeNull();
      expect(parseDateString(null)).toBeNull();
    });
  });

  describe('detectGlobalDateFromSheet', () => {
    it('detects as-of dates in row cells', () => {
      const rows = [
        { Title: 'Net Worth Statement As Of 2024-03-31' },
        { Name: 'Cash', Value: 1000 },
      ];
      expect(detectGlobalDateFromSheet(rows)).toBe('2024-03-31');
    });

    it('detects dates from filename if not in rows', () => {
      const rows = [{ Name: 'Checking', Value: 5000 }];
      expect(detectGlobalDateFromSheet(rows, 'Portfolio_jan_2025.xlsx')).toBe('2025-01');
    });
  });
  describe('parseCSVText', () => {
    it('returns empty result for empty string', () => {
      const result = parseCSVText('', 'empty.csv');
      expect(result.rows).toEqual([]);
      expect(result.headers).toEqual([]);
    });

    it('parses standard single-table CSV', () => {
      const csv = `Account Name,Balance,Type\nChecking,5000,Asset\nCar Loan,12000,Liability`;
      const result = parseCSVText(csv, 'test.csv');
      expect(result.rows.length).toBe(2);
      expect(result.headers).toEqual(['Account Name', 'Balance', 'Type']);
      expect(result.suggestedMapping.nameCol).toBe('Account Name');
      expect(result.suggestedMapping.valueCol).toBe('Balance');
    });

    it('parses multi-section ledger CSV', () => {
      const csv = `Net Worth Summary\n1. Liquid Assets\nAsset / Line Item,Amount\nSavings,10000\nChecking,2000\nSubtotal,12000\n\n2. Real Estate\nHouse,400000\nTotal,400000`;
      const result = parseCSVText(csv, 'ledger.csv');
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.headers).toContain('Account Name');
      expect(result.headers).toContain('Value ($)');
    });
  });

  describe('extractDateFromFilename', () => {
    it('extracts YYYY-MM-DD', () => {
      expect(extractDateFromFilename('file_2024-05-15.csv', '2024-01-01')).toBe('2024-05-15');
      expect(extractDateFromFilename('2024_05_15.csv', '2024-01-01')).toBe('2024-05-15');
    });
    it('extracts YYYY-MM', () => {
      expect(extractDateFromFilename('file_2024-05.csv', '2024-01-01')).toBe('2024-05');
      expect(extractDateFromFilename('2024_05.csv', '2024-01-01')).toBe('2024-05');
    });
    it('extracts Month Year', () => {
      expect(extractDateFromFilename('jan_2025.csv', '2024-01-01')).toBe('2025-01');
      expect(extractDateFromFilename('january2025.csv', '2024-01-01')).toBe('2025-01');
      expect(extractDateFromFilename('file_2025_jan.csv', '2024-01-01')).toBe('2025-01');
    });
    it('extracts year only', () => {
      expect(extractDateFromFilename('file_2025.csv', '2024-01-01')).toBe('2025-01');
    });
    it('returns fallback if no match', () => {
      expect(extractDateFromFilename('data.csv', '2024-01-01')).toBe('2024-01-01');
      expect(extractDateFromFilename('', '2024-01-01')).toBe('2024-01-01');
    });
  });

  describe('suggestColumnMapping', () => {
    it('suggests correct mapping', () => {
      const headers = ['Account Name', 'Balance', 'Type', 'Category', 'Currency'];
      const mapping = suggestColumnMapping(headers);
      expect(mapping.nameCol).toBe('Account Name');
      expect(mapping.valueCol).toBe('Balance');
      expect(mapping.typeCol).toBe('Type');
      expect(mapping.categoryCol).toBe('Category');
      expect(mapping.currencyCol).toBe('Currency');
    });
    it('handles alternative headers', () => {
      const headers = ['item', 'amount', 'asset class', 'ccy', 'tag'];
      const mapping = suggestColumnMapping(headers);
      expect(mapping.nameCol).toBe('asset class');
      expect(mapping.valueCol).toBe('amount');
      expect(mapping.typeCol).toBe('asset class');
      expect(mapping.categoryCol).toBe('asset class');
      expect(mapping.currencyCol).toBe('ccy');
    });
  });

  describe('convertRowsToItems', () => {
    const mapping: ColumnMapping = {
      nameCol: 'Name',
      valueCol: 'Value',
      typeCol: 'Type',
      categoryCol: 'Category',
      currencyCol: 'Currency'
    };

    it('converts correctly', () => {
      const rows = [
        { Name: 'Cash', Value: '1000', Type: 'asset', Category: 'cash', Currency: 'USD' },
        { Name: 'Mortgage', Value: '-5000', Type: 'liability', Category: 'loan', Currency: 'USD' },
      ];
      const items = convertRowsToItems(rows, mapping, 'USD');
      expect(items.length).toBe(2);
      expect(items[0].name).toBe('Cash');
      expect(items[0].value).toBe(1000);
      expect(items[0].type).toBe('asset');
      expect(items[1].name).toBe('Mortgage');
      expect(items[1].value).toBe(5000); // Converted abs value
      expect(items[1].type).toBe('liability');
    });
    
    it('infers currency and type', () => {
      const rows = [
        { Name: 'Bank (EUR)', Value: 1000 },
        { Name: 'Credit Card', Value: 500 },
        { Name: 'Life Insurance', Value: 2000 },
      ];
      const items = convertRowsToItems(rows, { nameCol: 'Name', valueCol: 'Value' }, 'USD', { EUR: 1.1 });
      expect(items.length).toBe(3);
      expect(items[0].currency).toBe('EUR');
      expect(items[0].value).toBeCloseTo(909.09, 2);
      expect(items[1].type).toBe('liability'); // inferred from name
      expect(items[2].type).toBe('insurance');
    });
    
    it('skips empty names', () => {
      const rows = [
        { Name: '', Value: 1000 },
        { Name: ' ', Value: 500 },
      ];
      const items = convertRowsToItems(rows, { nameCol: 'Name', valueCol: 'Value' });
      expect(items.length).toBe(0);
    });

    it('extracts row dates from date column or cell values', () => {
      const rows = [
        { Name: 'Savings', Value: 1000, Date: '2024-03-15' },
        { Name: 'Stocks', Value: 5000, Date: '2024-04-01' },
      ];
      const items = convertRowsToItems(rows, { nameCol: 'Name', valueCol: 'Value', dateCol: 'Date' });
      expect(items.length).toBe(2);
      expect(items[0].lastUpdated).toBe('2024-03-15');
      expect(items[1].lastUpdated).toBe('2024-04-01');
    });
  });
});
