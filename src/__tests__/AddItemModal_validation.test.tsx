import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddItemModal } from '../components/modals/AddItemModal';

describe('AddItemModal validation and feature tests', () => {
  const onClose = vi.fn();
  const onAddItem = vi.fn();

  it('renders modal when open and allows switching between Asset, Liability, and Insurance', () => {
    render(
      <AddItemModal
        isOpen={true}
        baseCurrency="USD"
        onClose={onClose}
        onAddItem={onAddItem}
      />
    );

    expect(screen.getByText('Add Financial Account')).toBeDefined();
    
    // Switch to Liability
    const liabilityBtn = screen.getByRole('button', { name: 'Liability' });
    fireEvent.click(liabilityBtn);
    
    // Check liability categories exist
    expect(screen.getByText('Mortgage')).toBeDefined();

    // Switch to Insurance
    const insuranceBtn = screen.getByRole('button', { name: 'Insurance' });
    fireEvent.click(insuranceBtn);

    expect(screen.getByText('Term Life Insurance')).toBeDefined();
  });

  it('submits valid new item correctly', () => {
    render(
      <AddItemModal
        isOpen={true}
        baseCurrency="USD"
        onClose={onClose}
        onAddItem={onAddItem}
      />
    );

    const nameInput = screen.getByPlaceholderText(/e.g. Vanguard 401k/i);
    fireEvent.change(nameInput, { target: { value: 'Apple Stock' } });

    const valueInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(valueInput, { target: { value: '15000' } });

    const submitBtn = screen.getByText('Save Account');
    fireEvent.click(submitBtn);

    expect(onAddItem).toHaveBeenCalled();
    const createdItem = onAddItem.mock.calls[0][0];
    expect(createdItem.name).toBe('Apple Stock');
    expect(createdItem.value).toBe(15000);
    expect(createdItem.type).toBe('asset');
  });

  it('does not submit when required fields are missing', () => {
    onAddItem.mockClear();
    render(
      <AddItemModal
        isOpen={true}
        baseCurrency="USD"
        onClose={onClose}
        onAddItem={onAddItem}
      />
    );

    const submitBtn = screen.getByText('Save Account');
    fireEvent.click(submitBtn);

    expect(onAddItem).not.toHaveBeenCalled();
  });
});
