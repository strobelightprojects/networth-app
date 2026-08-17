import React, { useState, useEffect } from 'react';
import { X, Key, Save, AlertCircle, Download, Printer, Sliders, FileSpreadsheet, Bot, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCSV?: (startDate?: string, endDate?: string) => void;
  onPrint?: (startDate?: string, endDate?: string) => void;
  onPreviewReport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExportCSV,
  onPrint,
  onPreviewReport,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'deepseek' | 'groq' | 'ollama' | 'custom'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      const storedProvider = (localStorage.getItem('aiProvider') as any) || 'gemini';
      const storedKey = localStorage.getItem('aiApiKey') || localStorage.getItem('geminiApiKey') || '';
      const storedUrl = localStorage.getItem('aiBaseUrl') || '';
      const storedModel = localStorage.getItem('aiModel') || '';

      setProvider(storedProvider);
      setApiKey(storedKey);
      setBaseUrl(storedUrl);
      setModel(storedModel);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('aiProvider', provider);
    localStorage.setItem('aiApiKey', apiKey.trim());
    localStorage.setItem('geminiApiKey', apiKey.trim()); // Backwards compatibility
    localStorage.setItem('aiBaseUrl', baseUrl.trim());
    localStorage.setItem('aiModel', model.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            App & Preferences Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Quick Actions / Export & Print Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              Download & Export Options
            </h4>

            {/* Date Range Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex flex-col w-full">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col w-full">
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => {
                    onExportCSV(startDate, endDate);
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      Download CSV
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Export items & history as spreadsheet file
                    </div>
                  </div>
                </button>
              )}

              {onPreviewReport && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPreviewReport();
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl text-left transition-all flex items-start gap-3 group cursor-pointer"
                >
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                      Net Worth Report
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      View full financial statement & asset allocation report
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              AI Model & Provider Configuration
            </h4>

            {/* Provider Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Select AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as any);
                  setSaved(false);
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-medium"
              >
                <option value="gemini">Google Gemini (Default)</option>
                <option value="openai">OpenAI (ChatGPT / GPT-4o)</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="groq">Groq (Llama 3 / High Speed)</option>
                <option value="ollama">Ollama / Local LLM</option>
                <option value="custom">Custom OpenAI-Compatible Endpoint</option>
              </select>
            </div>

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>
                  API Key {provider === 'ollama' ? '(Optional for local LLM)' : <><span className="text-rose-400">*</span> (Required for AI features)</>}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {provider === 'gemini' ? 'AIzaSy...' : provider === 'openai' ? 'sk-...' : 'Key'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setSaved(false);
                  }}
                  required={provider !== 'ollama'}
                  placeholder={
                    provider === 'gemini'
                      ? 'AIzaSy... (Enter your Gemini API Key)'
                      : provider === 'openai'
                      ? 'sk-proj-... (Enter your OpenAI API Key)'
                      : provider === 'deepseek'
                      ? 'sk-... (Enter your DeepSeek API Key)'
                      : provider === 'groq'
                      ? 'gsk_... (Enter your Groq API Key)'
                      : 'Enter your API Key'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-mono text-xs"
                />
              </div>
            </div>

            {/* Base URL (if Custom or Ollama or specified) */}
            {(provider === 'custom' || provider === 'ollama' || provider === 'openai' || provider === 'deepseek' || provider === 'groq') && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  API Base URL {provider !== 'custom' && provider !== 'ollama' ? '(Optional Override)' : ''}
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => {
                    setBaseUrl(e.target.value);
                    setSaved(false);
                  }}
                  placeholder={
                    provider === 'openai'
                      ? 'https://api.openai.com/v1'
                      : provider === 'deepseek'
                      ? 'https://api.deepseek.com/v1'
                      : provider === 'groq'
                      ? 'https://api.groq.com/openai/v1'
                      : provider === 'ollama'
                      ? 'http://localhost:11434/v1'
                      : 'https://your-custom-ai-endpoint.com/v1'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors font-mono text-xs"
                />
              </div>
            )}

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                Model Name (Optional Override)
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setSaved(false);
                }}
                placeholder={
                  provider === 'gemini'
                    ? 'gemini-3.6-flash'
                    : provider === 'openai'
                    ? 'gpt-4o-mini'
                    : provider === 'deepseek'
                    ? 'deepseek-chat'
                    : provider === 'groq'
                    ? 'llama-3.3-70b-versatile'
                    : provider === 'ollama'
                    ? 'llama3'
                    : 'gpt-4o'
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors font-mono text-xs"
              />
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-purple-900 dark:text-purple-200/90 leading-relaxed">
                Connect any AI provider (Gemini, ChatGPT, DeepSeek, Groq, Ollama) to automatically categorize accounts and parse spreadsheet bank statements.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
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

