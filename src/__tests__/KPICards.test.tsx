import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KPICards } from '../components/dashboard/KPICards';
import { PortfolioData } from '../types';

describe('KPICards component', () => {
  const mockPortfolio: PortfolioData = {
    id: 'portfolio-1',
    name: 'Main Portfolio',
    currency: 'USD',
    items: [
      { id: '1', name: 'Checking Account', type: 'asset', category: 'Cash & Equivalents', value: 10000, lastUpdated: '2026-08-01' },
      { id: '2', name: 'Investment Account', type: 'asset', category: 'Stocks & ETFs', value: 90000, lastUpdated: '2026-08-01' },
      { id: '3', name: 'Mortgage Loan', type: 'liability', category: 'Mortgage', value: 40000, lastUpdated: '2026-08-01' },
      { id: '4', name: 'Term Life Policy', type: 'insurance', category: 'Term Life Insurance', value: 500000, lastUpdated: '2026-08-01' },
    ],
    history: [
      { date: '2026-07', totalAssets: 90000, totalLiabilities: 45000, netWorth: 45000 },
      { date: '2026-08', totalAssets: 100000, totalLiabilities: 40000, netWorth: 60000 },
    ],
  };

  it('renders KPI values accurately', () => {
    render(<KPICards portfolio={mockPortfolio} currency="USD" />);

    // Total Net Worth = $100,000 assets - $40,000 liabilities = $60,000
    expect(screen.getByText('Total Net Worth')).toBeInTheDocument();
    expect(screen.getByText('$60,000')).toBeInTheDocument();

    // Total Assets = $100,000
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();

    // Total Liabilities = $40,000
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText('$40,000')).toBeInTheDocument();

    // Insurance = $500,000 (excluded from net worth calculation)
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByText('Excluded from Net Worth')).toBeInTheDocument();
  });

  it('calculates MoM change correctly', () => {
    render(<KPICards portfolio={mockPortfolio} currency="USD" />);

    // July Net Worth = 45000, August = 60000 => change = +15000 (+33.3%)
    expect(screen.getByText('+33.3%')).toBeInTheDocument();
  });
});
