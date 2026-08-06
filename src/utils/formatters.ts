import { CurrencyCode } from '../types';
import { getCurrencySymbol, CURRENCY_LIST, DEFAULT_USD_RATES } from './currency';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF',
  INR: '₹',
  SGD: 'SG$',
  MXN: 'MX$',
  BRL: 'R$',
};

export function formatCurrency(amount: number, currency: string = 'USD', compact: boolean = false): string {
  const symbol = getCurrencySymbol(currency);

  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    }
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
