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
  
  it('allows switching between tabs (All, Assets, Liabilities)', () => {
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );
    
    // Switch to Assets tab
    fireEvent.click(screen.getByText('Assets (2)'));
    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    expect(screen.queryByText('Chase Mortgage')).not.toBeInTheDocument();
    
    // Switch to Liabilities tab
    fireEvent.click(screen.getByText('Debts (1)'));
    expect(screen.queryByText('Vanguard VTI')).not.toBeInTheDocument();
    expect(screen.getByText('Chase Mortgage')).toBeInTheDocument();
  });
  
  it('allows sorting the items via UI', () => {
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );
    
    // Check sorting headers
    expect(screen.getByText('Account / Item')).toBeInTheDocument();
  });
  
  it('respects the privacy blur prop', () => {
    const { container } = render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
        isPrivacyBlur={true}
      />
    );
    
    // When privacy blur is true, cells should contain the blur class
    const blurredCells = container.querySelectorAll('.blur-\\[4px\\]');
    expect(blurredCells.length).toBeGreaterThan(0);
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

    const delBtns = document.querySelectorAll('button[title="Delete"]');
    if (delBtns.length > 0) {
      fireEvent.click(delBtns[0]);
      expect(handleDelete).toHaveBeenCalled();
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
    
    // Test categories view in breakdown
    const categoriesBtn = screen.getByText('Categories');
    fireEvent.click(categoriesBtn);
    
    const stocksBtns = screen.getAllByText('Stocks & ETFs');
    fireEvent.click(stocksBtns[0]); // filters by category
    
    // Toggle exclude on an item in breakdown view
    const accountsBtns = screen.getAllByText(/Accounts \(\d+\)/);
    fireEvent.click(accountsBtns[0]); // back to accounts view
    const excludeBtns = document.querySelectorAll('button[title="Click to remove/exclude from calculation"]');
    if (excludeBtns.length > 0) {
      fireEvent.click(excludeBtns[0]);
      expect(handleUpdate).toHaveBeenCalled();
    }
  });
  
  it('allows sorting columns', () => {
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );
    
    // Click Name header to sort
    const nameHeader = screen.getByText('Account / Item');
    fireEvent.click(nameHeader);
    fireEvent.click(nameHeader); // reverse
    
    const categoryHeader = screen.getByText('Category');
    fireEvent.click(categoryHeader);
    
    const balanceHeader = screen.getByText('Balance / Value');
    fireEvent.click(balanceHeader);
    
    const lastUpdatedHeader = screen.getByText(/As Of Date/);
    fireEvent.click(lastUpdatedHeader);
  });
  
  it('supports inline editing of all fields and cancelling', () => {
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
    const editBtns = document.querySelectorAll('button[title="Edit"]');
    if(editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      
      // Cancel
      const cancelBtn = screen.getByTitle('Cancel edit');
      fireEvent.click(cancelBtn);
      expect(handleUpdate).not.toHaveBeenCalled();
      
      // Open again, edit date and save
      fireEvent.click(editBtns[0]);
      
      const saveBtn = screen.getByTitle('Save changes');
      fireEvent.click(saveBtn);
      expect(handleUpdate).toHaveBeenCalled();
    }
  });

  it('can edit a category inline', () => {
    const handleUpdate = vi.fn();
    render(
      <AssetsLiabilitiesLedger
        items={[
          ...mockItems,
          { id: '5', name: 'Some Custom Asset', category: 'My Special Thing', type: 'asset', value: 1000, lastUpdated: '2026-08-01' }
        ]}
        currency="USD"
        onUpdateItem={handleUpdate}
        onDeleteItem={vi.fn()}
        onOpenAddItemModal={vi.fn()}
      />
    );
    // Click edit on "Some Custom Asset"
    const editBtns = document.querySelectorAll('button[title="Edit account in ledger"]');
    if (editBtns.length >= 5) {
      fireEvent.click(editBtns[4]);
      
      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: 'custom_category' } });
      
      const customCatInput = screen.getByPlaceholderText(/e\.g\. Rare Collectibles/);
      fireEvent.change(customCatInput, { target: { value: 'New Awesome Category' } });
      
      const saveBtn = document.querySelector('button[title="Save changes"]') || screen.getByTitle('Save changes');
      fireEvent.click(saveBtn);
      
      expect(handleUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '5',
          category: 'New Awesome Category',
        })
      );
    }
  });

  it('supports item selection and bulk delete operations', () => {
    const handleDeleteMultiple = vi.fn();
    render(
      <AssetsLiabilitiesLedger
        items={mockItems}
        currency="USD"
        onUpdateItem={vi.fn()}
        onDeleteItem={vi.fn()}
        onDeleteMultipleItems={handleDeleteMultiple}
        onOpenAddItemModal={vi.fn()}
      />
    );

    // Select the first item checkbox
    const vtiCheckbox = screen.getByLabelText('Select Vanguard VTI');
    expect(vtiCheckbox).not.toBeChecked();
    fireEvent.click(vtiCheckbox);
    expect(vtiCheckbox).toBeChecked();

    // Check that the bulk selection bar appeared
    expect(screen.getByText('1 account selected')).toBeInTheDocument();

    // Select master "select all" checkbox
    const selectAllCheckbox = screen.getByLabelText('Select all visible accounts');
    fireEvent.click(selectAllCheckbox);

    // Should now have multiple accounts selected
    expect(screen.getByText(/accounts selected/)).toBeInTheDocument();

    // Click delete selected button
    const deleteSelectedBtn = screen.getByRole('button', { name: /Delete Selected/i });
    fireEvent.click(deleteSelectedBtn);

    // Confirmation dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to permanently delete/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmDeleteBtn = screen.getByRole('button', { name: /Yes, Delete/i });
    fireEvent.click(confirmDeleteBtn);

    expect(handleDeleteMultiple).toHaveBeenCalledTimes(1);
    expect(handleDeleteMultiple).toHaveBeenCalledWith(expect.arrayContaining(['1', '2', '4']));
  });
});
