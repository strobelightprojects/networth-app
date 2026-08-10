import { describe, it, expect } from 'vitest';
import { parseGoogleSheetUrl, extractDateFromFilename, suggestColumnMapping, convertRowsToItems, parseCSVText, parseExcelFile } from '../utils/excelParser';
import { ColumnMapping } from '../types';

describe('excelParser', () => {
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

  describe('parseGoogleSheetUrl', () => {
    it('returns null for empty url', () => {
      expect(parseGoogleSheetUrl('')).toBeNull();
    });
    it('returns null for malformed url', () => {
      expect(parseGoogleSheetUrl('not a url')).toBeNull();
    });
    it('extracts published csv urls', () => {
      const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ/pub?output=csv';
      const result = parseGoogleSheetUrl(url);
      expect(result).not.toBeNull();
      expect(result?.spreadsheetId).toBe('published');
      expect(result?.csvUrl).toBe(url);
    });
    it('extracts standard google sheet urls', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0X/edit#gid=0';
      const result = parseGoogleSheetUrl(url);
      expect(result).not.toBeNull();
      expect(result?.spreadsheetId).toBe('1BxiMVs0X');
      expect(result?.csvUrl).toBe('https://docs.google.com/spreadsheets/d/1BxiMVs0X/export?format=csv&gid=0');
    });
    it('extracts standard google sheet urls with specific gid', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0X/edit#gid=123456';
      const result = parseGoogleSheetUrl(url);
      expect(result?.csvUrl).toBe('https://docs.google.com/spreadsheets/d/1BxiMVs0X/export?format=csv&gid=123456');
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
  });
});
