import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../components/modals/SettingsModal';

describe('SettingsModal', () => {
  it('renders SettingsModal correctly', () => {
    const onExportCSV = vi.fn();
    const onPrint = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
      />
    );

    expect(screen.getByText('App & Preferences Settings')).toBeDefined();
    
    const printButton = screen.getByText('Print / Save as PDF');
    fireEvent.click(printButton);
    expect(onPrint).toHaveBeenCalled();
  });
});
