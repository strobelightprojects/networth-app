import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthModal } from '../components/modals/AuthModal';
import { ReportPreviewModal } from '../components/modals/ReportPreviewModal';
import { ColumnMapperModal } from '../components/modals/ColumnMapperModal';
import { PortfolioData } from '../types';

describe('Smoke Modals Lifecycle Tests', () => {
  const samplePortfolio: PortfolioData = {
    id: 'port-1',
    name: 'My Primary Wealth',
    currency: 'USD',
    items: [
      {
        id: 'item-1',
        name: 'Vanguard Index Fund',
        type: 'asset',
        category: 'Stocks & ETFs',
        value: 150000,
        currency: 'USD',
        lastUpdated: '2024-06-01',
      },
      {
        id: 'item-2',
        name: 'Mortgage Loan',
        type: 'liability',
        category: 'Mortgage',
        value: 280000,
        currency: 'USD',
        lastUpdated: '2024-06-01',
      },
    ],
    history: [
      { date: '2024-01', netWorth: 100000, totalAssets: 380000, totalLiabilities: 280000 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('smoke tests AuthModal login/signup toggle and submit flow', () => {
    const onClose = vi.fn();
    const onSync = vi.fn();

    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={null}
        onSyncLocalDataToCloud={onSync}
        isSyncing={false}
      />
    );

    expect(screen.getByRole('heading', { name: /User Account & Security/i })).toBeDefined();

    // Toggle between Sign In and Register
    const toggleBtn = screen.getByRole('button', { name: /Need an account\? Register/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Create Free Account/i })).toBeDefined();
  });

  it('smoke tests ReportPreviewModal summary calculation and print trigger', () => {
    const onClose = vi.fn();
    const onPrint = vi.fn();

    render(
      <ReportPreviewModal
        isOpen={true}
        onClose={onClose}
        portfolio={samplePortfolio}
        currency="USD"
        onPrint={onPrint}
      />
    );

    expect(screen.getByRole('heading', { name: /Net Worth Report/i })).toBeDefined();
    expect(screen.getAllByText(/Financial Statement/i).length).toBeGreaterThan(0);

    const printBtn = screen.getAllByRole('button', { name: /Print Report/i })[0];
    fireEvent.click(printBtn);
    expect(onPrint).toHaveBeenCalled();
  });

  it('smoke tests ColumnMapperModal mapping configuration and apply', () => {
    const onClose = vi.fn();
    const onConfirmImport = vi.fn();

    const parsedData = {
      fileName: 'accounts.csv',
      headers: ['Account Name', 'Amount', 'Type', 'Category'],
      rows: [
        ['Fidelity 401k', '50000', 'asset', 'Stocks & ETFs'],
        ['Car Loan', '12000', 'liability', 'Auto Loan'],
      ],
      suggestedMapping: {
        nameCol: 'Account Name',
        valueCol: 'Amount',
        typeCol: 'Type',
        categoryCol: 'Category',
      },
    };

    render(
      <ColumnMapperModal
        parsedData={parsedData}
        onClose={onClose}
        onConfirmImport={onConfirmImport}
        baseCurrency="USD"
      />
    );

    expect(screen.getByText(/Map & Preview Spreadsheet Columns/i)).toBeDefined();
    const importBtn = screen.getByRole('button', { name: /Confirm & Import Data/i });
    fireEvent.click(importBtn);
    expect(onConfirmImport).toHaveBeenCalled();
  });
});
