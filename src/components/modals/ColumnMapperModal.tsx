import React, { useState } from 'react';
import { Columns, Check, X, ArrowRight, Table } from 'lucide-react';
import { ParsedSheetData, ColumnMapping, FinancialItem, ImportOptions } from '../../types';
import { convertRowsToItems } from '../../utils/excelParser';

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

  const handleConfirm = () => {
    if (!mapping.nameCol || !mapping.valueCol) {
      alert('Please select at least Name and Value columns');
      return;
    }

    const rawItems = convertRowsToItems(rows, mapping, baseCurrency);
    const dateStr = importOptions?.importDate || new Date().toISOString().split('T')[0];
    const items = rawItems.map((item) => ({ ...item, lastUpdated: dateStr }));

    const finalOptions: ImportOptions = importOptions || {
      mode: 'replace',
      importDate: dateStr,
      portfolioName: parsedData.fileName.replace(/\.[^/.]+$/, ''),
    };

    onConfirmImport(items, finalOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Map Spreadsheet Columns</h3>
              <p className="text-xs text-slate-400">Select which columns correspond to account names, values, and types.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Mapping Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Account Name Column */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Account Name Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.nameCol}
                onChange={(e) => setMapping({ ...mapping, nameCol: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
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
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
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
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
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
                Type Column (Asset / Liability / Insurance) (Optional)
              </label>
              <select
                value={mapping.typeCol || ''}
                onChange={(e) => setMapping({ ...mapping, typeCol: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-detect from value sign/name --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Currency Code Column */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">
                Currency Column (Optional, e.g. EUR, GBP, CAD, JPY, USD)
              </label>
              <select
                value={mapping.currencyCol || ''}
                onChange={(e) => setMapping({ ...mapping, currencyCol: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Auto-detect symbols/ISO codes or default to {baseCurrency} --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Table Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              Sheet Row Preview ({rows.length} rows)
            </h4>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-48 bg-slate-950">
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
                  {rows.slice(0, 5).map((row, idx) => (
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
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Confirm & Import Data
          </button>
        </div>

      </div>
    </div>
  );
};
