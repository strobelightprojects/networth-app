import fs from 'fs';
const testCode = `
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportModal } from '../components/modals/ImportModal';
import * as excelParser from '../utils/excelParser';
import '@testing-library/jest-dom';

vi.mock('../utils/excelParser', () => ({
  parseExcelFile: vi.fn().mockResolvedValue({
    fileName: 'test.xlsx',
    sheetNames: ['Sheet1'],
    activeSheetName: 'Sheet1',
    headers: ['Name', 'Value'],
    rows: [['Cash', '1000']],
    suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
  }),
  parseCSVText: vi.fn().mockReturnValue({
    fileName: 'pasted.csv',
    sheetNames: ['CSV Data'],
    activeSheetName: 'CSV Data',
    headers: ['Name', 'Value'],
    rows: [['Cash', '1000']],
    suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
  }),
  parseGoogleSheetUrl: vi.fn().mockResolvedValue({
    fileName: 'Google Sheet',
    sheetNames: ['Sheet1'],
    activeSheetName: 'Sheet1',
    headers: ['Name', 'Value'],
    rows: [['Cash', '1000']],
    suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
  }),
  convertRowsToItems: vi.fn().mockReturnValue([{ name: 'Cash', value: 1000, type: 'asset' }]),
  extractDateFromFilename: vi.fn().mockReturnValue('2026-08-10')
}));

describe('ImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and interacts with file upload', async () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();
    const handleImportBatch = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onImportBatch={handleImportBatch}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(handleOpenColumnMapper).toHaveBeenCalled();
    }, {timeout: 2000});
  });

  it('interacts with batch file upload', async () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();
    const handleImportBatch = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onImportBatch={handleImportBatch}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['dummy content'], 'test1.csv', { type: 'text/csv' });
    const file2 = new File(['dummy content'], 'test2.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2]
    });
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(handleImportBatch).toHaveBeenCalled();
    }, {timeout: 2000});
  });

  it('handles Google sheets fetch', async () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Google Sheets Link'));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: 'https://docs.google.com/spreadsheets/d/123/edit' } });
    fireEvent.click(screen.getByText('Fetch & Parse Google Sheet'));
    
    await waitFor(() => {
      expect(handleOpenColumnMapper).toHaveBeenCalled();
    }, {timeout: 2000});
  });

  it('handles copy paste', async () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Copy-Paste Text'));
    const textarea = screen.getByPlaceholderText(/Account Name/);
    fireEvent.change(textarea, { target: { value: 'Name,Value\\nCash,1000' } });
    fireEvent.click(screen.getByText('Parse Table Content'));
    
    await waitFor(() => {
      expect(handleOpenColumnMapper).toHaveBeenCalled();
    }, {timeout: 2000});
  });
});
`;
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', testCode);
