import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddItemModal } from '../components/modals/AddItemModal';

describe('AddItemModal', () => {
  it('renders AddItemModal correctly', () => {
    const onAddItem = vi.fn();
    render(
      <AddItemModal
        isOpen={true}
        onClose={vi.fn()}
        onAddItem={onAddItem}
      />
    );

    expect(screen.getByText('Add Financial Account')).toBeDefined();
    
    // Simulate user input
    fireEvent.change(screen.getByPlaceholderText('e.g. Vanguard 401k, Primary Home, Tesla'), { target: { value: 'Test Asset' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '1000' } });

    const addButton = screen.getByText('Save Account');
    fireEvent.click(addButton);
    
    expect(onAddItem).toHaveBeenCalled();
  });
});
