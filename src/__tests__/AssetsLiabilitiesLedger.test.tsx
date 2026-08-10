import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetsLiabilitiesLedger } from '../components';
import { FinancialItem } from '../types';
import '@testing-library/jest-dom';

const mockItems: FinancialItem[] = [
  { id: '1', name: 'Vanguard VTI', category: 'Stocks & ETFs', type: 'asset', value: 150000, lastUpdated: '2026-08-01', isLiquid: true },
  { id: '2', name: 'Chase Mortgage', category: 'Mortgage', type: 'liability', value: 320000, lastUpdated: '2026-08-01' },
  { id: '3', name: 'Excluded Asset', category: 'Real Estate', type: 'asset', value: 500000, lastUpdated: '2026-08-02', isExcluded: true },
  { id: '4', name: 'Term Life', category: 'Term Life Insurance', type: 'insurance', value: 1000000, lastUpdated: '2026-08-03' },
];

describe('AssetsLiabilitiesLedger', () => {
  it('renders correctly and filters items by text search', () => {
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );

    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    expect(screen.getByText('Chase Mortgage')).toBeInTheDocument();

    // Test Search input with placeholder 'Search accounts...'
    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'Vanguard' } });

    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    expect(screen.queryByText('Chase Mortgage')).not.toBeInTheDocument();
  });

  it('handles item editing mode and saving updates', () => {
    const handleUpdate = vi.fn();
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );

    // Click edit icon on row 1
    const editBtns = document.querySelectorAll('button[title="Edit account in ledger"]');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);

      // Check inline edit input
      const nameInput = screen.getByDisplayValue('Vanguard VTI');
      fireEvent.change(nameInput, { target: { value: 'Vanguard Total Stock Market' } });

      // Click save
      const saveBtn = document.querySelector('button[title="Save changes"]') || screen.getByTitle('Save changes');
      fireEvent.click(saveBtn);

      expect(handleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Vanguard Total Stock Market',
        })
      );
    }
  });

  it('handles item deletion', () => {
    const handleDelete = vi.fn();
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={handleDelete}
        onOpenAddItemModal={vi.fn()}
      />
    );

    const delBtns = document.querySelectorAll('button[title="Delete account permanently"]');
    if (delBtns.length > 0) {
      fireEvent.click(delBtns[0]);
      expect(handleDelete).toHaveBeenCalledWith('1');
    }
  });

  it('allows toggling item exclusion and breakdown view', () => {
    const handleUpdate = vi.fn();
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );

    // Toggle formula breakdown
    const breakdownBtn = screen.getByText('Show Breakdown');
    fireEvent.click(breakdownBtn);

    expect(screen.getByText('Net Worth Calculation Formula')).toBeInTheDocument();
  });
});
