import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetsLiabilitiesLedger } from '../components/dashboard/AssetsLiabilitiesLedger';
import { FinancialItem } from '../types';

describe('AssetsLiabilitiesLedger feature tests', () => {
  const items: FinancialItem[] = [
    {
      id: '1',
      name: 'Vanguard Total Stock Market',
      type: 'asset',
      category: 'Stocks & ETFs',
      value: 120000,
      currency: 'USD',
      lastUpdated: '2024-05-01',
    },
    {
      id: '2',
      name: 'Primary Home Loan',
      type: 'liability',
      category: 'Mortgage',
      value: 350000,
      currency: 'USD',
      lastUpdated: '2024-05-01',
    },
    {
      id: '3',
      name: 'Prudential Death Benefit Policy',
      type: 'insurance',
      category: 'Whole Life Insurance',
      value: 500000,
      currency: 'USD',
      lastUpdated: '2024-05-01',
    },
  ];

  const onUpdateItem = vi.fn();
  const onDeleteItem = vi.fn();
  const onOpenAddItemModal = vi.fn();

  it('renders all accounts across assets, liabilities, and insurance', () => {
    render(
      <AssetsLiabilitiesLedger
        items={items}
        currency="USD"
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onOpenAddItemModal={onOpenAddItemModal}
      />
    );

    expect(screen.getByText('Vanguard Total Stock Market')).toBeDefined();
    expect(screen.getByText('Primary Home Loan')).toBeDefined();
    expect(screen.getByText('Prudential Death Benefit Policy')).toBeDefined();
  });

  it('filters items when search input is used', () => {
    render(
      <AssetsLiabilitiesLedger
        items={items}
        currency="USD"
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onOpenAddItemModal={onOpenAddItemModal}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Vanguard' } });

    expect(screen.getByText('Vanguard Total Stock Market')).toBeDefined();
    expect(screen.queryByText('Primary Home Loan')).toBeNull();
  });

  it('triggers delete callback when delete button is clicked', () => {
    render(
      <AssetsLiabilitiesLedger
        items={items}
        currency="USD"
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onOpenAddItemModal={onOpenAddItemModal}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(onDeleteItem).toHaveBeenCalled();
  });

  it('triggers add item modal callback when Add Item button is clicked', () => {
    render(
      <AssetsLiabilitiesLedger
        items={items}
        currency="USD"
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onOpenAddItemModal={onOpenAddItemModal}
      />
    );

    const addButtons = screen.getAllByText('Add Item');
    fireEvent.click(addButtons[0]);

    expect(onOpenAddItemModal).toHaveBeenCalled();
  });
});
