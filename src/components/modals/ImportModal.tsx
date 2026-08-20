import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  Table, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileText,
  Calendar, 
  History, 
  RefreshCw, 
  PlusCircle, 
  FolderPlus, 
  Files,
  Columns,
  Check,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { parseExcelFile, parseCSVText, convertRowsToItems, extractDateFromFilename, detectGlobalDateFromSheet, parseDateString } from '../../utils/excelParser';
import { FinancialItem, ParsedSheetData, ColumnMapping, ImportOptions, ImportMode, BatchFileSnapshot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { auth } from '../../lib/firebase';
import { suggestCategoriesWithGemini } from '../../utils/geminiCategoryService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (items: FinancialItem[], options: ImportOptions) => void;
  onImportBatch?: (batch: BatchFileSnapshot[], options: ImportOptions) => void;
  onOpenColumnMapper: (parsedData: ParsedSheetData, options: ImportOptions) => void;
}

interface PreviewState {
  items: FinancialItem[];
  batchSnapshots?: BatchFileSnapshot[];
  options: ImportOptions;
  sourceName: string;
  parsedSheet?: ParsedSheetData;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
  onImportBatch,
  onOpenColumnMapper,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState<string>('');
  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Data Preview State
  const [previewData, setPreviewData] = useState<PreviewState | null>(null);
  const [previewTab, setPreviewTab] = useState<'mapped' | 'raw'>('mapped');
  const [isCategorizingWithGemini, setIsCategorizingWithGemini] = useState<boolean>(false);
  const [aiCategorizedSuccessMsg, setAiCategorizedSuccessMsg] = useState<string | null>(null);
  const [aiItemReasons, setAiItemReasons] = useState<Record<string, { confidence: string; reasoning?: string }>>({});

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setStatusMsg(null);
      setIsLoading(false);
      setPasteText('');
      setPortfolioTitle('');
      setImportDate(new Date().toISOString().split('T')[0]);
      setImportMode('replace');
      setPreviewData(null);
      setPreviewTab('mapped');
      setIsCategorizingWithGemini(false);
      setAiCategorizedSuccessMsg(null);
      setAiItemReasons({});
    }
  }, [isOpen]);

  // Trigger Gemini AI category suggestions on preview items
  const handleSuggestCategoriesWithGemini = async () => {
    if (!previewData || previewData.items.length === 0) return;

    setIsCategorizingWithGemini(true);
    setErrorMsg(null);
    setAiCategorizedSuccessMsg(null);

    try {
      const suggestions = await suggestCategoriesWithGemini(
        previewData.items.map((it) => ({
          name: it.name,
          type: it.type,
          category: it.category,
          value: it.value,
        }))
      );

      const reasonsMap: Record<string, { confidence: string; reasoning?: string }> = {};

      const updatedItems = previewData.items.map((item, idx) => {
        const suggestion = suggestions.find((s) => s.index === idx) || suggestions[idx];
        if (suggestion) {
          reasonsMap[item.id] = {
            confidence: suggestion.confidence,
            reasoning: suggestion.reasoning,
          };
          return {
            ...item,
            category: suggestion.suggestedCategory,
            type: suggestion.suggestedType,
          };
        }
        return item;
      });

      setPreviewData({
        ...previewData,
        items: updatedItems,
      });

      setAiItemReasons((prev) => ({ ...prev, ...reasonsMap }));
      setAiCategorizedSuccessMsg(`✨ Gemini AI analyzed item names and organized categories for all ${updatedItems.length} accounts!`);
    } catch (err: any) {
      console.error('Gemini category suggestion error:', err);
      setErrorMsg(err?.message || 'Failed to suggest categories with Gemini AI.');
    } finally {
      setIsCategorizingWithGemini(false);
    }
  };

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
        const detectedSheetDate = detectGlobalDateFromSheet(parsedData.rows, file.name) || extractDateFromFilename(file.name, importDate);

        let items: FinancialItem[] = [];
        if (parsedData.suggestedMapping?.nameCol && parsedData.suggestedMapping?.valueCol) {
          items = convertRowsToItems(parsedData.rows, parsedData.suggestedMapping, undefined, undefined, detectedSheetDate);
        }

        if (items.length === 0 && parsedData.headers.length >= 2) {
          items = convertRowsToItems(parsedData.rows, {
            nameCol: parsedData.headers[0],
            valueCol: parsedData.headers[1],
          }, undefined, undefined, detectedSheetDate);
        }

        const primaryDate = items[0]?.lastUpdated || detectedSheetDate;
        const totalAssets = items.filter((it) => it.type === 'asset').reduce((sum, it) => sum + it.value, 0);
        const totalLiabilities = items.filter((it) => it.type === 'liability').reduce((sum, it) => sum + it.value, 0);

        batchSnapshots.push({
          fileName: file.name,
          importDate: primaryDate,
          items,
          totalAssets,
          totalLiabilities,
          netWorth: totalAssets - totalLiabilities,
        });
      }

      if (batchSnapshots.length > 0) {
        batchSnapshots.sort((a, b) => a.importDate.localeCompare(b.importDate));
        const allItems = batchSnapshots.flatMap((s) => s.items);
        const importOptions: ImportOptions = {
          mode: importMode,
          importDate: batchSnapshots[batchSnapshots.length - 1].importDate || importDate,
          portfolioName: portfolioTitle.trim() || `${files.length}-File Portfolio Batch`,
        };

        setPreviewData({
          items: allItems,
          batchSnapshots,
          options: importOptions,
          sourceName: `${files.length} Spreadsheet Files`,
        });
      } else {
        setErrorMsg('Could not parse items from the selected files.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing spreadsheet file(s)');
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
    const detectedSheetDate = detectGlobalDateFromSheet(parsedData.rows, parsedData.fileName) || importDate;

    // Check if mapping looks valid
    if (parsedData.suggestedMapping?.nameCol && parsedData.suggestedMapping?.valueCol) {
      const converted = convertRowsToItems(parsedData.rows, parsedData.suggestedMapping, undefined, undefined, detectedSheetDate);
      if (converted.length > 0) {
        const primaryDate = converted[0]?.lastUpdated || detectedSheetDate;
        const importOptions: ImportOptions = {
          mode: importMode,
          importDate: primaryDate,
          portfolioName: portfolioTitle.trim() || parsedData.fileName.replace(/\.[^/.]+$/, ''),
        };

        setPreviewData({
          items: converted,
          options: importOptions,
          sourceName: parsedData.fileName,
          parsedSheet: parsedData,
        });
        return;
      }
    }

    const importOptions: ImportOptions = {
      mode: importMode,
      importDate: detectedSheetDate,
      portfolioName: portfolioTitle.trim() || parsedData.fileName.replace(/\.[^/.]+$/, ''),
    };

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
      const provider = localStorage.getItem('aiProvider') || 'gemini';
      const userApiKey = localStorage.getItem('aiApiKey') || localStorage.getItem('geminiApiKey') || '';
      const baseUrl = localStorage.getItem('aiBaseUrl') || '';
      const model = localStorage.getItem('aiModel') || '';
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
          provider,
          baseUrl,
          model,
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
        const aiGlobalDate = result.date ? parseDateString(result.date) : null;
        const effectiveDate = aiGlobalDate || importDate;

        const items: FinancialItem[] = result.items.map((i: any, idx: number) => {
          const itemDate = i.date ? parseDateString(i.date) : effectiveDate;
          return {
            id: `ai-${Date.now()}-${idx}`,
            name: i.name || 'Account Item',
            category: i.category || 'Stocks & ETFs',
            type: i.type === 'insurance' ? 'insurance' : i.type === 'liability' ? 'liability' : 'asset',
            value: Math.abs(Number(i.value) || 0),
            isLiquid: i.isLiquid ?? (i.type === 'asset'),
            lastUpdated: itemDate,
          };
        });

        const primaryDate = items[0]?.lastUpdated || effectiveDate;

        const importOptions: ImportOptions = {
          mode: importMode,
          importDate: primaryDate,
          portfolioName: portfolioTitle.trim() || 'AI Imported Portfolio',
        };

        setPreviewData({
          items,
          options: importOptions,
          sourceName: 'AI Smart Parser Output',
        });
      } else {
        throw new Error('AI could not identify valid financial items in this sheet.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gemini AI parsing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPreviewImport = () => {
    if (previewData) {
      if (previewData.batchSnapshots && previewData.batchSnapshots.length > 1 && onImportBatch) {
        onImportBatch(previewData.batchSnapshots, previewData.options);
      } else {
        onImportItems(previewData.items, previewData.options);
      }
      onClose();
    }
  };

  const handleOpenMapperFromPreview = () => {
    if (previewData?.parsedSheet) {
      onOpenColumnMapper(previewData.parsedSheet, previewData.options);
      onClose();
    }
  };

  // Preview Metrics
  const previewTotalAssets = previewData
    ? previewData.items.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0)
    : 0;
  const previewTotalLiabilities = previewData
    ? previewData.items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              {previewData ? <Eye className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {previewData ? 'Data Import Preview' : 'Import Financial Data'}
              </h3>
              <p className="text-xs text-slate-400">
                {previewData
                  ? `Review parsed items from ${previewData.sourceName} before importing.`
                  : 'Import Excel files or CSV bank exports.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DATA PREVIEW SCREEN */}
        {previewData ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Source & Mode Banner */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Source File / Link:</span>
                <span className="text-emerald-400 font-bold truncate max-w-[250px]">{previewData.sourceName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Import Date:</span>
                <span className="text-slate-200 font-mono">{previewData.options.importDate}</span>
              </div>
            </div>

            {/* Batch Files Breakdown (if multiple files uploaded) */}
            {previewData.batchSnapshots && previewData.batchSnapshots.length > 1 && (
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Files className="w-4 h-4 text-emerald-400" />
                    Multiple Statements / Files Detected ({previewData.batchSnapshots.length} Files)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Dates auto-extracted per file</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {previewData.batchSnapshots.map((snap, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-white truncate">{snap.fileName}</div>
                        <div className="text-[10px] text-slate-400">
                          Date: <span className="text-emerald-400 font-mono font-medium">{snap.importDate}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-200">{snap.items.length} items</div>
                        <div className="text-[10px] text-slate-400">{formatCurrency(snap.netWorth, 'USD')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-emerald-400">Total Assets</div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {formatCurrency(previewTotalAssets, 'USD')}
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-rose-400">Total Liabilities</div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {formatCurrency(previewTotalLiabilities, 'USD')}
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-blue-400">Net Worth Impact</div>
                <div className="text-base font-extrabold text-white mt-0.5">
                  {formatCurrency(previewTotalAssets - previewTotalLiabilities, 'USD')}
                </div>
              </div>
            </div>

            {/* Items Table Preview */}
            <div className="space-y-3">
              {/* AI Categorized Success Banner */}
              {aiCategorizedSuccessMsg && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs text-purple-300 animate-fade-in">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{aiCategorizedSuccessMsg}</span>
                  </div>
                  <button onClick={() => setAiCategorizedSuccessMsg(null)} className="text-purple-400 hover:text-white p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {previewData.parsedSheet ? (
                  <div className="flex bg-slate-900 p-1 rounded-xl w-fit border border-slate-800">
                    <button
                      onClick={() => setPreviewTab('mapped')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${previewTab === 'mapped' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Mapped Accounts ({previewData.items.length})
                    </button>
                    <button
                      onClick={() => setPreviewTab('raw')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${previewTab === 'raw' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Raw File Data ({previewData.parsedSheet.rows.length})
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-emerald-400" />
                    Parsed Financial Accounts ({previewData.items.length})
                  </span>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSuggestCategoriesWithGemini}
                    disabled={isCategorizingWithGemini}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isCategorizingWithGemini ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                        <span>Categorizing with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                        <span>Auto-Categorize with Gemini AI</span>
                      </>
                    )}
                  </button>

                  {previewData.parsedSheet && (
                    <button
                      onClick={handleOpenMapperFromPreview}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl"
                    >
                      <Columns className="w-3.5 h-3.5" />
                      Customize Mapping
                    </button>
                  )}
                </div>
              </div>

              {previewTab === 'mapped' ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-56 bg-slate-950">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                        <th className="p-2.5">Account Name</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {previewData.items.map((item, idx) => {
                        const aiMeta = aiItemReasons[item.id];
                        return (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 text-slate-200 font-medium">{item.name}</td>
                            <td className="p-2.5 text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <span>{item.category}</span>
                                {aiMeta && (
                                  <span
                                    title={aiMeta.reasoning || 'Categorized using Gemini AI'}
                                    className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-bold rounded-md border border-purple-500/30 flex items-center gap-0.5 cursor-help"
                                  >
                                    <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                                    AI
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-2.5 text-slate-400 font-mono text-[10px]">{item.lastUpdated || '-'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.type === 'asset'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.type === 'liability'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-extrabold text-white">
                              {formatCurrency(item.value, 'USD')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-56 bg-slate-950">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold whitespace-nowrap">
                        {previewData.parsedSheet?.headers.map((h, i) => (
                          <th key={i} className="p-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {previewData.parsedSheet?.rows.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 whitespace-nowrap">
                          {previewData.parsedSheet?.headers.map((h, i) => (
                            <td key={i} className="p-2.5 text-slate-300">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.parsedSheet && previewData.parsedSheet.rows.length > 50 && (
                    <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-900 border-t border-slate-800">
                      Showing first 50 rows of {previewData.parsedSheet.rows.length} total rows.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back / Re-upload
              </button>

              <button
                type="button"
                onClick={handleConfirmPreviewImport}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirm & Import {previewData.items.length} Items
              </button>
            </div>
          </div>
        ) : (
          <>
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

              {/* TAB 2: COPY-PASTE RAW TEXT */}
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
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table className="w-4 h-4" />}
                      Parse Table Content
                    </button>

                    <button
                      onClick={() => handleAIParse(pasteText)}
                      disabled={isLoading}
                      className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
          </>
        )}

      </div>
    </div>
  );
};
