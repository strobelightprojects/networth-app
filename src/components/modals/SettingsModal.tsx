import React, { useState, useEffect } from 'react';
import { X, Key, Save, AlertCircle, Download, Printer, Sliders, FileSpreadsheet, FileText } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExportCSV,
  onPrint
}) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('geminiApiKey');
      if (storedKey) {
        setApiKey(storedKey);
      }
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('geminiApiKey', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            App & Export Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Actions / Export & Print Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-400" />
              Download & Export Options
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => {
                    onExportCSV();
                  }}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Download CSV
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Export items & history as spreadsheet file
                    </div>
                  </div>
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    onPrint();
                  }}
                  className="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      Print / Save as PDF
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Generate clean printable financial report
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              AI Parser Configuration
            </h4>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono text-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Stored locally in your browser to power AI Smart Import parsing of custom bank statements and custom documents.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                An API key is required when using the AI Smart Import feature to extract items from unformatted files.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            {saved ? (
              <>Saved!</>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

