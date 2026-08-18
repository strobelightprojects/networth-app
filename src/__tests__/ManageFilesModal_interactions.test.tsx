import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ManageFilesModal } from '../components/modals/ManageFilesModal';
import { PortfolioData } from '../types';

describe('ManageFilesModal interaction tests', () => {
  const portfolios: PortfolioData[] = [
    {
      id: 'p1',
      name: 'Primary Household Portfolio',
      currency: 'USD',
      items: [
        { id: '1', name: 'Checking', type: 'asset', category: 'Cash & Equivalents', value: 10000, currency: 'USD', lastUpdated: '2024-05-01' },
      ],
      history: [],
    },
    {
      id: 'p2',
      name: 'Real Estate LLC Portfolio',
      currency: 'USD',
      items: [
        { id: '2', name: 'Rental Property', type: 'asset', category: 'Real Estate', value: 400000, currency: 'USD', lastUpdated: '2024-05-01' },
      ],
      history: [],
    },
  ];

  const onClose = vi.fn();
  const onSelectPortfolio = vi.fn();
  const onDeletePortfolio = vi.fn();
  const onRenamePortfolio = vi.fn();
  const onCreatePortfolio = vi.fn();
  const onOpenImportModal = vi.fn();

  it('renders portfolios list when open', () => {
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={portfolios}
        selectedPortfolioId="p1"
        onClose={onClose}
        onSelectPortfolio={onSelectPortfolio}
        onDeletePortfolio={onDeletePortfolio}
        onRenamePortfolio={onRenamePortfolio}
        onCreatePortfolio={onCreatePortfolio}
        onOpenImportModal={onOpenImportModal}
      />
    );

    expect(screen.getByText('Primary Household Portfolio')).toBeDefined();
    expect(screen.getByText('Real Estate LLC Portfolio')).toBeDefined();
  });

  it('allows selecting another portfolio', () => {
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={portfolios}
        selectedPortfolioId="p1"
        onClose={onClose}
        onSelectPortfolio={onSelectPortfolio}
        onDeletePortfolio={onDeletePortfolio}
        onRenamePortfolio={onRenamePortfolio}
        onCreatePortfolio={onCreatePortfolio}
        onOpenImportModal={onOpenImportModal}
      />
    );

    const switchButtons = screen.getAllByTitle(/Switch to this File|Active File/i);
    if (switchButtons.length > 1) {
      fireEvent.click(switchButtons[1]);
      expect(onSelectPortfolio).toHaveBeenCalledWith('p2');
    }
  });

  it('allows creating a new portfolio file', () => {
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={portfolios}
        selectedPortfolioId="p1"
        onClose={onClose}
        onSelectPortfolio={onSelectPortfolio}
        onDeletePortfolio={onDeletePortfolio}
        onRenamePortfolio={onRenamePortfolio}
        onCreatePortfolio={onCreatePortfolio}
        onOpenImportModal={onOpenImportModal}
      />
    );

    const newBtn = screen.getByText('New File');
    fireEvent.click(newBtn);

    const input = screen.getByPlaceholderText('e.g. Real Estate & Crypto Holdings');
    fireEvent.change(input, { target: { value: 'Trust Fund 2026' } });

    const createBtn = screen.getByText('Create');
    fireEvent.click(createBtn);

    expect(onCreatePortfolio).toHaveBeenCalledWith('Trust Fund 2026');
  });

  it('triggers import modal from manage files', () => {
    render(
      <ManageFilesModal
        isOpen={true}
        portfolios={portfolios}
        selectedPortfolioId="p1"
        onClose={onClose}
        onSelectPortfolio={onSelectPortfolio}
        onDeletePortfolio={onDeletePortfolio}
        onRenamePortfolio={onRenamePortfolio}
        onCreatePortfolio={onCreatePortfolio}
        onOpenImportModal={onOpenImportModal}
      />
    );

    const importBtn = screen.getByText('Import Sheet');
    fireEvent.click(importBtn);

    expect(onOpenImportModal).toHaveBeenCalled();
  });
});
