import React, { useState, useMemo } from 'react';
import { Columns, Check, X, ArrowRight, Table, Eye, DollarSign } from 'lucide-react';
import { ParsedSheetData, ColumnMapping, FinancialItem, ImportOptions } from '../../types';
import { convertRowsToItems, detectGlobalDateFromSheet } from '../../utils/excelParser';
import { formatCurrency } from '../../utils/formatters';

interface ColumnMapperModalProps {
  parsedData: ParsedSheetData | null;
  importOptions?: ImportOptions;
  baseCurrency?: string;
  onClose: () => void;
  onConfirmImport: (items: FinancialItem[], options: ImportOptions) => void;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  parsedData,
  importOptions,
  baseCurrency = 'USD',
  onClose,
  onConfirmImport,
}) => {
  if (!parsedData) return null;

  const headers = parsedData.headers || [];
  const rows = parsedData.rows || [];

  const [previewTab, setPreviewTab] = useState<'parsed' | 'raw'>('parsed');

  const [mapping, setMapping] = useState<ColumnMapping>(
    parsedData.suggestedMapping || {
      nameCol: headers[0] || '',
      valueCol: headers[1] || '',
    }
  );

  React.useEffect(() => {
    if (parsedData) {
      setMapping(
        parsedData.suggestedMapping || {
          nameCol: parsedData.headers[0] || '',
          valueCol: parsedData.headers[1] || '',
        }
      );
    }
  }, [parsedData]);

  // Live calculation of converted items based on active mapping
  const liveItems = useMemo(() => {
    if (!mapping.nameCol || !mapping.valueCol) return [];
    return convertRowsToItems(rows, mapping, baseCurrency);
  }, [rows, mapping, baseCurrency]);

  const totalAssets = useMemo(
    () => liveItems.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0),
    [liveItems]
  );

  const totalLiabilities = useMemo(
    () => liveItems.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0),
    [liveItems]
  );

  const handleConfirm = () => {
    if (!mapping.nameCol || !mapping.valueCol) {
      alert('Please select at least Name and Value columns');
      return;
    }

    const detectedGlobalDate = detectGlobalDateFromSheet(rows, parsedData.fileName) || importOptions?.importDate || new Date().toISOString().split('T')[0];
    const items = convertRowsToItems(rows, mapping, baseCurrency, undefined, detectedGlobalDate);

    const primaryDate = items[0]?.lastUpdated || detectedGlobalDate;

    const finalOptions: ImportOptions = {
      ...(importOptions || { mode: 'replace' }),
      importDate: primaryDate,
      portfolioName: importOptions?.portfolioName || parsedData.fileName.replace(/\.[^/.]+$/, ''),
    };

    onConfirmImport(items, finalOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Map & Preview Spreadsheet Columns</h3>
              <p className="text-xs text-slate-400">Select columns and preview live converted accounts in real-time.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Mapping Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            
            {/* Account Name Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Account Name Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.nameCol}
                onChange={(e) => setMapping({ ...mapping, nameCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Column --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Value / Balance Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Value / Balance Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.valueCol}
                onChange={(e) => setMapping({ ...mapping, valueCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Column --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Category Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Category Column (Optional)
              </label>
              <select
                value={mapping.categoryCol || ''}
                onChange={(e) => setMapping({ ...mapping, categoryCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-infer Category --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Asset vs Liability vs Insurance Type Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Type Column (Asset / Liability / Insurance)
              </label>
              <select
                value={mapping.typeCol || ''}
                onChange={(e) => setMapping({ ...mapping, typeCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-detect from value sign/name --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Currency Code Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Currency Column (Optional, e.g. EUR, GBP, CAD, JPY)
              </label>
              <select
                value={mapping.currencyCol || ''}
                onChange={(e) => setMapping({ ...mapping, currencyCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-detect currency --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Date Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Date Column (Optional, e.g. Statement Date, As Of)
              </label>
              <select
                value={mapping.dateCol || ''}
                onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-detect date from data/filename --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Live Preview Section with Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewTab('parsed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'parsed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Parsed Items Preview ({liveItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('raw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    previewTab === 'raw'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Raw Spreadsheet ({rows.length} rows)</span>
                </button>
              </div>

              {previewTab === 'parsed' && liveItems.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium">
                  <span className="text-emerald-400">Assets: {formatCurrency(totalAssets, baseCurrency)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400">Liabilities: {formatCurrency(totalLiabilities, baseCurrency)}</span>
                </div>
              )}
            </div>

            {previewTab === 'parsed' ? (
              <div className="space-y-2">
                {liveItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                    Select Account Name and Value/Balance columns above to preview parsed accounts.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-52 bg-slate-950">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                          <th className="p-2.5">Account Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5 text-right">Value ({baseCurrency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {liveItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/50">
                            <td className="p-2.5 text-slate-200 font-medium">{item.name}</td>
                            <td className="p-2.5 text-slate-400">{item.category}</td>
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
                              {formatCurrency(item.value, baseCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-52 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      {headers.map((h) => (
                        <th
                          key={h}
                          className={`p-2 ${
                            h === mapping.nameCol || h === mapping.valueCol
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : ''
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rows.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        {headers.map((h) => (
                          <td key={h} className="p-2 text-slate-300 truncate max-w-[150px]">
                            {String(row[h] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Parsed: <strong className="text-white">{liveItems.length} accounts</strong>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirm & Import Data
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
