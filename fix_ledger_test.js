import fs from 'fs';
const testCode = `
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetsLiabilitiesLedger } from '../components';
import { FinancialItem } from '../types';
import '@testing-library/jest-dom';

const mockItems: FinancialItem[] = [
  { id: '1', name: 'Vanguard VTI', category: 'Stocks & ETFs', type: 'asset', value: 150000, lastUpdated: '2026-08-01' },
  { id: '2', name: 'Chase Mortgage', category: 'Mortgage', type: 'liability', value: 320000, lastUpdated: '2026-08-01' },
  { id: '3', name: 'Excluded Asset', category: 'Real Estate', type: 'asset', value: 500000, lastUpdated: '2026-08-02', isExcluded: true },
  { id: '4', name: 'Term Life', category: 'Term Life Insurance', type: 'insurance', value: 1000000, lastUpdated: '2026-08-03' },
];

describe('AssetsLiabilitiesLedger', () => {
  it('renders and interactions', () => {
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
    
    // Check initial render
    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    
    // Check type filters
    fireEvent.click(screen.getByText(/Assets \\(/));
    expect(screen.getByText('Vanguard VTI')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Debts \\(/));
    expect(screen.getByText('Chase Mortgage')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Insurance \\(/));
    expect(screen.getByText('Term Life')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/Excluded \\(/));
    expect(screen.getByText('Excluded Asset')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/All Records \\(/));
    
    // Edit item
    const editButtons = screen.queryAllByTitle('Edit Account');
    if(editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
    }
    
    // Delete item
    const delButtons = screen.queryAllByTitle('Delete Account');
    if(delButtons.length > 0) {
      fireEvent.click(delButtons[0]);
    }
    
    // Show net worth breakdown
    const showBreakdown = screen.queryByText('Show Breakdown');
    if (showBreakdown) fireEvent.click(showBreakdown);
    
    const viewCategory = screen.queryByText('View by Category');
    if (viewCategory) fireEvent.click(viewCategory);
    
  });
});
`;
fs.writeFileSync('src/__tests__/AssetsLiabilitiesLedger.test.tsx', testCode);
