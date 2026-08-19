import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllocationChart } from '../components/charts/AllocationChart';
import { PortfolioData } from '../types';
import '@testing-library/jest-dom';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('AllocationChart', () => {
  const mockPortfolio: PortfolioData = {
    id: '1',
    name: 'Test Portfolio',
    currency: 'USD',
    items: [
      { id: '1', name: 'Emergency Fund', category: 'Cash & Equivalents', value: 10000, type: 'asset', lastUpdated: '2026-08-10' },
      { id: '2', name: 'Vanguard VTI', category: 'Stocks & ETFs', value: 50000, type: 'asset', lastUpdated: '2026-08-10' },
      { id: '3', name: 'Home Mortgage', category: 'Mortgage', value: 250000, type: 'liability', lastUpdated: '2026-08-10' },
      { id: '4', name: 'Term Policy', category: 'Term Life Insurance', value: 500000, type: 'insurance', lastUpdated: '2026-08-10' },
    ],
    history: []
  };

  it('renders correctly and allows view mode switching', () => {
    render(<AllocationChart portfolio={mockPortfolio} currency="USD" />);
    
    expect(screen.getByText('Portfolio Allocation')).toBeInTheDocument();
    expect(screen.getByText('Stocks & ETFs')).toBeInTheDocument();
    expect(screen.getByText('Cash & Equivalents')).toBeInTheDocument();

    // Switch to Debt view
    fireEvent.click(screen.getByRole('button', { name: 'Debt' }));
    expect(screen.getByText('Mortgage')).toBeInTheDocument();

    // Switch to Insurance view
    fireEvent.click(screen.getByRole('button', { name: 'Insurance' }));
    expect(screen.getByText('Term Life Insurance')).toBeInTheDocument();
  });

  it('allows expanding and collapsing categories to view underlying holdings', () => {
    render(<AllocationChart portfolio={mockPortfolio} currency="USD" />);

    // Click on Stocks & ETFs category button
    const stocksBtn = screen.getByText('Stocks & ETFs');
    fireEvent.click(stocksBtn);

    // Underlying holding 'Vanguard VTI' should now be visible
    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(stocksBtn);
    expect(screen.queryByText('Vanguard VTI')).not.toBeInTheDocument();
  });
  
  it('handles empty portfolio state correctly', () => {
    const emptyPortfolio: PortfolioData = {
      id: 'empty-1',
      name: 'Empty Portfolio',
      currency: 'USD',
      items: [],
      history: []
    };
    render(<AllocationChart portfolio={emptyPortfolio} currency="USD" />);
    
    // Test for $0 in center of donut when empty
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});

