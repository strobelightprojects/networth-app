import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnMapperModal } from '../components/modals/ColumnMapperModal';
import { ParsedSheetData } from '../types';

describe('ColumnMapperModal', () => {
  const mockData: ParsedSheetData = {
    fileName: 'test_portfolio_2026.xlsx',
    sheetNames: ['Sheet1'],
    activeSheetName: 'Sheet1',
    headers: ['Account Name', 'Balance', 'Category', 'Type'],
    rows: [
      { 'Account Name': 'Checking Account', 'Balance': '5000', 'Category': 'Cash & Equivalents', 'Type': 'Asset' },
      { 'Account Name': 'Credit Card Debt', 'Balance': '1200', 'Category': 'Credit Cards', 'Type': 'Liability' },
    ],
  };

  it('renders ColumnMapperModal correctly and handles column selection & confirm', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ColumnMapperModal
        parsedData={mockData}
        baseCurrency="USD"
        onClose={onClose}
        onConfirmImport={onConfirm}
      />
    );

    expect(screen.getByText('Map & Preview Spreadsheet Columns')).toBeInTheDocument();

    // Confirm button click
    const confirmBtn = screen.getByText('Confirm & Import Data');
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when parsedData is null', () => {
    render(
      <ColumnMapperModal
        parsedData={null}
        baseCurrency="USD"
        onClose={vi.fn()}
        onConfirmImport={vi.fn()}
      />
    );

    expect(screen.queryByText('Map & Preview Spreadsheet Columns')).toBeNull();
  });

  it('allows switching between Parsed Items Preview and Raw Spreadsheet tabs', () => {
    render(
      <ColumnMapperModal
        parsedData={mockData}
        baseCurrency="USD"
        onClose={vi.fn()}
        onConfirmImport={vi.fn()}
      />
    );

    const rawTab = screen.getByText(/Raw Spreadsheet/);
    fireEvent.click(rawTab);

    expect(screen.getByText(/Raw Spreadsheet \(2 rows\)/)).toBeInTheDocument();

    const parsedTab = screen.getByText(/Parsed Items Preview/);
    fireEvent.click(parsedTab);


    expect(screen.getByText('Checking Account')).toBeInTheDocument();
  });
});

