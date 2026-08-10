import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMapperModal } from '../components/modals/ColumnMapperModal';
import { ParsedSheetData } from '../types';

describe('ColumnMapperModal', () => {
  it('renders ColumnMapperModal correctly', () => {
    const onConfirm = vi.fn();
    const mockData: ParsedSheetData = {
      fileName: 'test.xlsx',
      sheetNames: ['Sheet1'],
      activeSheetName: 'Sheet1',
      headers: ['Item Name', 'Amount'],
      rows: [['Cash', '1000']],
    };
    
    render(
      <ColumnMapperModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        parsedData={mockData}
      />
    );

    expect(screen.getByText('Map Spreadsheet Columns')).toBeDefined();
    expect(screen.getAllByText('Item Name')[0]).toBeDefined();
  });
});
