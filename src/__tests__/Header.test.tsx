import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/dashboard/Header';
import { PortfolioData } from '../types';

describe('Header', () => {
  const mockPortfolio: PortfolioData = {
    id: '1',
    name: 'Primary Household Portfolio',
    currency: 'USD',
    items: [],
    history: []
  };

  const mockPortfolioList: PortfolioData[] = [
    mockPortfolio,
    { id: '2', name: 'Secondary Portfolio', currency: 'EUR', items: [], history: [] }
  ];

  it('renders Header with portfolio name and currency selector', () => {
    render(
      <Header
        portfolio={mockPortfolio}
        portfoliosList={mockPortfolioList}
        selectedPortfolioId="1"
        onSelectPortfolio={vi.fn()}
        onOpenManageFilesModal={vi.fn()}
        onDeleteCurrentPortfolio={vi.fn()}
        onOpenImportModal={vi.fn()}
        onOpenGuideModal={vi.fn()}
        onOpenAddItemModal={vi.fn()}
        onOpenSettingsModal={vi.fn()}
        onOpenAuthModal={vi.fn()}
        onOpenPrivacyModal={vi.fn()}
        onExportCSV={vi.fn()}
        onPrint={vi.fn()}
        currency="USD"
        onChangeCurrency={vi.fn()}
        currentUser={null}
        theme="light"
        onToggleTheme={vi.fn()}
      />
    );

    expect(screen.getByText('Net Worth Tracker')).toBeInTheDocument();
    expect(screen.getByText('Primary Household Portfolio')).toBeInTheDocument();
  });

  it('triggers action buttons when clicked', () => {
    const onOpenImportModal = vi.fn();
    const onOpenAddItemModal = vi.fn();
    const onOpenSettingsModal = vi.fn();
    const onToggleTheme = vi.fn();

    render(
      <Header
        portfolio={mockPortfolio}
        portfoliosList={mockPortfolioList}
        selectedPortfolioId="1"
        onSelectPortfolio={vi.fn()}
        onOpenManageFilesModal={vi.fn()}
        onDeleteCurrentPortfolio={vi.fn()}
        onOpenImportModal={onOpenImportModal}
        onOpenGuideModal={vi.fn()}
        onOpenAddItemModal={onOpenAddItemModal}
        onOpenSettingsModal={onOpenSettingsModal}
        onOpenAuthModal={vi.fn()}
        onOpenPrivacyModal={vi.fn()}
        onExportCSV={vi.fn()}
        onPrint={vi.fn()}
        currency="USD"
        onChangeCurrency={vi.fn()}
        currentUser={null}
        theme="dark"
        onToggleTheme={onToggleTheme}
      />
    );

    // Import Button
    const importBtn = screen.getByText('Import Sheet');
    fireEvent.click(importBtn);
    expect(onOpenImportModal).toHaveBeenCalled();

    // Add Account Button
    const addAccountBtn = screen.getByText('Add Item');
    fireEvent.click(addAccountBtn);
    expect(onOpenAddItemModal).toHaveBeenCalled();

    // Settings Button
    const settingsBtn = screen.getByTitle('App Settings');
    fireEvent.click(settingsBtn);
    expect(onOpenSettingsModal).toHaveBeenCalled();

  });
});

