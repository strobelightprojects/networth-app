import { describe, it, expect } from 'vitest';
import { parseCSVText, convertRowsToItems, inferCategory } from '../utils/excelParser';

describe('excelParser multisection and advanced formats', () => {
  it('parses formatted multi-section spreadsheet CSV structure', () => {
    const multiSectionCSV = `
1. ASSETS / LINE ITEM,Category,Current Balance,Currency
Primary Residence,Real Estate,"$650,000.00",USD
Vanguard 401(k),Retirement,"$120,400.50",USD
Chase Checking,Cash,"$15,200.00",USD

2. LIABILITIES & DEBTS,Category,Current Balance,Currency
Home Mortgage,Mortgage,"$410,000.00",USD
Auto Loan,Auto Loans,"$18,500.00",USD

3. INSURANCE POLICIES,Category,Coverage / Value,Currency
Northwestern Term Life,Term Life,"$1,000,000.00",USD
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

  it('converts multi-currency items to base currency using FX rates table', () => {
    const csv = `Account,Balance,Currency\nGerman Bank Account,10000,EUR\nLondon Flat Rental Deposit,5000,GBP\nUS Checking,2000,USD`;
    const parsed = parseCSVText(csv, 'global.csv');
    const fxRates = {
      EUR: 1.08,
      GBP: 1.28,
      USD: 1.0,
    };

    const items = convertRowsToItems(
      parsed.rows,
      { nameCol: 'Account', valueCol: 'Balance', currencyCol: 'Currency' },
      'USD',
      fxRates
    );

    expect(items.length).toBe(3);
    const eurItem = items.find((i) => i.name.includes('German'));
    expect(eurItem).toBeDefined();
    expect(eurItem?.currency).toBe('EUR');
    expect(eurItem?.originalValue).toBe(10000);
  });

  it('infers category and item types correctly from keywords', () => {
    expect(inferCategory('Vanguard Total Stock Market Index Fund', '', 'asset')).toBe('Stocks & ETFs');
    expect(inferCategory('Primary Home Equity', '', 'asset')).toBe('Real Estate');
    expect(inferCategory('Fidelity 401(k) Plan', '', 'asset')).toBe('Retirement (401k/IRA)');
    expect(inferCategory('High Yield Savings Account', '', 'asset')).toBe('Cash & Equivalents');
    expect(inferCategory('Bitcoin Cold Storage', '', 'asset')).toBe('Crypto');
    expect(inferCategory('Tesla Auto Loan', '', 'liability')).toBe('Auto Loans');
    expect(inferCategory('Chase Sapphire Reserve', '', 'liability')).toBe('Credit Cards');
    expect(inferCategory('Federal Student Loan', '', 'liability')).toBe('Student Loans');
    expect(inferCategory('Whole Life Insurance Policy', '', 'insurance')).toBe('Whole Life Insurance');
  });
});
