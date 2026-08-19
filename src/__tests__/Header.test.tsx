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
    const onSelectPortfolio = vi.fn();
    const onOpenManageFilesModal = vi.fn();
    const onDeleteCurrentPortfolio = vi.fn();
    const onOpenAuthModal = vi.fn();

    render(
      <Header
        portfolio={mockPortfolio}
        portfoliosList={mockPortfolioList}
        selectedPortfolioId="1"
        onSelectPortfolio={onSelectPortfolio}
        onOpenManageFilesModal={onOpenManageFilesModal}
        onDeleteCurrentPortfolio={onDeleteCurrentPortfolio}
        onOpenImportModal={onOpenImportModal}
        onOpenGuideModal={vi.fn()}
        onOpenAddItemModal={onOpenAddItemModal}
        onOpenSettingsModal={onOpenSettingsModal}
        onOpenAuthModal={onOpenAuthModal}
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
    const importBtn = screen.getByText('Import Data');
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
    
    // Sign In Button
    const signInBtn = screen.getByTitle('Account & Cloud Storage');
    fireEvent.click(signInBtn);
    expect(onOpenAuthModal).toHaveBeenCalled();

    // Manage Files Button
    const manageFilesBtn = screen.getByTitle('Manage & Remove Portfolio Files');
    fireEvent.click(manageFilesBtn);
    expect(onOpenManageFilesModal).toHaveBeenCalled();
    
    // Delete File Button
    const deleteBtn = screen.getByTitle('Remove file "Primary Household Portfolio"');
    fireEvent.click(deleteBtn);
    expect(onDeleteCurrentPortfolio).toHaveBeenCalled();
    
    // Select dropdown
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    expect(onSelectPortfolio).toHaveBeenCalledWith('2');
  });
  
  it('toggles mobile menu and handles mobile actions', () => {
    const onOpenImportModal = vi.fn();
    const onOpenAuthModal = vi.fn();
    const onOpenSettingsModal = vi.fn();
    const onOpenAddItemModal = vi.fn();

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
        onOpenAuthModal={onOpenAuthModal}
        onExportCSV={vi.fn()}
        onPrint={vi.fn()}
        currency="USD"
        onChangeCurrency={vi.fn()}
        currentUser={{ email: 'test@example.com' } as any}
        theme="light"
      />
    );

    // Check quick add item on mobile
    const mobileAddBtn = screen.getByTitle('Add Item');
    fireEvent.click(mobileAddBtn);
    expect(onOpenAddItemModal).toHaveBeenCalled();
    
    // Toggle Menu
    const toggleBtn = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(toggleBtn);
    
    // Mobile buttons are now visible
    const mobileImportBtn = screen.getAllByText('Import Data')[1]; // Desktop + Mobile
    fireEvent.click(mobileImportBtn);
    expect(onOpenImportModal).toHaveBeenCalled();
    
    fireEvent.click(toggleBtn); // Re-open
    const mobileAccountBtn = screen.getByText('Account Active');
    fireEvent.click(mobileAccountBtn);
    expect(onOpenAuthModal).toHaveBeenCalled();
    
    fireEvent.click(toggleBtn); // Re-open
    const mobileSettingsBtn = screen.getByText('Settings & Export');
    fireEvent.click(mobileSettingsBtn);
    expect(onOpenSettingsModal).toHaveBeenCalled();
  });
});

