import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ManageFilesModal } from '../components/modals/ManageFilesModal';
import { PortfolioData } from '../types';

describe('ManageFilesModal component', () => {
  const mockPortfolios: PortfolioData[] = [
    {
      id: 'p1',
      name: 'Primary Family Portfolio',
      currency: 'USD',
      items: [
        { id: '1', name: 'Savings Account', type: 'asset', category: 'Cash & Equivalents', value: 25000, lastUpdated: '2026-08-01' },
        { id: '2', name: 'Car Loan', type: 'liability', category: 'Auto Loans', value: 5000, lastUpdated: '2026-08-01' },
      ],
      history: [],
    },
    {
      id: 'p2',
      name: 'Retirement Savings',
      currency: 'USD',
      items: [
        { id: '3', name: '401k Account', type: 'asset', category: 'Retirement (401k/IRA)', value: 120000, lastUpdated: '2026-08-01' },
      ],
      history: [],
    },
  ];

  it('renders portfolio files and calculates net worth correctly', () => {
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={mockPortfolios}
        selectedPortfolioId="p1"
        onClose={vi.fn()}
        onSelectPortfolio={vi.fn()}
        onDeletePortfolio={vi.fn()}
        onRenamePortfolio={vi.fn()}
        onCreatePortfolio={vi.fn()}
        onOpenImportModal={vi.fn()}
      />
    );

    expect(screen.getByText('Primary Family Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Retirement Savings')).toBeInTheDocument();
    expect(screen.getByText(/Net Worth: \$20,000/)).toBeInTheDocument();
  });

  it('allows creating a new portfolio file', () => {
    const handleCreate = vi.fn();
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={mockPortfolios}
        selectedPortfolioId="p1"
        onClose={vi.fn()}
        onSelectPortfolio={vi.fn()}
        onDeletePortfolio={vi.fn()}
        onRenamePortfolio={vi.fn()}
        onCreatePortfolio={handleCreate}
        onOpenImportModal={vi.fn()}
      />
    );

    const newFileBtn = screen.getByText('New File');
    fireEvent.click(newFileBtn);

    const input = screen.getByPlaceholderText('e.g. Real Estate & Crypto Holdings');
    fireEvent.change(input, { target: { value: 'Real Estate Portfolio' } });

    const createBtn = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(createBtn);

    expect(handleCreate).toHaveBeenCalledWith('Real Estate Portfolio');
  });

  it('shows delete confirmation and calls onDeletePortfolio upon confirmation', () => {
    const handleDelete = vi.fn();
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={mockPortfolios}
        selectedPortfolioId="p1"
        onClose={vi.fn()}
        onSelectPortfolio={vi.fn()}
        onDeletePortfolio={handleDelete}
        onRenamePortfolio={vi.fn()}
        onCreatePortfolio={vi.fn()}
        onOpenImportModal={vi.fn()}
      />
    );

    const removeBtns = screen.getAllByTitle('Remove file');
    fireEvent.click(removeBtns[0]);

    expect(screen.getByText(/Delete "Primary Family Portfolio"\?/)).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm Remove');
    fireEvent.click(confirmBtn);

    expect(handleDelete).toHaveBeenCalledWith('p1');
  });
});
