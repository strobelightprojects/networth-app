import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddItemModal } from '../components/modals/AddItemModal';

describe('AddItemModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders AddItemModal correctly and handles asset account creation', () => {
    const onAddItem = vi.fn();
    const onClose = vi.fn();

    render(
      <AddItemModal
        isOpen={true}
        onClose={onClose}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    expect(screen.getByText('Add Financial Account')).toBeInTheDocument();

    // Input item details
    fireEvent.change(screen.getByPlaceholderText(/Vanguard 401k/), { target: { value: 'Vanguard Roth IRA' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '25000' } });

    const addButton = screen.getByText('Save Account');
    fireEvent.click(addButton);

    expect(onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Vanguard Roth IRA',
        type: 'asset',
        value: 25000,
        originalValue: 25000,
        currency: 'USD',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AddItemModal
        isOpen={false}
        onClose={vi.fn()}
        onAddItem={vi.fn()}
      />
    );

    expect(screen.queryByText('Add Financial Account')).toBeNull();
  });

  it('allows switching to Liability and submitting debt item', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    const liabilityTab = screen.getByText('Liability');
    fireEvent.click(liabilityTab);

    fireEvent.change(screen.getByPlaceholderText(/UK Mortgage/), { target: { value: 'Primary Mortgage' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '350000' } });

    fireEvent.click(screen.getByText('Save Account'));

    expect(onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Primary Mortgage',
        type: 'liability',
        category: 'Mortgage',
        value: 350000,
      })
    );
  });

  it('allows switching to Insurance type', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    const insuranceTab = screen.getByText('Insurance');
    fireEvent.click(insuranceTab);

    fireEvent.change(screen.getByPlaceholderText(/Term Life \$1M/), { target: { value: 'Term Life Policy' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '500000' } });

    fireEvent.click(screen.getByText('Save Account'));

    expect(onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Term Life Policy',
        type: 'insurance',
        category: 'Term Life Insurance',
        value: 500000,
      })
    );
  });

  it('supports creating custom categories', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    const categorySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categorySelect, { target: { value: 'custom_category' } });

    const customCatInput = screen.getByPlaceholderText(/Rare Collectibles/);
    fireEvent.change(customCatInput, { target: { value: 'Art & Antiques' } });

    fireEvent.change(screen.getByPlaceholderText(/Vanguard 401k/), { target: { value: 'Picasso Painting' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '45000' } });

    fireEvent.click(screen.getByText('Save Account'));

    expect(onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Picasso Painting',
        category: 'Art & Antiques',
        value: 45000,
      })
    );
  });

  it('supports foreign currency selection and exclusion toggling', async () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    // Enter name
    fireEvent.change(screen.getByPlaceholderText(/Vanguard 401k/), { target: { value: 'London Flat' } });
    
    // Change currency
    const currencySelects = screen.getAllByRole('combobox');
    fireEvent.change(currencySelects[1], { target: { value: 'GBP' } });
    
    // Set value
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '500000' } });

    fireEvent.click(screen.getByText('Save Account'));

    expect(onAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'London Flat',
        currency: 'GBP',
        originalValue: 500000,
      })
    );
  });

  it('selects existing categories and auto updates type', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );
    const categorySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(categorySelect, { target: { value: 'Mortgage' } });
    
    // Type should now be liability, meaning name placeholder changes
    expect(screen.getByPlaceholderText(/UK Mortgage/)).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: 'Disability Insurance' } });
    // Type should now be insurance
    expect(screen.getByPlaceholderText(/Term Life \$1M/)).toBeInTheDocument();

    fireEvent.change(categorySelect, { target: { value: 'Real Estate' } });
    expect(screen.getByPlaceholderText(/Vanguard 401k/)).toBeInTheDocument();
  });

  it('renders custom categories if existing items have them', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
        existingItems={[
          {
            id: '1',
            name: 'Rolex',
            type: 'asset',
            value: 10000,
            currency: 'USD',
            category: 'Watches', // Custom category
            lastUpdated: new Date().toISOString()
          }
        ]}
      />
    );

    const categorySelect = screen.getAllByRole('combobox')[0];
    expect(categorySelect.innerHTML).toContain('Your Custom Categories');
    expect(categorySelect.innerHTML).toContain('Watches');
  });

  it('changes item date', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
        baseCurrency="USD"
      />
    );

    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2023-01-01' } });
      expect((dateInput as HTMLInputElement).value).toBe('2023-01-01');
    }
  });

  it('does not submit when required fields are missing', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        baseCurrency="USD"
        onClose={vi.fn()}
        onAddItem={onAddItem}
      />
    );

    const submitBtn = screen.getByText('Save Account');
    fireEvent.click(submitBtn);

    expect(onAddItem).not.toHaveBeenCalled();
  });
});

