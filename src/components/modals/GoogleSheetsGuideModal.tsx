import React from 'react';
import { HelpCircle, X, ExternalLink, CheckCircle2, Sparkles, Copy, FileSpreadsheet } from 'lucide-react';

interface GoogleSheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Google Sheets Live Sync Guide</h3>
              <p className="text-xs text-slate-400">How to power your net worth dashboard with live spreadsheet formulas.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300 max-h-[75vh] overflow-y-auto">
          
          {/* Step 1 */}
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Structure Your Google Sheet Table</h4>
              <p className="text-slate-400">
                Create 3 simple columns in your Google Sheet: <span className="text-emerald-400 font-semibold">Account Name</span>, <span className="text-emerald-400 font-semibold">Category</span>, and <span className="text-emerald-400 font-semibold">Value</span>.
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 mt-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-1">Account Name</th>
                      <th className="pb-1">Category</th>
                      <th className="pb-1">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pt-1">Vanguard VTI</td>
                      <td className="pt-1">Stocks & ETFs</td>
                      <td className="pt-1 text-emerald-400">=GOOGLEFINANCE("VTI") * 250</td>
                    </tr>
                    <tr>
                      <td>Primary Residence</td>
                      <td>Real Estate</td>
                      <td>550000</td>
                    </tr>
                    <tr>
                      <td>Home Mortgage</td>
                      <td>Mortgage</td>
                      <td className="text-rose-400">290000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Use Live `=GOOGLEFINANCE()` Formulas</h4>
              <p className="text-slate-400">
                You can auto-fetch live stock, ETF, and crypto prices directly inside your sheet cell formulas:
              </p>
              <ul className="space-y-1 mt-1 text-slate-300 list-disc list-inside">
                <li><code className="text-purple-300 font-mono">=GOOGLEFINANCE("VOO") * 50</code> (50 shares of S&P 500 ETF)</li>
                <li><code className="text-purple-300 font-mono">=GOOGLEFINANCE("CURRENCY:BTCUSD") * 0.5</code> (0.5 Bitcoin)</li>
                <li><code className="text-purple-300 font-mono">=GOOGLEFINANCE("AAPL") * 100</code> (100 shares of Apple)</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Set Sharing to "Anyone with the Link can View"</h4>
              <p className="text-slate-400">
                In Google Sheets, click <span className="text-white font-semibold">Share</span> in the top right corner, change General access to <span className="text-emerald-400 font-semibold">"Anyone with the link"</span>, and copy the link.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Paste Link into NetWorth Pulse</h4>
              <p className="text-slate-400">
                Click <span className="text-emerald-400 font-semibold">Import Sheet / Excel</span> in NetWorth Pulse, paste your link, and your live net worth dashboard will render automatically!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
};
