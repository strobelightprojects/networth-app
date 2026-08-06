import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats standard currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1500.5, 'USD')).toBe('$1,501'); // Due to maximumFractionDigits: 0
    });
    
    it('formats compact currency', () => {
      expect(formatCurrency(1500, 'USD', true)).toBe('$1.5k');
      expect(formatCurrency(1500000, 'USD', true)).toBe('$1.50M');
    });

    it('formats foreign currency', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
      expect(formatCurrency(1000, 'GBP')).toBe('£1,000');
    });
  });

  describe('formatPercent', () => {
    it('formats positive percentage', () => {
      expect(formatPercent(5.5)).toBe('+5.5%');
    });

    it('formats negative percentage', () => {
      expect(formatPercent(-5.5)).toBe('-5.5%');
    });
  });
});
