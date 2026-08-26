import { vi, describe, it, expect } from 'vitest';
import { extractDateFromFilename, suggestColumnMapping, convertRowsToItems, parseCSVText, parseDateString, detectGlobalDateFromSheet, inferCategory } from '../utils/excelParser';
import { ColumnMapping } from '../types';

vi.mock('../utils/aiCategorySuggester', () => ({
  suggestCategoryFromAccountName: vi.fn(() => null)
}));

describe('excelParser', () => {
  describe('inferCategory', () => {
    it('infers insurance categories', () => {
      expect(inferCategory('Term Life', '', 'insurance')).toBe('Term Life Insurance');
      expect(inferCategory('Whole Life', '', 'insurance')).toBe('Whole Life Insurance');
      expect(inferCategory('Universal Life', '', 'insurance')).toBe('Universal Life Insurance');
      expect(inferCategory('AFLAC Disability', '', 'insurance')).toBe('Disability Insurance');
      expect(inferCategory('Long-term Care', '', 'insurance')).toBe('Health & Long-Term Care');
      expect(inferCategory('Random Ins', '', 'insurance')).toBe('Term Life Insurance'); // default fallback
    });

    it('infers liability categories', () => {
      expect(inferCategory('Primary Mortgage', '', 'liability')).toBe('Mortgage');
      expect(inferCategory('Visa Credit Card', '', 'liability')).toBe('Credit Cards');
      expect(inferCategory('Student Loan', '', 'liability')).toBe('Student Loans');
      expect(inferCategory('Auto Loan', '', 'liability')).toBe('Auto Loans');
      expect(inferCategory('Personal Loan', '', 'liability')).toBe('Personal Loans');
      expect(inferCategory('Random Debt', '', 'liability')).toBe('Other Liabilities'); // default fallback
    });

    it('infers asset categories', () => {
      expect(inferCategory('Vanguard S&P 500 Index Fund', '', 'asset')).toBe('Stocks & ETFs');
      expect(inferCategory('Rental Property', '', 'asset')).toBe('Real Estate');
      expect(inferCategory('Roth IRA', '', 'asset')).toBe('Retirement (401k/IRA)');
      expect(inferCategory('Chase Checking Account', '', 'asset')).toBe('Cash & Equivalents');
      expect(inferCategory('Bitcoin Wallet', '', 'asset')).toBe('Crypto');
      expect(inferCategory('US Treasury Bonds', '', 'asset')).toBe('Bonds & Fixed Income');
      expect(inferCategory('Tesla Model 3', '', 'asset')).toBe('Vehicle & Physical');
      expect(inferCategory('Angel Investment', '', 'asset')).toBe('Alternative & Private'); // default fallback
    });
  });

  describe('parseDateString', () => {
    it('parses YYYY-MM-DD', () => {
      expect(parseDateString('2024-05-15')).toBe('2024-05-15');
      expect(parseDateString('2025/11/03')).toBe('2025-11-03');
    });

    it('parses MM/DD/YYYY', () => {
      expect(parseDateString('05/15/2024')).toBe('2024-05-15');
      expect(parseDateString('12/01/2023')).toBe('2023-12-01');
    });
    
    it('parses DD/MM/YYYY', () => {
      expect(parseDateString('15/05/2024')).toBe('2024-05-15');
      expect(parseDateString('31-12-2023')).toBe('2023-12-31');
    });

    it('parses YYYY-MM', () => {
      expect(parseDateString('2024-06')).toBe('2024-06-01');
    });
    
    it('parses Excel numeric dates', () => {
      // 45428 = May 16 2024
      expect(parseDateString(45428)).toBe('2024-05-16');
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

    it('handles quoted values with commas correctly', () => {
      const csv = `Account Name,Balance\n"Checking, Savings & CDs","$25,450.00"\n"Auto Loan, 2023 Tesla","$18,200"`;
      const result = parseCSVText(csv, 'quoted.csv');
      expect(result.rows.length).toBe(2);
      expect(result.rows[0]['Account Name']).toBe('Checking, Savings & CDs');
      expect(result.rows[0]['Balance']).toBe('$25,450.00');
    });
  });

  describe('extractDateFromFilename', () => {
    it('extracts ISO dates', () => {
      expect(extractDateFromFilename('NetWorth_2024-05-01.xlsx', '')).toBe('2024-05-01');
      expect(extractDateFromFilename('2023_11_Statement.csv', '')).toBe('2023-11');
    });

    it('extracts Month Year dates', () => {
      expect(extractDateFromFilename('NetWorth_January_2024.xlsx', '')).toBe('2024-01');
      expect(extractDateFromFilename('March_2023_Finances.csv', '')).toBe('2023-03');
    });

    it('extracts Year Month dates', () => {
      expect(extractDateFromFilename('NetWorth_2024_January.xlsx', '')).toBe('2024-01');
      expect(extractDateFromFilename('2023_March_Finances.csv', '')).toBe('2023-03');
    });

    it('extracts Year-only dates', () => {
      expect(extractDateFromFilename('NetWorth_2024.xlsx', '')).toBe('2024-01');
    });

    it('returns falsy if no date in filename', () => {
      expect(extractDateFromFilename('my_finances.xlsx', '')).toBeFalsy();
    });
  });

  describe('suggestColumnMapping', () => {
    it('identifies standard columns accurately', () => {
      const headers = ['Account Name', 'Current Balance', 'Account Type', 'Category', 'As Of Date'];
      const mapping = suggestColumnMapping(headers);
      expect(mapping.nameCol).toBe('Account Name');
      expect(mapping.valueCol).toBe('Current Balance');
      expect(mapping.typeCol).toBe('Account Type');
      expect(mapping.categoryCol).toBe('Category');
      expect(mapping.dateCol).toBe('As Of Date');
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
    
    it('handles formatted numbers with symbols and commas', () => {
      const rows = [
        { Name: 'Investment Portfolio', Value: '$1,250,000.50' },
        { Name: 'Student Debt', Value: '(50,000.00)' },
      ];
      const items = convertRowsToItems(rows, { nameCol: 'Name', valueCol: 'Value' });
      expect(items.length).toBe(2);
      expect(items[0].value).toBe(1250000.5);
      expect(items[1].value).toBe(50000);
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

    it('parses formatted multi-section spreadsheet CSV structure', () => {
      const multiSectionCSV = `
1. ASSETS / LINE ITEM,Category,Current Balance,Currency
Primary Residence,Real Estate,"$650,000.00",USD
Vanguard 401(k),Retirement,"$120,400.50",USD
Chase Checking,Cash,"$15,200.00",USD

2. LIABILITIES & DEBTS,Category,Current Balance,Currency
Home Mortgage,Mortgage,"$410,000.00",USD
Auto Loan,Auto Loans,"$18,500.00",USD
      `;

      const parsed = parseCSVText(multiSectionCSV, 'Annual_Statement_2025.csv');
      expect(parsed.rows.length).toBeGreaterThanOrEqual(5);

      const items = convertRowsToItems(parsed.rows, parsed.suggestedMapping, 'USD');
      expect(items.length).toBeGreaterThanOrEqual(5);

      const mortgage = items.find((i) => i.name.toLowerCase().includes('mortgage'));
      expect(mortgage).toBeDefined();
      expect(mortgage?.type).toBe('liability');
      expect(mortgage?.value).toBe(410000);
    });

    it('handles negative numbers in parentheses e.g. (15,000.00)', () => {
      const csv = `Account,Amount\nMortgage,(250000)\nCredit Card,"(4,500.50)"\nCash,12000`;
      const parsed = parseCSVText(csv, 'balances.csv');
      const items = convertRowsToItems(parsed.rows, { nameCol: 'Account', valueCol: 'Amount' }, 'USD');

      expect(items.length).toBe(3);
      const mortgage = items.find((i) => i.name === 'Mortgage');
      expect(mortgage?.value).toBe(250000);
      expect(mortgage?.type).toBe('liability');

      const cc = items.find((i) => i.name === 'Credit Card');
      expect(cc?.value).toBe(4500.5);
      expect(cc?.type).toBe('liability');
    });
  });
});
