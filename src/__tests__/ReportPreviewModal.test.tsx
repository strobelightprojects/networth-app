import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportPreviewModal } from '../components/modals/ReportPreviewModal';
import { PortfolioData } from '../types';

const mockPortfolio: PortfolioData = {
  id: 'p1',
  name: 'Primary Household Portfolio',
  currency: 'USD',
  items: [
    {
      id: 'i1',
      name: 'Chase Checking',
      category: 'Cash & Equivalents',
      type: 'asset',
      value: 15000,
      currency: 'USD',
      isLiquid: true,
      lastUpdated: '2026-08-01',
    },
    {
      id: 'i2',
      name: 'Primary Residence',
      category: 'Real Estate',
      type: 'asset',
      value: 450000,
      currency: 'USD',
      isLiquid: false,
      lastUpdated: '2026-08-05',
    },
    {
      id: 'i3',
      name: 'Mortgage Loan',
      category: 'Mortgages',
      type: 'liability',
      value: 280000,
      currency: 'USD',
      isLiquid: false,
      lastUpdated: '2026-08-08',
    },
  ],
  history: [],
};

describe('ReportPreviewModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ReportPreviewModal
        isOpen={false}
        onClose={vi.fn()}
        portfolio={mockPortfolio}
        currency="USD"
        onPrint={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with portfolio financial summary and ledger table', () => {
    render(
      <ReportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        portfolio={mockPortfolio}
        currency="USD"
        onPrint={vi.fn()}
      />
    );

    expect(screen.getByText('Net Worth Report')).toBeInTheDocument();
    expect(screen.getByText('Primary Household Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Chase Checking')).toBeInTheDocument();
    expect(screen.getByText('Primary Residence')).toBeInTheDocument();
    expect(screen.getByText('Mortgage Loan')).toBeInTheDocument();

    // Check financial totals: Net Worth = 15k + 450k - 280k = 185,000
    expect(screen.getAllByText('$185,000').length).toBeGreaterThan(0); // Net Worth
    expect(screen.getAllByText('$465,000').length).toBeGreaterThan(0); // Total Assets
    expect(screen.getAllByText('$280,000').length).toBeGreaterThan(0); // Total Liabilities
  });

  it('filters items by date range', () => {
    const { container } = render(
      <ReportPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        portfolio={mockPortfolio}
        currency="USD"
        onPrint={vi.fn()}
      />
    );

    const inputs = container.querySelectorAll('input');
    const startDateInput = inputs[0];
    const endDateInput = inputs[1];

    // Filter to only include items on or after 2026-08-06
    fireEvent.change(startDateInput, { target: { value: '2026-08-06' } });

    // Chase Checking (2026-08-01) and Primary Residence (2026-08-05) should be filtered out
    expect(screen.queryByText('Chase Checking')).not.toBeInTheDocument();
    expect(screen.queryByText('Primary Residence')).not.toBeInTheDocument();
    expect(screen.getByText('Mortgage Loan')).toBeInTheDocument();

    // Clear filter
    fireEvent.click(screen.getByText('Clear Filter'));
    expect(screen.getByText('Chase Checking')).toBeInTheDocument();
  });

  it('calls onPrint and onClose when Print Report is clicked', () => {
    const handleClose = vi.fn();
    const handlePrint = vi.fn();

    render(
      <ReportPreviewModal
        isOpen={true}
        onClose={handleClose}
        portfolio={mockPortfolio}
        currency="USD"
        onPrint={handlePrint}
      />
    );

    const printButtons = screen.getAllByRole('button', { name: /Print Report/i });
    fireEvent.click(printButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handlePrint).toHaveBeenCalledWith('', '');
  });
});
