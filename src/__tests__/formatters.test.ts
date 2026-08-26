import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatDate, CURRENCY_SYMBOLS } from '../utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats basic USD amounts', () => {
      expect(formatCurrency(100)).toBe('$100');
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('formats negative amounts', () => {
      expect(formatCurrency(-500)).toBe('$-500');
      expect(formatCurrency(-15000)).toBe('$-15,000');
    });

    it('supports compact notation for thousands and millions', () => {
      expect(formatCurrency(500, 'USD', true)).toBe('$500');
      expect(formatCurrency(1200, 'USD', true)).toBe('$1.2k');
      expect(formatCurrency(45000, 'USD', true)).toBe('$45.0k');
      expect(formatCurrency(1500000, 'USD', true)).toBe('$1.50M');
      expect(formatCurrency(12450000, 'USD', true)).toBe('$12.45M');
      expect(formatCurrency(-2500000, 'USD', true)).toBe('$-2.50M');
    });

    it('supports different currencies', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
      expect(formatCurrency(1000, 'JPY')).toBe('¥1,000');
      expect(formatCurrency(1000, 'CAD')).toBe('CA$1,000');
      expect(formatCurrency(1000, 'INR')).toBe('₹1,000');
      expect(formatCurrency(1000, 'CHF')).toBe('CHF1,000');
    });

    it('includes complete CURRENCY_SYMBOLS dictionary', () => {
      expect(CURRENCY_SYMBOLS.USD).toBe('$');
      expect(CURRENCY_SYMBOLS.EUR).toBe('€');
      expect(CURRENCY_SYMBOLS.GBP).toBe('£');
      expect(CURRENCY_SYMBOLS.JPY).toBe('¥');
      expect(CURRENCY_SYMBOLS.CAD).toBe('CA$');
      expect(CURRENCY_SYMBOLS.AUD).toBe('A$');
      expect(CURRENCY_SYMBOLS.INR).toBe('₹');
      expect(CURRENCY_SYMBOLS.BRL).toBe('R$');
      expect(CURRENCY_SYMBOLS.MXN).toBe('MX$');
    });
  });

  describe('formatPercent', () => {
    it('formats positive percentages with + sign', () => {
      expect(formatPercent(5.23)).toBe('+5.2%');
      expect(formatPercent(120.0)).toBe('+120.0%');
      expect(formatPercent(0.05)).toBe('+0.1%');
    });

    it('formats negative percentages without double minus', () => {
      expect(formatPercent(-4.85)).toBe('-4.8%');
      expect(formatPercent(-0.1)).toBe('-0.1%');
    });

    it('formats zero correctly', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });
  });

  describe('formatDate', () => {
    it('formats standard ISO dates', () => {
      const formatted = formatDate('2024-03-15');
      expect(formatted).toMatch(/Mar(ch)? 15, 2024/i);
    });

    it('handles ISO timestamps with time', () => {
      const formatted = formatDate('2024-12-25T14:30:00.000Z');
      expect(formatted).toMatch(/Dec(ember)? 25, 2024/i);
    });

    it('returns raw string when invalid date string passed', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });
});
