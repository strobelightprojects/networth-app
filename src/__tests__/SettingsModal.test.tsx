import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../components/modals/SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders SettingsModal correctly when open', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('App & Preferences Settings')).toBeInTheDocument();
    expect(screen.getByText('AI Model & Provider Configuration')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('App & Preferences Settings')).toBeNull();
  });

  it('triggers onExportCSV with start and end dates', () => {
    const onExportCSV = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        onExportCSV={onExportCSV}
      />
    );

    const dateInputs = screen.getAllByDisplayValue('');
    // By adding the category manager, there are now more inputs with empty display values initially.
    // However, since type="date" isn't fully supported across all jsdom environments, querying by display value for date fields is brittle.
    // Querying by label text instead is more robust.
    
    // The labels in the component are: "Start Date (Optional)" and "End Date (Optional)"
    const startDateLabel = screen.getByText('Start Date (Optional)');
    const endDateLabel = screen.getByText('End Date (Optional)');
    
    // The inputs are the next sibling element after the label
    const startDateInput = startDateLabel.nextElementSibling as HTMLInputElement;
    const endDateInput = endDateLabel.nextElementSibling as HTMLInputElement;

    fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-08-01' } });

    const exportBtn = screen.getByText('Download CSV');
    fireEvent.click(exportBtn);

    expect(onExportCSV).toHaveBeenCalledWith('2026-01-01', '2026-08-01');
  });

  it('triggers onPreviewReport and closes modal', () => {
    const onClose = vi.fn();
    const onPreviewReport = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        onPreviewReport={onPreviewReport}
      />
    );

    const reportButton = screen.getByText('Net Worth Report');
    fireEvent.click(reportButton);

    expect(onClose).toHaveBeenCalled();
    expect(onPreviewReport).toHaveBeenCalled();
  });

  it('allows selecting AI Provider and saving configuration to localStorage', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );

    const providerSelect = screen.getByRole('combobox');
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    const apiKeyInput = screen.getByPlaceholderText(/sk-proj-/);
    fireEvent.change(apiKeyInput, { target: { value: 'test-openai-key-123' } });

    const modelInput = screen.getByPlaceholderText('gpt-4o-mini');
    fireEvent.change(modelInput, { target: { value: 'gpt-4o-custom' } });

    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);

    expect(localStorage.getItem('aiProvider')).toBe('openai');
    expect(localStorage.getItem('aiApiKey')).toBe('test-openai-key-123');
    expect(localStorage.getItem('geminiApiKey')).toBe('test-openai-key-123');
    expect(localStorage.getItem('aiModel')).toBe('gpt-4o-custom');

    expect(screen.getByText('Saved!')).toBeInTheDocument();

    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

