import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportModal } from '../components/modals/ImportModal';
import * as excelParser from '../utils/excelParser';
import '@testing-library/jest-dom';

vi.mock('../utils/excelParser', () => ({
  parseExcelFile: vi.fn(),
  parseCSVText: vi.fn(),
  parseGoogleSheetUrl: vi.fn(),
  convertRowsToItems: vi.fn(),
  extractDateFromFilename: vi.fn().mockReturnValue('2026-08-10')
}));

describe('ImportModal', () => {
  const handleClose = vi.fn();
  const handleImportItems = vi.fn();
  const handleImportBatch = vi.fn();
  const handleOpenColumnMapper = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onImportBatch={handleImportBatch}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );
    expect(screen.getByText('Import Financial Data')).toBeInTheDocument();
    expect(screen.getByText('Excel / CSV File')).toBeInTheDocument();
    expect(screen.getByText('Google Sheets Link')).toBeInTheDocument();
    expect(screen.getByText('Copy-Paste Text')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ImportModal
        isOpen={false}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('handles tab switching', () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Google Sheets Link'));
    expect(screen.getByPlaceholderText(/https:\/\/docs\.google\.com/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Copy-Paste Text'));
    expect(screen.getByPlaceholderText(/Account Name/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Excel / CSV File'));
    expect(screen.getByText(/Click to select one or multiple Excel \/ CSV files/)).toBeInTheDocument();
  });

  it('handles single file upload with valid auto mapping', async () => {
    const mockParsedData = {
      fileName: 'portfolio.csv',
      sheetNames: ['Sheet1'],
      activeSheetName: 'Sheet1',
      headers: ['Name', 'Value'],
      rows: [['Cash', '1000']],
      suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
    };
    (excelParser.parseCSVText as any).mockReturnValue(mockParsedData);
    (excelParser.convertRowsToItems as any).mockReturnValue([
      { id: '1', name: 'Cash', value: 1000, type: 'asset', category: 'Cash & Equivalents' }
    ]);

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['Name,Value\nCash,1000'], 'portfolio.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleImportItems).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles single excel file upload', async () => {
    const mockParsedData = {
      fileName: 'portfolio.xlsx',
      sheetNames: ['Sheet1'],
      activeSheetName: 'Sheet1',
      headers: ['Account', 'Balance'],
      rows: [['Checking', '5000']],
      suggestedMapping: { nameCol: 'Account', valueCol: 'Balance' }
    };
    (excelParser.parseExcelFile as any).mockResolvedValue(mockParsedData);
    (excelParser.convertRowsToItems as any).mockReturnValue([
      { id: '2', name: 'Checking', value: 5000, type: 'asset', category: 'Cash & Equivalents' }
    ]);

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new ArrayBuffer(10)], 'portfolio.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(excelParser.parseExcelFile).toHaveBeenCalled();
      expect(handleImportItems).toHaveBeenCalled();
    });
  });

  it('opens column mapper if auto conversion is missing columns', async () => {
    const mockParsedData = {
      fileName: 'unknown.csv',
      sheetNames: ['Sheet1'],
      activeSheetName: 'Sheet1',
      headers: ['ColA', 'ColB'],
      rows: [['Foo', 'Bar']],
      suggestedMapping: {}
    };
    (excelParser.parseCSVText as any).mockReturnValue(mockParsedData);

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ColA,ColB\nFoo,Bar'], 'unknown.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleOpenColumnMapper).toHaveBeenCalledWith(mockParsedData, expect.anything());
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles batch file upload', async () => {
    const mockParsed1 = {
      fileName: 'jan.csv',
      headers: ['Name', 'Value'],
      rows: [['Asset1', '100']],
      suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
    };
    const mockParsed2 = {
      fileName: 'feb.csv',
      headers: ['Name', 'Value'],
      rows: [['Asset1', '150']],
      suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
    };

    (excelParser.parseCSVText as any)
      .mockReturnValueOnce(mockParsed1)
      .mockReturnValueOnce(mockParsed2);

    (excelParser.convertRowsToItems as any)
      .mockReturnValueOnce([{ id: '1', name: 'Asset1', value: 100, type: 'asset' }])
      .mockReturnValueOnce([{ id: '1', name: 'Asset1', value: 150, type: 'asset' }]);

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
    const file1 = new File(['Name,Value\nAsset1,100'], 'jan.csv', { type: 'text/csv' });
    const file2 = new File(['Name,Value\nAsset1,150'], 'feb.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(handleImportBatch).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('shows error on empty Google Sheets fetch', async () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Google Sheets Link'));
    fireEvent.click(screen.getByText('Fetch & Parse Google Sheet'));

    expect(await screen.findByText('Please enter Google Sheets URL(s)')).toBeInTheDocument();
  });

  it('shows error on invalid Google Sheets URL', async () => {
    (excelParser.parseGoogleSheetUrl as any).mockReturnValue(null);

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Google Sheets Link'));
    const textarea = screen.getByPlaceholderText(/https:\/\/docs\.google\.com/);
    fireEvent.change(textarea, { target: { value: 'https://invalid-url.com' } });
    fireEvent.click(screen.getByText('Fetch & Parse Google Sheet'));

    expect(await screen.findByText(/Invalid Google Sheets URL/)).toBeInTheDocument();
  });

  it('handles Google Sheets fetch successfully', async () => {
    (excelParser.parseGoogleSheetUrl as any).mockReturnValue({
      csvUrl: 'https://docs.google.com/spreadsheets/d/123/export?format=csv'
    });
    const mockParsedData = {
      fileName: 'GoogleSheet.csv',
      sheetNames: ['CSV Data'],
      activeSheetName: 'CSV Data',
      headers: ['Name', 'Value'],
      rows: [['Stocks', '10000']],
      suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
    };
    (excelParser.parseCSVText as any).mockReturnValue(mockParsedData);
    (excelParser.convertRowsToItems as any).mockReturnValue([
      { id: '3', name: 'Stocks', value: 10000, type: 'asset', category: 'Stocks & ETFs' }
    ]);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('Name,Value\nStocks,10000')
    } as any);

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Google Sheets Link'));
    const textarea = screen.getByPlaceholderText(/https:\/\/docs\.google\.com/);
    fireEvent.change(textarea, { target: { value: 'https://docs.google.com/spreadsheets/d/123/edit' } });
    fireEvent.click(screen.getByText('Fetch & Parse Google Sheet'));

    await waitFor(() => {
      expect(handleImportItems).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles copy paste text parsing', async () => {
    const mockParsedData = {
      fileName: 'PastedData.csv',
      sheetNames: ['CSV Data'],
      headers: ['Item', 'Amount'],
      rows: [['Car', '15000']],
      suggestedMapping: { nameCol: 'Item', valueCol: 'Amount' }
    };
    (excelParser.parseCSVText as any).mockReturnValue(mockParsedData);
    (excelParser.convertRowsToItems as any).mockReturnValue([
      { id: '4', name: 'Car', value: 15000, type: 'asset' }
    ]);

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
    fireEvent.change(textarea, { target: { value: 'Item\tAmount\nCar\t15000' } });
    fireEvent.click(screen.getByText('Parse Table Content'));

    await waitFor(() => {
      expect(handleImportItems).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('shows error if paste is empty', () => {
    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    fireEvent.click(screen.getByText('Copy-Paste Text'));
    fireEvent.click(screen.getByText('Parse Table Content'));

    expect(screen.getByText('Please paste raw table data')).toBeInTheDocument();
  });

  it('handles AI Auto-Mapper call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        items: [
          { name: '401k', category: 'Retirement (401k/IRA)', type: 'asset', value: 50000, isLiquid: false }
        ]
      })
    } as any);

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
    fireEvent.change(textarea, { target: { value: '401k $50000' } });
    fireEvent.click(screen.getByTitle('Use Gemini AI to analyze unstructured sheet text'));

    await waitFor(() => {
      expect(handleImportItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: '401k', value: 50000 })
        ]),
        expect.anything()
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
