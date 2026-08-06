import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetsLiabilitiesLedger } from '../components';
import { FinancialItem } from '../types';
import '@testing-library/jest-dom';

const mockItems: FinancialItem[] = [
  {
    id: '1',
    name: 'Vanguard VTI',
    category: 'Stocks & ETFs',
    type: 'asset',
    value: 150000,
    lastUpdated: '2026-08-01'
  },
  {
    id: '2',
    name: 'Chase Mortgage',
    category: 'Mortgage',
    type: 'liability',
    value: 320000,
    lastUpdated: '2026-08-01'
  }
];

describe('AssetsLiabilitiesLedger', () => {
  it('renders assets and liabilities correctly', () => {
    const handleUpdate = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenAdd = vi.fn();

    render(
      <AssetsLiabilitiesLedger 
        items={mockItems}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={handleDelete}
        onOpenAddItemModal={handleOpenAdd}
      />
    );

    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    expect(screen.getByText('Chase Mortgage')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    const handleUpdate = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenAdd = vi.fn();

    render(
      <AssetsLiabilitiesLedger 
        items={mockItems}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={handleDelete}
        onOpenAddItemModal={handleOpenAdd}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search accounts...');
    fireEvent.change(searchInput, { target: { value: 'Vanguard' } });

    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    expect(screen.queryByText('Chase Mortgage')).not.toBeInTheDocument();
  });

  it('calls onOpenAddItemModal when add button is clicked', () => {
    const handleUpdate = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenAdd = vi.fn();

    render(
      <AssetsLiabilitiesLedger 
        items={mockItems}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={handleDelete}
        onOpenAddItemModal={handleOpenAdd}
      />
    );

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    expect(handleOpenAdd).toHaveBeenCalledTimes(1);
  });
});
