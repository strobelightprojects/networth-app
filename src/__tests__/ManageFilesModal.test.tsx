import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ManageFilesModal } from '../components/modals/ManageFilesModal';
import { PortfolioData } from '../types';

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

describe('ManageFilesModal component', () => {
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
    expect(screen.getByText('Primary Family Portfolio')).toBeDefined();
    expect(screen.getByText('Retirement Savings')).toBeDefined();
    expect(screen.getByText(/Net Worth: \$20,000/)).toBeDefined();
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
    const confirmBtn = screen.getByText('Confirm Remove');
    fireEvent.click(confirmBtn);
    expect(handleDelete).toHaveBeenCalledWith('p1');
  });

  it('allows renaming a portfolio file', () => {
    const handleRename = vi.fn();
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={mockPortfolios}
        selectedPortfolioId="p1"
        onClose={vi.fn()}
        onSelectPortfolio={vi.fn()}
        onDeletePortfolio={vi.fn()}
        onRenamePortfolio={handleRename}
        onCreatePortfolio={vi.fn()}
        onOpenImportModal={vi.fn()}
      />
    );
    
    const renameBtns = screen.getAllByTitle('Rename file');
    fireEvent.click(renameBtns[0]);
    
    const input = screen.getByDisplayValue('Primary Family Portfolio');
    fireEvent.change(input, { target: { value: 'Renamed Portfolio' } });
    
    const checkBtn = input.parentElement?.querySelector('button.bg-emerald-600') as HTMLButtonElement | null;
    if (checkBtn) fireEvent.click(checkBtn);
    
    expect(handleRename).toHaveBeenCalledWith('p1', 'Renamed Portfolio');
  });

  it('allows cancelling a rename', () => {
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
    const renameBtns = screen.getAllByTitle('Rename file');
    fireEvent.click(renameBtns[0]);
    
    const input = screen.getByDisplayValue('Primary Family Portfolio');
    const cancelBtn = input.parentElement?.querySelector('button.bg-slate-800') as HTMLButtonElement | null;
    if (cancelBtn) fireEvent.click(cancelBtn);
    
    expect(screen.getByText('Primary Family Portfolio')).toBeDefined();
  });
});
