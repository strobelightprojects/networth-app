import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X, Check, Wallet, CreditCard, Shield, ArrowRightLeft, Sparkles } from 'lucide-react';
import { FinancialItem, AssetCategory, LiabilityCategory, InsuranceCategory, ItemType, CurrencyCode } from '../../types';
import { CURRENCY_LIST, fetchLiveExchangeRates, convertCurrencyAmount, getCurrencySymbol } from '../../utils/currency';
import { suggestCategoryFromAccountName } from '../../utils/aiCategorySuggester';
import { suggestCategoriesWithGemini } from '../../utils/geminiCategoryService';
import { useCustomCategories } from '../../utils/categoryManager';

interface AddItemModalProps {
  isOpen: boolean;
  baseCurrency?: CurrencyCode;
  existingItems?: FinancialItem[];
  onClose: () => void;
  onAddItem: (item: FinancialItem) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  baseCurrency = 'USD',
  existingItems = [],
  onClose,
  onAddItem,
}) => {
  const assetCategories = useCustomCategories('asset') as AssetCategory[];
  const liabilityCategories = useCustomCategories('liability') as LiabilityCategory[];
  const insuranceCategories = useCustomCategories('insurance') as InsuranceCategory[];

  const [type, setType] = useState<ItemType>('asset');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Stocks & ETFs');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [itemCurrency, setItemCurrency] = useState<string>(baseCurrency);
  const [itemDate, setItemDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Compute custom categories from existing items
  const customCategories = useMemo(() => {
    const defaultCats = new Set([...assetCategories, ...liabilityCategories, ...insuranceCategories]);
    const custom = new Set<string>();
    existingItems.forEach((item) => {
      if (!defaultCats.has(item.category)) {
        custom.add(item.category);
      }
    });
    return Array.from(custom).sort();
  }, [existingItems, assetCategories, liabilityCategories, insuranceCategories]);

  // AI Category Suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<ReturnType<typeof suggestCategoryFromAccountName>>(null);
  const [userManuallySetCategory, setUserManuallySetCategory] = useState<boolean>(false);
  const [isGeminiSuggesting, setIsGeminiSuggesting] = useState<boolean>(false);
  const [geminiReasoning, setGeminiReasoning] = useState<string | null>(null);

  // FX Rates state
  const [fxRates, setFxRates] = useState<Record<string, number>>({});
  const [isFetchingRates, setIsFetchingRates] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setItemCurrency(baseCurrency);
      setIsFetchingRates(true);
      setUserManuallySetCategory(false);
      setIsCustomCategory(false);
      setCategory('Stocks & ETFs');
      setType('asset');
      setAiSuggestion(null);
      setGeminiReasoning(null);
      setIsGeminiSuggesting(false);
      fetchLiveExchangeRates('USD')
        .then((res) => setFxRates(res.rates))
        .finally(() => setIsFetchingRates(false));
    }
  }, [isOpen, baseCurrency]);

  // AI Heuristic calculation on name change
  useEffect(() => {
    const suggestion = suggestCategoryFromAccountName(name);
    setAiSuggestion(suggestion);

    if (suggestion && !userManuallySetCategory) {
      setIsCustomCategory(false);
      setType(suggestion.suggestedType);
      setCategory(suggestion.suggestedCategory);
    }
  }, [name, userManuallySetCategory]);

  const handleAskGemini = async () => {
    if (!name.trim()) return;
    setIsGeminiSuggesting(true);
    setGeminiReasoning(null);

    try {
      const results = await suggestCategoriesWithGemini([{
        name: name.trim(),
        type,
        category,
        value: parseFloat(value) || 0,
      }]);

      if (results && results.length > 0) {
        const res = results[0];
        setType(res.suggestedType);
        setCategory(res.suggestedCategory);
        setIsCustomCategory(false);
        setUserManuallySetCategory(false);
        setGeminiReasoning(res.reasoning || 'Categorized by Gemini AI');
        setAiSuggestion({
          suggestedType: res.suggestedType,
          suggestedCategory: res.suggestedCategory as any,
          matchedKeyword: 'Gemini AI',
          confidence: res.confidence,
        });
      }
    } catch (err) {
      console.error('Error fetching Gemini AI suggestion:', err);
    } finally {
      setIsGeminiSuggesting(false);
    }
  };

  if (!isOpen) return null;

  const rawNum = Math.abs(parseFloat(value) || 0);
  const isForeign = itemCurrency !== baseCurrency;
  const { convertedValue, exchangeRate } = convertCurrencyAmount(rawNum, itemCurrency, baseCurrency, fxRates);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value) return;

    const newItem: FinancialItem = {
      id: `manual-${Date.now()}`,
      name: name.trim(),
      type,
      category: category as AssetCategory | LiabilityCategory,
      value: convertedValue,
      originalValue: rawNum,
      currency: itemCurrency,
      exchangeRate: exchangeRate,
      lastUpdated: itemDate || new Date().toISOString().split('T')[0],
    };

    onAddItem(newItem);
    // Reset
    setName('');
    setValue('');
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add Financial Account</h3>
              <p className="text-xs text-slate-400">Add an asset or debt with automatic FX conversion.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Asset vs Liability vs Insurance Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 font-bold">
            <button
              type="button"
              onClick={() => {
                setType('asset');
                setCategory(assetCategories[0]);
                setUserManuallySetCategory(true);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-[11px] ${
                type === 'asset'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Asset
            </button>
            <button
              type="button"
              onClick={() => {
                setType('liability');
                setCategory(liabilityCategories[0]);
                setUserManuallySetCategory(true);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-[11px] ${
                type === 'liability'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Liability
            </button>
            <button
              type="button"
              onClick={() => {
                setType('insurance');
                setCategory(insuranceCategories[0]);
                setUserManuallySetCategory(true);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-[11px] ${
                type === 'insurance'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Insurance
            </button>
          </div>

          {/* Item Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-300">
                {type === 'insurance' ? 'Policy or Benefit Name' : 'Account or Asset Name'} <span className="text-rose-400">*</span>
              </label>
              {name.trim().length > 1 && (
                <button
                  type="button"
                  onClick={handleAskGemini}
                  disabled={isGeminiSuggesting}
                  className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  {isGeminiSuggesting ? 'Gemini AI thinking...' : 'Ask Gemini AI'}
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder={
                type === 'asset' 
                  ? 'e.g. Vanguard 401k, Primary Home, Tesla' 
                  : type === 'liability'
                  ? 'e.g. UK Mortgage, Amex Credit Card'
                  : 'e.g. Term Life $1M Death Benefit, Northwestern Mutual'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* AI Category Suggestion Pill */}
          {aiSuggestion && (
            <div className="p-2.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs text-indigo-300 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/80 block">
                    {geminiReasoning ? 'Gemini AI Recommendation' : `Auto-Suggested (Matched "${aiSuggestion.matchedKeyword}")`}
                  </span>
                  <span className="font-bold text-white text-xs">
                    {aiSuggestion.suggestedCategory} <span className="text-indigo-400 text-[10px]">({aiSuggestion.suggestedType.toUpperCase()})</span>
                  </span>
                  {geminiReasoning && (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{geminiReasoning}</p>
                  )}
                </div>
              </div>

              {(category !== aiSuggestion.suggestedCategory || type !== aiSuggestion.suggestedType) ? (
                <button
                  type="button"
                  onClick={() => {
                    setType(aiSuggestion.suggestedType);
                    setCategory(aiSuggestion.suggestedCategory);
                    setUserManuallySetCategory(false);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] shadow-sm transition-colors shrink-0"
                >
                  Apply AI Choice
                </button>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3" /> Auto-applied
                </span>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Category
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={isCustomCategory ? 'custom_category' : category}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserManuallySetCategory(true);
                  if (val === 'custom_category') {
                    setIsCustomCategory(true);
                    setCategory('');
                  } else {
                    setIsCustomCategory(false);
                    setCategory(val);
                    if (insuranceCategories.includes(val as InsuranceCategory)) {
                      setType('insurance');
                    } else if (assetCategories.includes(val as AssetCategory)) {
                      setType('asset');
                    } else if (liabilityCategories.includes(val as LiabilityCategory)) {
                      setType('liability');
                    }
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                <optgroup label="Assets" className="bg-slate-900 text-slate-400 font-bold">
                  {assetCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Liabilities & Debts" className="bg-slate-900 text-slate-400 font-bold">
                  {liabilityCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Insurance Policies (Death Benefits)" className="bg-slate-900 text-slate-400 font-bold">
                  {insuranceCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                      {c}
                    </option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Your Custom Categories" className="bg-slate-900 text-slate-400 font-bold">
                    {customCategories.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                        {c}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="custom_category" className="bg-slate-900 text-emerald-400 font-bold">
                  + Add Custom Category...
                </option>
              </select>

              {isCustomCategory && (
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Rare Collectibles, Angel Investments..."
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setUserManuallySetCategory(true);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-emerald-500/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 animate-fade-in"
                />
              )}
            </div>
            {type === 'insurance' && (
              <p className="mt-1 text-[11px] text-purple-300/80">
                ℹ️ Death benefits & insurance coverage are tracked separately and do not increase or decrease Net Worth.
              </p>
            )}
          </div>

          {/* Balance Amount and Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                {type === 'insurance' ? 'Coverage Amount' : 'Balance Amount'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={itemCurrency}
                onChange={(e) => setItemCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-Time FX Live Conversion Preview Box */}
          {isForeign && rawNum > 0 && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-white">
                  <span>
                    {getCurrencySymbol(itemCurrency)}{rawNum.toLocaleString()} {itemCurrency}
                  </span>
                  <span>≈</span>
                  <span className="text-emerald-400 font-extrabold">
                    {getCurrencySymbol(baseCurrency)}{convertedValue.toLocaleString()} {baseCurrency}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-300/80">
                  Real-Time Rate: 1 {itemCurrency} = {exchangeRate} {baseCurrency}
                  {isFetchingRates && <span className="ml-2 animate-pulse">(Updating live...)</span>}
                </div>
              </div>
            </div>
          )}

          {/* As Of Date */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                As Of Date
              </label>
              <input
                type="date"
                value={itemDate}
                onChange={(e) => setItemDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Account
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
