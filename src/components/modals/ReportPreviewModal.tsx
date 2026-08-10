import React, { useState } from 'react';
import { Printer, X, FileText, Calendar, TrendingUp, ShieldCheck, PieChart, Layers, CheckCircle2 } from 'lucide-react';
import { PortfolioData, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioData;
  currency: CurrencyCode;
  onPrint: (startDate?: string, endDate?: string) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  currency,
  onPrint,
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  if (!isOpen) return null;

  // Filter items if date range selected
  const items = portfolio.items.filter((item) => {
    if (item.isExcluded) return false;
    if (startDate && item.lastUpdated < startDate) return false;
    if (endDate && item.lastUpdated > endDate) return false;
    return true;
  });

  const totalAssets = items.filter((i) => i.type === 'asset').reduce((sum, i) => sum + i.value, 0);
  const totalLiabilities = items.filter((i) => i.type === 'liability').reduce((sum, i) => sum + i.value, 0);
  const totalInsurance = items.filter((i) => i.type === 'insurance').reduce((sum, i) => sum + i.value, 0);
  const netWorth = totalAssets - totalLiabilities;

  const liquidAssets = items
    .filter((i) => i.type === 'asset' && i.isLiquid)
    .reduce((sum, i) => sum + i.value, 0);

  // Group by categories
  const categoriesMap = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { type: item.type, total: 0, count: 0 };
    }
    acc[item.category].total += item.value;
    acc[item.category].count += 1;
    return acc;
  }, {} as Record<string, { type: string; total: number; count: number }>);

  const categories = Object.entries(categoriesMap).map(([name, data]: [string, { type: string; total: number; count: number }]) => ({
    name,
    type: data.type,
    total: data.total,
    count: data.count,
  })).sort((a, b) => b.total - a.total);

  const handleConfirmPrint = () => {
    onClose();
    onPrint(startDate, endDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Toolbar Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Net Worth Report</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Financial Statement
                </span>
              </div>
              <p className="text-xs text-slate-400">Review structured financial statement summary and asset breakdown.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirmPrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Filter Report Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-400 hover:underline ml-1"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Paper Document Preview Canvas */}
        <div className="p-4 sm:p-8 bg-slate-950 overflow-y-auto space-y-6">
          <div className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6 font-sans">
            
            {/* Printable Document Header */}
            <div className="pb-6 border-b-2 border-slate-900 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 mb-1">
                  Net Worth & Personal Financial Audit Report
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {portfolio.name}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Consolidated Statement • Total Accounts: {items.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statement Date</div>
                <div className="text-xs font-bold text-slate-900">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">Base Currency: {currency}</div>
              </div>
            </div>

            {/* Date Filter Badge if active */}
            {(startDate || endDate) && (
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300 text-xs text-slate-700 font-medium flex items-center justify-between">
                <span>Date Range: <strong>{startDate || 'Beginning'}</strong> to <strong>{endDate || 'Present'}</strong></span>
                <span className="text-[11px] text-slate-500">({items.length} matching items)</span>
              </div>
            )}

            {/* Executive KPI Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Net Worth</div>
                <div className={`text-lg font-black tracking-tight mt-0.5 ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(netWorth, currency)}
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl">
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Total Assets</div>
                <div className="text-lg font-black text-emerald-900 tracking-tight mt-0.5">
                  {formatCurrency(totalAssets, currency)}
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl">
                <div className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider">Total Liabilities</div>
                <div className="text-lg font-black text-rose-900 tracking-tight mt-0.5">
                  {formatCurrency(totalLiabilities, currency)}
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl">
                <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Liquid Net Worth</div>
                <div className="text-lg font-black text-blue-900 tracking-tight mt-0.5">
                  {formatCurrency(liquidAssets - totalLiabilities, currency)}
                </div>
              </div>
            </div>

            {/* Category Allocation Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Category Breakdown Summary</span>
                <span className="text-[11px] font-normal text-slate-500">{categories.length} Categories</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {categories.map((cat) => (
                  <div key={cat.name} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{cat.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{cat.type} • {cat.count} account{cat.count > 1 ? 's' : ''}</div>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {formatCurrency(cat.total, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Ledger Table Preview */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Account Assets & Liabilities Ledger</span>
                <span className="text-[11px] font-normal text-slate-500">{items.length} accounts</span>
              </h3>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2 px-1">Account Name</th>
                    <th className="py-2 px-1">Category</th>
                    <th className="py-2 px-1">Type</th>
                    <th className="py-2 px-1 text-right">Value ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-1 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-2 px-1 text-slate-600">{item.category}</td>
                      <td className="py-2 px-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.type === 'asset'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.type === 'liability'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2 px-1 text-right font-extrabold text-slate-900">
                        {formatCurrency(item.value, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statement Footer */}
            <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-500">
              Report generated via Net Worth Tracker • Confidential Personal Financial Statement
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Total Statement Net Worth: <strong className="text-white">{formatCurrency(netWorth, currency)}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Preview
            </button>
            <button
              onClick={handleConfirmPrint}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
