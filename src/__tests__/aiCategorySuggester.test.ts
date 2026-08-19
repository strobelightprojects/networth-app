import { describe, it, expect } from 'vitest';
import { suggestCategoryFromAccountName, KEYWORD_CATEGORY_DICTIONARY } from '../utils/aiCategorySuggester';

describe('aiCategorySuggester & KEYWORD_CATEGORY_DICTIONARY', () => {
  it('exports a valid keyword mapping dictionary', () => {
    expect(Array.isArray(KEYWORD_CATEGORY_DICTIONARY)).toBe(true);
    expect(KEYWORD_CATEGORY_DICTIONARY.length).toBeGreaterThan(5);

    KEYWORD_CATEGORY_DICTIONARY.forEach((mapping) => {
      expect(mapping.keywords.length).toBeGreaterThan(0);
      expect(mapping.suggestedCategory).toBeDefined();
      expect(['asset', 'liability', 'insurance']).toContain(mapping.suggestedType);
      expect(['high', 'medium', 'low']).toContain(mapping.confidence);
    });
  });

  it('returns null for empty or short account names', () => {
    expect(suggestCategoryFromAccountName('')).toBeNull();
    expect(suggestCategoryFromAccountName('  ')).toBeNull();
    expect(suggestCategoryFromAccountName('a')).toBeNull();
  });

  describe('Insurance categories', () => {
    it('detects Term Life Insurance', () => {
      const result = suggestCategoryFromAccountName('Prudential Term Life 20 Year');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Term Life Insurance');
      expect(result?.suggestedType).toBe('insurance');
      expect(result?.matchedKeyword).toBe('term life');
    });

    it('detects Whole Life Insurance', () => {
      const result = suggestCategoryFromAccountName('Northwestern Mutual Whole Life Policy');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Whole Life Insurance');
      expect(result?.suggestedType).toBe('insurance');
      expect(result?.matchedKeyword).toBe('whole life');
    });

    it('detects Disability Insurance', () => {
      const result = suggestCategoryFromAccountName('Guardian Disability Insurance');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Disability Insurance');
      expect(result?.suggestedType).toBe('insurance');
    });

    it('detects Universal Life Insurance', () => {
      const result = suggestCategoryFromAccountName('Pacific Life Indexed Universal Life Policy');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Universal Life Insurance');
      expect(result?.suggestedType).toBe('insurance');
    });

    it('detects Property & Umbrella', () => {
      const result = suggestCategoryFromAccountName('State Farm Umbrella Policy $2M');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Property & Umbrella');
      expect(result?.suggestedType).toBe('insurance');
    });
  });

  describe('Liability categories', () => {
    it('detects Mortgage', () => {
      const result = suggestCategoryFromAccountName('Chase Primary Mortgage');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Mortgage');
      expect(result?.suggestedType).toBe('liability');
    });

    it('detects Credit Cards', () => {
      const result = suggestCategoryFromAccountName('Amex Sapphire Reserve Credit Card');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Credit Cards');
      expect(result?.suggestedType).toBe('liability');
    });

    it('detects Student Loans', () => {
      const result = suggestCategoryFromAccountName('Nelnet Student Loan');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Student Loans');
      expect(result?.suggestedType).toBe('liability');
    });

    it('detects Auto Loans', () => {
      const result = suggestCategoryFromAccountName('Honda Financial Auto Loan');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Auto Loans');
      expect(result?.suggestedType).toBe('liability');
    });

    it('detects Personal Loans & HELOCs', () => {
      const result = suggestCategoryFromAccountName('SoFi Personal Loan 2026');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Personal Loans');
      expect(result?.suggestedType).toBe('liability');
    });
  });

  describe('Asset categories', () => {
    it('detects Retirement Accounts', () => {
      const result = suggestCategoryFromAccountName('Fidelity 401k Retirement');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Retirement (401k/IRA)');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Crypto', () => {
      const result = suggestCategoryFromAccountName('Coinbase Bitcoin Wallet');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Crypto');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Real Estate', () => {
      const result = suggestCategoryFromAccountName('Rental Property House');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Real Estate');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Cash & Equivalents', () => {
      const result = suggestCategoryFromAccountName('Marcus HYSA Savings Account');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Cash & Equivalents');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Stocks & ETFs', () => {
      const result = suggestCategoryFromAccountName('Vanguard S&P 500 ETF Index');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Stocks & ETFs');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Precious Metals', () => {
      const result = suggestCategoryFromAccountName('1oz Gold Bullion Bar');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Precious Metals');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Bonds & Fixed Income', () => {
      const result = suggestCategoryFromAccountName('US Treasury 10-Year Bond');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Bonds & Fixed Income');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Vehicle & Physical assets', () => {
      const result = suggestCategoryFromAccountName('Tesla Model Y Vehicle');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Vehicle & Physical');
      expect(result?.suggestedType).toBe('asset');
    });

    it('detects Alternative & Private assets', () => {
      const result = suggestCategoryFromAccountName('Early Stage Startup Equity');
      expect(result).not.toBeNull();
      expect(result?.suggestedCategory).toBe('Alternative & Private');
      expect(result?.suggestedType).toBe('asset');
    });
  });
});
