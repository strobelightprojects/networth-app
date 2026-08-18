import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from '../components/modals/SettingsModal';

describe('SettingsModal interaction tests', () => {
  const onClose = vi.fn();
  const onExportCSV = vi.fn();
  const onPrint = vi.fn();
  const onPreviewReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders modal with API key configurations and export options', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
        onPreviewReport={onPreviewReport}
      />
    );

    expect(screen.getByRole('heading', { name: /App & Preferences Settings/i })).toBeDefined();
    expect(screen.getByText('Select AI Provider')).toBeDefined();
  });

  it('saves provider and API key to localStorage', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
        onPreviewReport={onPreviewReport}
      />
    );

    const keyInput = screen.getByPlaceholderText(/Enter your Gemini API Key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSy-test-secret-key-123' } });

    const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
    fireEvent.click(saveBtn);

    expect(localStorage.getItem('aiApiKey')).toBe('AIzaSy-test-secret-key-123');
  });

  it('triggers CSV export and PDF preview buttons', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        onExportCSV={onExportCSV}
        onPrint={onPrint}
        onPreviewReport={onPreviewReport}
      />
    );

    const exportBtn = screen.getByText('Download CSV');
    fireEvent.click(exportBtn);
    expect(onExportCSV).toHaveBeenCalled();

    const reportBtn = screen.getByText('Net Worth Report');
    fireEvent.click(reportBtn);
    expect(onPreviewReport).toHaveBeenCalled();
  });
});
