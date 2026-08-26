import React, { useState, useMemo } from 'react';
import { 
  GitMerge, 
  X, 
  Check, 
  Layers, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Copy,
  CheckCircle2,
  Plus,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PortfolioData, CurrencyCode } from '../../types';
import { CURRENCY_LIST } from '../../utils/currency';
import { formatCurrency } from '../../utils/formatters';
import { MergeMode, DuplicateStrategy, mergePortfolios } from '../../utils/portfolioMerger';

interface MergePortfoliosModalProps {
  isOpen: boolean;
  portfolios: PortfolioData[];
  selectedPortfolioId: string;
  onClose: () => void;
  onConfirmMerge: (
    mergedPortfolio: PortfolioData,
    deletedPortfolioIds: string[],
    updatedPortfolios: PortfolioData[]
  ) => void;
  onCreatePortfolio?: (name: string) => void;
  onOpenImportModal?: () => void;
}

export const MergePortfoliosModal: React.FC<MergePortfoliosModalProps> = ({
  isOpen,
  portfolios,
  selectedPortfolioId,
  onClose,
  onConfirmMerge,
  onCreatePortfolio,
  onOpenImportModal,
}) => {
  // Pre-select the current active portfolio and another if available
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(() => {
    if (portfolios.length <= 1) return portfolios.map((p) => p.id);
    const other = portfolios.find((p) => p.id !== selectedPortfolioId);
    return [selectedPortfolioId, other ? other.id : portfolios[0].id].filter(Boolean);
  });

  const [mode, setMode] = useState<MergeMode>('create_new');
  const [targetPortfolioId, setTargetPortfolioId] = useState<string>(selectedPortfolioId);
  const [newPortfolioName, setNewPortfolioName] = useState<string>('Consolidated Wealth Portfolio');
  
  const initialCurrency = useMemo(() => {
    const current = portfolios.find((p) => p.id === selectedPortfolioId);
    return current ? current.currency : 'USD';
  }, [portfolios, selectedPortfolioId]);

  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>(initialCurrency);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('sum_values');
  const [mergeHistory, setMergeHistory] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Sync selection when opened
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (portfolios.length >= 2) {
        const others = portfolios.filter((p) => p.id !== selectedPortfolioId);
        setSelectedSourceIds([selectedPortfolioId, others[0].id]);
      } else {
        setSelectedSourceIds(portfolios.map((p) => p.id));
      }
    }
  }, [isOpen, portfolios, selectedPortfolioId]);

  if (!isOpen) return null;

  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedSourceIds(portfolios.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedSourceIds([]);
  };

  // Calculate live preview of the merge result
  const previewResult = useMemo(() => {
    if (selectedSourceIds.length === 0) return null;
    try {
      return mergePortfolios(portfolios, {
        mode,
        sourcePortfolioIds: selectedSourceIds,
        targetPortfolioId,
        newPortfolioName: newPortfolioName.trim() || 'Merged Portfolio',
        targetCurrency,
        duplicateStrategy,
        mergeHistory,
        deleteSourcesAfterMerge: false,
      });
    } catch {
      return null;
    }
  }, [
    portfolios,
    mode,
    selectedSourceIds,
    targetPortfolioId,
    newPortfolioName,
    targetCurrency,
    duplicateStrategy,
    mergeHistory,
  ]);

  const handleExecuteMerge = () => {
    if (selectedSourceIds.length < 2 && mode === 'create_new') {
      setErrorMsg('Please select at least two portfolios to merge into a new consolidated portfolio.');
      return;
    }
    if (selectedSourceIds.length < 1) {
      setErrorMsg('Please select at least one source portfolio to merge.');
      return;
    }

    try {
      const result = mergePortfolios(portfolios, {
        mode,
        sourcePortfolioIds: selectedSourceIds,
        targetPortfolioId,
        newPortfolioName: newPortfolioName.trim() || 'Merged Portfolio',
        targetCurrency,
        duplicateStrategy,
        mergeHistory,
        deleteSourcesAfterMerge: false,
      });

      onConfirmMerge(
        result.mergedPortfolio,
        result.deletedPortfolioIds,
        result.updatedPortfolios
      );
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while merging portfolios.';
      setErrorMsg(message);
    }
  };

  // Preview totals
  const previewItems = previewResult?.mergedPortfolio.items || [];
  const previewAssets = previewItems
    .filter((i) => i.type === 'asset')
    .reduce((s, i) => s + i.value, 0);
  const previewLiabilities = previewItems
    .filter((i) => i.type === 'liability')
    .reduce((s, i) => s + i.value, 0);
  const previewNetWorth = previewAssets - previewLiabilities;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Merge Portfolios</h3>
              <p className="text-xs text-slate-400">
                Consolidate multiple portfolios, combine accounts, convert currencies, and merge history.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          
          {/* How Merging Works Explainer Bar */}
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="w-full p-3 flex items-center justify-between text-left text-sky-300 hover:text-sky-200 transition-colors font-semibold"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
                <span>How does portfolio merging work?</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sky-400">
                <span>{showGuide ? 'Hide details' : 'Learn more'}</span>
                {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showGuide && (
              <div className="px-3.5 pb-3.5 pt-1 text-slate-300 space-y-2.5 border-t border-sky-500/20 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-white">Multi-Portfolio Consolidation:</strong> Combines selected assets and liabilities from different portfolios into one consolidated file.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-white">Automatic Currency Normalization:</strong> If source files use different currencies (e.g. USD, EUR, GBP), all values are converted to your chosen target currency using live FX exchange rates.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-white">Conflict & Duplicate Handling:</strong> Choose whether duplicate accounts are summed together (<code className="text-sky-300">Sum Balances</code>), updated to the latest value (<code className="text-sky-300">Keep Latest</code>), or kept as separate items (<code className="text-sky-300">Keep All</code>).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <p>
                    <strong className="text-white">Historical Snapshot Summation:</strong> Automatically merges monthly net worth timelines across all portfolios so you maintain historical trend continuity.
                  </p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Step 1: Select Source Portfolios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                Select Portfolios to Merge ({selectedSourceIds.length} of {portfolios.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {portfolios.map((p) => {
                const isChecked = selectedSourceIds.includes(p.id);
                const assetsTotal = p.items.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
                const liabTotal = p.items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
                const nw = assetsTotal - liabTotal;

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSourceSelection(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate text-white">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {p.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{p.items.length} accounts</span>
                        <span className="font-semibold text-slate-200">
                          {formatCurrency(nw, p.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {portfolios.length < 2 && (
              <div className="mt-3 p-3.5 bg-slate-950/60 border border-dashed border-slate-700 rounded-xl text-xs space-y-2">
                <p className="text-slate-300">
                  <strong className="text-white">Tip:</strong> You currently have {portfolios.length} portfolio. To merge, you need at least 2 portfolios.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onOpenImportModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenImportModal();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors"
                    >
                      Import Spreadsheet File
                    </button>
                  )}
                  {onCreatePortfolio && (
                    <button
                      type="button"
                      onClick={() => {
                        onCreatePortfolio('Secondary Portfolio');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs border border-slate-700 transition-colors"
                    >
                      + Create Empty Portfolio
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Step 2: Merge Destination */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">2</span>
              Merge Destination
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMode('create_new')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'create_new'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" /> Create New Portfolio
              </button>
              <button
                type="button"
                onClick={() => setMode('merge_into_target')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === 'merge_into_target'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitMerge className="w-4 h-4" /> Merge into Existing
              </button>
            </div>

            {mode === 'create_new' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    New Portfolio Name
                  </label>
                  <input
                    type="text"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                    placeholder="e.g. Master Family Portfolio"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Base Currency
                  </label>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CURRENCY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Target Portfolio to Receive Accounts
                </label>
                <select
                  value={targetPortfolioId}
                  onChange={(e) => setTargetPortfolioId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency} • {p.items.length} accounts)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Step 3: Conflict Resolution & Strategies */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">3</span>
              Duplicate Accounts & Conflict Handling
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDuplicateStrategy('sum_values')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  duplicateStrategy === 'sum_values'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400 mb-1">
                  <Plus className="w-3.5 h-3.5" /> Sum Balances
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Add matching accounts together into a single combined balance.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDuplicateStrategy('keep_latest')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  duplicateStrategy === 'keep_latest'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Keep Latest
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Retain the most recently updated entry for matching accounts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDuplicateStrategy('keep_all')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  duplicateStrategy === 'keep_all'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-400 mb-1">
                  <Copy className="w-3.5 h-3.5" /> Keep All Items
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Preserve every line item as an individual account record.
                </p>
              </button>
            </div>
          </div>

          {/* 4. Options */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={mergeHistory}
                onChange={(e) => setMergeHistory(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <strong>Merge historical snapshots:</strong> Sum monthly Net Worth history across selected portfolios.
              </span>
            </label>
          </div>

          {/* 5. Live Summary Preview Card */}
          {previewResult && (
            <div className="p-3.5 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Resulting Portfolio Preview
                </span>
                <span className="text-slate-300">
                  {previewResult.mergedPortfolio.name} ({previewResult.mergedPortfolio.currency})
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Accounts</div>
                  <div className="text-xs font-bold text-white mt-0.5">{previewItems.length}</div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Assets</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    {formatCurrency(previewAssets, previewResult.mergedPortfolio.currency)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-rose-400 uppercase font-semibold">Liabilities</div>
                  <div className="text-xs font-bold text-rose-400 mt-0.5">
                    {formatCurrency(previewLiabilities, previewResult.mergedPortfolio.currency)}
                  </div>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-sky-400 uppercase font-semibold">Net Worth</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {formatCurrency(previewNetWorth, previewResult.mergedPortfolio.currency)}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecuteMerge}
            disabled={selectedSourceIds.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
              selectedSourceIds.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <GitMerge className="w-4 h-4" /> Confirm & Merge Portfolios
          </button>
        </div>

      </div>
    </div>
  );
};
