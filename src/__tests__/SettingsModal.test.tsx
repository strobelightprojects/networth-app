import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../components/modals/SettingsModal';

describe('SettingsModal', () => {
  it('renders SettingsModal correctly', () => {
    const onExportCSV = vi.fn();
    const onPreviewReport = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onExportCSV={onExportCSV}
        onPreviewReport={onPreviewReport}
      />
    );

    expect(screen.getByText('App & Preferences Settings')).toBeDefined();
    
    const reportButton = screen.getByText('Net Worth Report');
    fireEvent.click(reportButton);
    expect(onPreviewReport).toHaveBeenCalled();
  });
});
