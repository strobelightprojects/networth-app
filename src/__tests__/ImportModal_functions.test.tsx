import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportModal } from '../components/modals/ImportModal';
import * as excelParser from '../utils/excelParser';
import * as geminiService from '../utils/geminiCategoryService';

vi.mock('../utils/excelParser', () => ({
  parseExcelFile: vi.fn(),
  parseCSVText: vi.fn(),
  convertRowsToItems: vi.fn(),
  extractDateFromFilename: vi.fn(),
  detectGlobalDateFromSheet: vi.fn(),
  parseDateString: vi.fn()
}));

vi.mock('../utils/geminiCategoryService', () => ({
  suggestCategoriesWithGemini: vi.fn()
}));

describe('ImportModal function coverage', () => {
  const onClose = vi.fn();
  const onImportItems = vi.fn();
  const onImportBatch = vi.fn();
  const onOpenColumnMapper = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles suggestCategoriesWithGemini', async () => {
    // We need to first mock the paste logic to get some items into the previewData
    const mockParsed = {
      headers: ['Name', 'Value'],
      rows: [{ Name: 'Test', Value: '100' }],
      fileName: 'PastedData.csv',
      suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }
    };
    vi.mocked(excelParser.parseCSVText).mockReturnValue(mockParsed);
    vi.mocked(excelParser.convertRowsToItems).mockReturnValue([
      { id: '1', name: 'Test', value: 100, type: 'asset', category: 'Other', lastUpdated: '2023-01-01' } as any
    ]);

    render(
      <ImportModal 
        isOpen={true} 
        onClose={onClose} 
        onImportItems={onImportItems}
        onImportBatch={onImportBatch}
        onOpenColumnMapper={onOpenColumnMapper}
      />
    );

    // Click Paste Data tab
    fireEvent.click(screen.getByText('Copy-Paste Text'));
    
    // Type in textarea
    fireEvent.change(screen.getByPlaceholderText(/Account Name/i), { target: { value: 'Name,Value\nTest,100' } });
    
    // Click Extract Data
    fireEvent.click(screen.getByText('Parse Table Content'));
    
    // Preview should now be loaded with the mock data
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeDefined();
    });

    // Mock Gemini Response
    vi.mocked(geminiService.suggestCategoriesWithGemini).mockResolvedValue([
      { index: 0, suggestedCategory: 'Cash', suggestedType: 'asset', confidence: 'high', reasoning: 'Because' }
    ]);

    // Find and click the Auto-Categorize with Gemini AI button
    const aiBtn = screen.getByText('Auto-Categorize with Gemini AI');
    fireEvent.click(aiBtn);

    await waitFor(() => {
      expect(geminiService.suggestCategoriesWithGemini).toHaveBeenCalled();
    });
  });
});
