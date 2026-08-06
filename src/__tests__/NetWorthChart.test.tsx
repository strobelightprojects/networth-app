import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetWorthChart } from '../components';
import { PortfolioData } from '../types';vi.mock('recharts', async () => {
  const original = await (vi.importActual('recharts') as any);
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: ({ children }: any) => <div>{children}</div>,
  };
});

describe('NetWorthChart', () => {
  const mockPortfolio: PortfolioData = {
    id: '1',
    name: 'Test Portfolio',
    currency: 'USD',
    items: [
      {
        id: '1',
        name: 'Checking',
        type: 'asset',
        category: 'Cash & Equivalents',
        value: 1000,
        lastUpdated: '2026-08-01'
      }
    ],
    history: [
      {
        date: '2026-07',
        totalAssets: 900,
        totalLiabilities: 100,
        netWorth: 800
      }
    ]
  };

  it('renders without crashing', () => {
    render(<NetWorthChart portfolio={mockPortfolio} currency="USD" />);
    
    expect(screen.getByText('Historical Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
    expect(screen.getByText('Assets vs Debt')).toBeInTheDocument();
  });
});
