import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/dashboard/Header';
import { PortfolioData } from '../types';

describe('Header', () => {
  const mockPortfolio: PortfolioData = {
    id: '1',
    name: 'Test Portfolio',
    currency: 'USD',
    items: [],
    history: []
  };

  it('renders Header correctly', () => {
    const onToggleTheme = vi.fn();
    render(
      <Header
        portfolio={mockPortfolio}
        portfoliosList={[mockPortfolio]}
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
        onToggleTheme={onToggleTheme}
      />
    );

    expect(screen.getByText('Net Worth Tracker')).toBeDefined();
  });
});
