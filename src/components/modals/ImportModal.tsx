import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Link, 
  Sparkles, 
  Table, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  FileText 
} from 'lucide-react';
import { parseExcelFile, parseCSVText, parseGoogleSheetUrl, convertRowsToItems, extractDateFromFilename } from '../../utils/excelParser';
import { FinancialItem, ParsedSheetData, ColumnMapping, ImportOptions, ImportMode, BatchFileSnapshot } from '../../types';
import { Calendar, History, RefreshCw, PlusCircle, FolderPlus, Files } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (items: FinancialItem[], options: ImportOptions) => void;
  onImportBatch?: (batch: BatchFileSnapshot[], options: ImportOptions) => void;
  onOpenColumnMapper: (parsedData: ParsedSheetData, options: ImportOptions) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
  onImportBatch,
  onOpenColumnMapper,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'googlesheets' | 'paste'>('file');
  const [gsUrl, setGsUrl] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setStatusMsg(null);
      setIsLoading(false);
      setPasteText('');
      setGsUrl('');
      setPortfolioTitle('');
      setImportDate(new Date().toISOString().split('T')[0]);
      setImportMode('replace');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper to parse a single Excel or CSV file
  const parseSingleFile = async (file: File): Promise<ParsedSheetData> => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      return parseExcelFile(buffer, file.name);
    } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
      const text = await file.text();
      return parseCSVText(text, file.name);
    } else {
      throw new Error(`File "${file.name}" is not a supported format (.xlsx, .csv, .tsv).`);
    }
  };

  // Handle Excel or CSV file upload (single or batch multiple files)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (files.length === 1) {
        const file = files[0];
        setStatusMsg(`Reading ${file.name}...`);
        const parsedData = await parseSingleFile(file);
        handleParsedSheet(parsedData);
        return;
      }

      // Multiple Files Batch Upload
      setStatusMsg(`Processing batch of ${files.length} spreadsheet files...`);
      const batchSnapshots: BatchFileSnapshot[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMsg(`Parsing file ${i + 1} of ${files.length}: ${file.name}...`);
        const parsedData = await parseSingleFile(file);
        const fileDate = extractDateFromFilename(file.name, importDate);

        let items: FinancialItem[] = [];
        if (parsedData.suggestedMapping?.nameCol && parsedData.suggestedMapping?.valueCol) {
          items = convertRowsToItems(parsedData.rows, parsedData.suggestedMapping);
        }

        if (items.length === 0 && parsedData.headers.length >= 2) {
          items = convertRowsToItems(parsedData.rows, {
            nameCol: parsedData.headers[0],
            valueCol: parsedData.headers[1],
          });
        }

        const taggedItems = items.map((item) => ({ ...item, lastUpdated: fileDate }));
        const totalAssets = taggedItems.filter((it) => it.type === 'asset').reduce((sum, it) => sum + it.value, 0);
        const totalLiabilities = taggedItems.filter((it) => it.type === 'liability').reduce((sum, it) => sum + it.value, 0);

        batchSnapshots.push({
          fileName: file.name,
          importDate: fileDate,
          items: taggedItems,
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
        });
      }

      if (batchSnapshots.length > 0) {
        const importOptions: ImportOptions = {
          mode: importMode,
          importDate,
          portfolioName: portfolioTitle.trim() || `${files.length}-File Portfolio Batch`,
        };

        if (onImportBatch) {
          onImportBatch(batchSnapshots, importOptions);
        } else {
          batchSnapshots.sort((a, b) => a.importDate.localeCompare(b.importDate));
          const latest = batchSnapshots[batchSnapshots.length - 1];
          onImportItems(latest.items, importOptions);
        }
        onClose();
      } else {
        setErrorMsg('Could not parse items from the selected files.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing spreadsheet file(s)');
    } finally {
      setIsLoading(false);
    }
  };

  // Process Google Sheets Link
  const handleFetchGoogleSheet = async () => {
    if (!gsUrl.trim()) {
      setErrorMsg('Please enter Google Sheets URL(s)');
      return;
    }

    const urls = gsUrl.split(/[,\n]/).map(u => u.trim()).filter(u => u);

    setIsLoading(true);
    setErrorMsg(null);
    setStatusMsg(`Fetching ${urls.length} Google Sheet${urls.length > 1 ? 's' : ''}...`);

    try {
      if (urls.length === 1) {
        const parsedLink = parseGoogleSheetUrl(urls[0]);
        if (!parsedLink) {
          throw new Error('Invalid Google Sheets URL. Please make sure the sheet is public or shareable ("Anyone with the link can view").');
        }

        const res = await fetch(`/api/fetch-google-sheet?url=${encodeURIComponent(parsedLink.csvUrl)}`);
        if (!res.ok) {
          throw new Error(`Failed to access Google Sheet (${res.status}). Ensure "Anyone with the link can view" is enabled in Google Sheets sharing settings.`);
        }

        const csvText = await res.text();
        const parsedData = parseCSVText(csvText, 'GoogleSheet.csv');
        handleParsedSheet(parsedData);
      } else {
        // Process multiple sheets
        let combinedItems: FinancialItem[] = [];
        
        for (let i = 0; i < urls.length; i++) {
          setStatusMsg(`Fetching Google Sheet ${i + 1} of ${urls.length}...`);
          const url = urls[i];
          const parsedLink = parseGoogleSheetUrl(url);
          if (!parsedLink) {
             throw new Error(`Invalid Google Sheets URL on line ${i+1}.`);
          }
          const res = await fetch(`/api/fetch-google-sheet?url=${encodeURIComponent(parsedLink.csvUrl)}`);
          if (!res.ok) {
            throw new Error(`Failed to access Google Sheet on line ${i+1} (${res.status}).`);
          }
          const csvText = await res.text();
          const parsedData = parseCSVText(csvText, `GoogleSheet_${i+1}.csv`);
          
          let items: FinancialItem[] = [];
          if (parsedData.suggestedMapping?.nameCol && parsedData.suggestedMapping?.valueCol) {
            items = convertRowsToItems(parsedData.rows, parsedData.suggestedMapping);
          }
          if (items.length === 0 && parsedData.headers.length >= 2) {
            items = convertRowsToItems(parsedData.rows, {
              nameCol: parsedData.headers[0],
              valueCol: parsedData.headers[1],
            });
          }
          
          if (items.length === 0) {
             throw new Error(`Could not automatically map columns for sheet ${i+1}. Please format with "Name" and "Value" headers.`);
          }
          
          const taggedItems = items.map(item => ({ ...item, lastUpdated: importDate }));
          combinedItems = [...combinedItems, ...taggedItems];
        }
        
        const importOptions: ImportOptions = {
          mode: importMode,
          importDate,
          portfolioName: portfolioTitle.trim() || `${urls.length}-Sheet Portfolio`,
        };
        
        onImportItems(combinedItems, importOptions);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error fetching Google Sheet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle raw text paste
  const handleProcessPaste = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Please paste raw table data');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const parsedData = parseCSVText(pasteText, 'PastedData.csv');
      handleParsedSheet(parsedData);
    } catch (err: any) {
      setErrorMsg('Could not parse pasted data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper after sheet is parsed locally
  const handleParsedSheet = (parsedData: ParsedSheetData) => {
    const importOptions: ImportOptions = {
      mode: importMode,
      importDate,
      portfolioName: portfolioTitle.trim() || parsedData.fileName.replace(/\.[^/.]+$/, ''),
    };

    // Check if mapping looks valid
    if (parsedData.suggestedMapping?.nameCol && parsedData.suggestedMapping?.valueCol) {
      const converted = convertRowsToItems(parsedData.rows, parsedData.suggestedMapping);
      if (converted.length > 0) {
        // Tag items with importDate
        const taggedItems = converted.map((item) => ({ ...item, lastUpdated: importDate }));
        onImportItems(taggedItems, importOptions);
        onClose();
        return;
      }
    }

    // Open Manual Column Mapper if auto conversion missed columns
    onOpenColumnMapper(parsedData, importOptions);
    onClose();
  };

  // AI Smart Parser Endpoint (Gemini API)
  const handleAIParse = async (rawContent: string) => {
    if (!rawContent.trim()) {
      setErrorMsg('No content available for AI processing');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStatusMsg('Gemini AI analyzing spreadsheet structure...');

    try {
      const userApiKey = localStorage.getItem('geminiApiKey') || '';
      let idToken = '';
      let isAnonymous = true;

      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
          isAnonymous = auth.currentUser.isAnonymous;
        } catch (e) {
          console.error('Failed to retrieve Firebase ID token:', e);
        }
      }

      const res = await fetch('/api/parse-spreadsheet', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ 
          rawText: rawContent, 
          apiKey: userApiKey,
          idToken,
          isAnonymous
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'AI parsing failed');
      }

      const result = await res.json();
      if (result.items && Array.isArray(result.items) && result.items.length > 0) {
        const items: FinancialItem[] = result.items.map((i: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          name: i.name || 'Account Item',
          category: i.category || 'Stocks & ETFs',
          type: i.type === 'insurance' ? 'insurance' : i.type === 'liability' ? 'liability' : 'asset',
          value: Math.abs(Number(i.value) || 0),
          isLiquid: i.isLiquid ?? (i.type === 'asset'),
          lastUpdated: importDate,
        }));

        const importOptions: ImportOptions = {
          mode: importMode,
          importDate,
          portfolioName: portfolioTitle.trim() || 'AI Imported Portfolio',
        };

        onImportItems(items, importOptions);
        onClose();
      } else {
        throw new Error('AI could not identify valid financial items in this sheet.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gemini AI parsing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Import Financial Data</h3>
              <p className="text-xs text-slate-400">Connect Google Sheets, Excel files, or CSV bank exports.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 text-xs font-semibold text-slate-400">
          <button
            onClick={() => { setActiveTab('file'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === 'file' ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Excel / CSV File
          </button>
          <button
            onClick={() => { setActiveTab('googlesheets'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === 'googlesheets' ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            Google Sheets Link
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-lg transition-colors ${
              activeTab === 'paste' ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' : 'hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Copy-Paste Text
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Files className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white mb-1">
                  Click to select one or multiple Excel / CSV files
                </span>
                <span className="text-xs text-slate-400 max-w-sm">
                  Select multiple historical statements (e.g. <span className="text-emerald-400 font-mono">jan_2024.csv</span>, <span className="text-emerald-400 font-mono">jan_2025.csv</span>, <span className="text-emerald-400 font-mono">jan_2026.csv</span>) to build a portfolio with historical trend automatically!
                </span>
                <input
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS LINK */}
          {activeTab === 'googlesheets' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Paste Google Sheets Shareable Link(s)
                </label>
                <textarea
                  rows={3}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit&#10;(Optional: paste multiple links separated by commas or new lines)"
                  value={gsUrl}
                  onChange={(e) => setGsUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                  Make sure access is set to <span className="text-emerald-400 font-semibold">"Anyone with the link can view"</span> in Google Sheets sharing settings.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleFetchGoogleSheet}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                  Fetch & Parse Google Sheet
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: COPY-PASTE RAW TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Paste Table Data from Spreadsheet or Bank Statement
                </label>
                <textarea
                  rows={5}
                  placeholder={`Account Name\tCategory\tValue\nVanguard VTI\tStocks\t150000\nChase Mortgage\tLiability\t320000`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleProcessPaste}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                  Parse Table Content
                </button>

                <button
                  onClick={() => handleAIParse(pasteText)}
                  disabled={isLoading}
                  className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  title="Use Gemini AI to analyze unstructured sheet text"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Auto-Mapper
                </button>
              </div>
            </div>
          )}

          {/* Status / Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>{statusMsg || 'Processing...'}</span>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Data is processed locally in your browser session.</span>
          <span className="text-emerald-400 font-semibold">Gemini AI Auto-Mapping Enabled</span>
        </div>

      </div>
    </div>
  );
};
