import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ArrowUpDown, 
  Building, 
  TrendingUp, 
  CreditCard,
  Building2,
  Globe,
  Calendar,
  Shield,
  Calculator,
  ChevronDown,
  ChevronUp,
  Equal,
  PieChart,
  Info,
  List,
  Eye,
  EyeOff,
  CheckSquare,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { FinancialItem, CurrencyCode, AssetCategory, LiabilityCategory, InsuranceCategory, ItemType } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getCurrencySymbol } from '../../utils/currency';
import { getMostRecentItems } from '../../utils/itemHelpers';
import { suggestCategoryFromAccountName } from '../../utils/aiCategorySuggester';

interface AssetsLiabilitiesLedgerProps {
  items: FinancialItem[];
  currency: CurrencyCode;
  onUpdateItem: (item: FinancialItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMultipleItems?: (ids: string[]) => void;
  onOpenAddItemModal: () => void;
}

const ALL_ASSET_CATEGORIES: AssetCategory[] = [
  'Stocks & ETFs',
  'Real Estate',
  'Retirement (401k/IRA)',
  'Cash & Equivalents',
  'Crypto',
  'Precious Metals',
  'Bonds & Fixed Income',
  'Alternative & Private',
  'Vehicle & Physical',
];

const ALL_LIABILITY_CATEGORIES: LiabilityCategory[] = [
  'Mortgage',
  'Credit Cards',
  'Student Loans',
  'Auto Loans',
  'Personal Loans',
  'Other Liabilities',
];

const ALL_INSURANCE_CATEGORIES: InsuranceCategory[] = [
  'Term Life Insurance',
  'Whole Life Insurance',
  'Universal Life Insurance',
  'Disability Insurance',
  'Health & Long-Term Care',
  'Property & Umbrella',
];

export const AssetsLiabilitiesLedger: React.FC<AssetsLiabilitiesLedgerProps> = ({
  items,
  currency,
  onUpdateItem,
  onDeleteItem,
  onDeleteMultipleItems,
  onOpenAddItemModal,
}) => {
  const [typeFilter, setTypeFilter] = useState<'active' | 'all' | 'asset' | 'liability' | 'insurance' | 'excluded'>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'value' | 'name' | 'category' | 'lastUpdated'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showNetWorthBreakdown, setShowNetWorthBreakdown] = useState<boolean>(false);
  const [breakdownView, setBreakdownView] = useState<'accounts' | 'categories'>('accounts');

  // All active account entries (most recent per account name/type)
  const allActiveItems = useMemo(() => getMostRecentItems(items, true), [items]);
  const activeItemIds = useMemo(() => new Set(allActiveItems.map((i) => i.id)), [allActiveItems]);

  // Active items included in Net Worth calculation
  const activeItems = useMemo(() => allActiveItems.filter((i) => !i.isExcluded), [allActiveItems]);
  const excludedActiveItems = useMemo(() => allActiveItems.filter((i) => i.isExcluded), [allActiveItems]);

  const handleToggleExclude = (item: FinancialItem) => {
    onUpdateItem({
      ...item,
      isExcluded: !item.isExcluded,
    });
  };

  // Overall Net Worth Calculation breakdown
  const netWorthSummary = useMemo(() => {
    const assets = activeItems.filter((i) => i.type === 'asset');
    const liabilities = activeItems.filter((i) => i.type === 'liability');
    const insurance = activeItems.filter((i) => i.type === 'insurance');

    const allAssets = allActiveItems.filter((i) => i.type === 'asset');
    const allLiabilities = allActiveItems.filter((i) => i.type === 'liability');
    const allInsurance = allActiveItems.filter((i) => i.type === 'insurance');

    const totalAssets = assets.reduce((sum, i) => sum + i.value, 0);
    const totalLiabilities = liabilities.reduce((sum, i) => sum + i.value, 0);
    const totalNetWorth = totalAssets - totalLiabilities;
    const totalInsurance = insurance.reduce((sum, i) => sum + i.value, 0);

    // Group assets by category
    const assetCategories: Record<string, { total: number; count: number }> = {};
    assets.forEach((i) => {
      if (!assetCategories[i.category]) {
        assetCategories[i.category] = { total: 0, count: 0 };
      }
      assetCategories[i.category].total += i.value;
      assetCategories[i.category].count += 1;
    });

    // Group liabilities by category
    const liabilityCategories: Record<string, { total: number; count: number }> = {};
    liabilities.forEach((i) => {
      if (!liabilityCategories[i.category]) {
        liabilityCategories[i.category] = { total: 0, count: 0 };
      }
      liabilityCategories[i.category].total += i.value;
      liabilityCategories[i.category].count += 1;
    });

    const sortedAssetCats = Object.entries(assetCategories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    const sortedLiabilityCats = Object.entries(liabilityCategories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return {
      activeItems,
      allActiveItems,
      excludedActiveItems,
      allAssets: [...allAssets].sort((a, b) => b.value - a.value),
      allLiabilities: [...allLiabilities].sort((a, b) => b.value - a.value),
      allInsurance: [...allInsurance].sort((a, b) => b.value - a.value),
      assets: [...assets].sort((a, b) => b.value - a.value),
      liabilities: [...liabilities].sort((a, b) => b.value - a.value),
      insurance: [...insurance].sort((a, b) => b.value - a.value),
      totalAssets,
      totalLiabilities,
      totalNetWorth,
      totalInsurance,
      assetCount: assets.length,
      liabilityCount: liabilities.length,
      insuranceCount: insurance.length,
      sortedAssetCats,
      sortedLiabilityCats,
    };
  }, [activeItems, allActiveItems, excludedActiveItems]);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editValue, setEditValue] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editType, setEditType] = useState<ItemType>('asset');
  const [editDate, setEditDate] = useState<string>('');

  // Bulk Selection & Deletion state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState<boolean>(false);

  // Extract unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    ALL_ASSET_CATEGORIES.forEach((c) => set.add(c));
    ALL_LIABILITY_CATEGORIES.forEach((c) => set.add(c));
    ALL_INSURANCE_CATEGORIES.forEach((c) => set.add(c));
    return Array.from(set).sort();
  }, [items]);

  // Filtered & sorted items across all ledger records
  const processedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (typeFilter === 'active' && !activeItemIds.has(item.id)) return false;
        if (typeFilter === 'excluded' && !item.isExcluded) return false;
        if (typeFilter === 'asset' && item.type !== 'asset') return false;
        if (typeFilter === 'liability' && item.type !== 'liability') return false;
        if (typeFilter === 'insurance' && item.type !== 'insurance') return false;
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = item.name.toLowerCase().includes(term);
          const matchCat = item.category.toLowerCase().includes(term);
          return matchName || matchCat;
        }
        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'value') {
          comp = b.value - a.value;
        } else if (sortField === 'name') {
          comp = a.name.localeCompare(b.name);
        } else if (sortField === 'category') {
          comp = a.category.localeCompare(b.category);
        } else if (sortField === 'lastUpdated') {
          comp = (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
        }
        return sortOrder === 'desc' ? comp : -comp;
      });
  }, [items, activeItemIds, typeFilter, categoryFilter, searchTerm, sortField, sortOrder]);

  // Filtered ledger view totals
  const filteredSummary = useMemo(() => {
    const assets = processedItems.filter((i) => i.type === 'asset').reduce((sum, i) => sum + i.value, 0);
    const liabilities = processedItems.filter((i) => i.type === 'liability').reduce((sum, i) => sum + i.value, 0);
    const insurance = processedItems.filter((i) => i.type === 'insurance').reduce((sum, i) => sum + i.value, 0);
    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
      insurance,
      itemCount: processedItems.length,
    };
  }, [processedItems]);

  // Compute custom categories
  const customCategories = React.useMemo(() => {
    const defaultCats = new Set([...ALL_ASSET_CATEGORIES, ...ALL_LIABILITY_CATEGORIES, ...ALL_INSURANCE_CATEGORIES]);
    const custom = new Set<string>();
    items.forEach((item) => {
      if (!defaultCats.has(item.category)) {
        custom.add(item.category);
      }
    });
    return Array.from(custom).sort();
  }, [items]);

  const [isEditCustomCategory, setIsEditCustomCategory] = useState<boolean>(false);

  const inlineCategorySuggestion = useMemo(() => {
    if (!editingId || !editName || editName.trim().length < 2) return null;
    return suggestCategoryFromAccountName(editName);
  }, [editingId, editName]);

  const startEdit = (item: FinancialItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(item.value);
    setEditCategory(item.category);
    setIsEditCustomCategory(false);
    setEditType(item.type);
    setEditDate(item.lastUpdated || new Date().toISOString().split('T')[0]);
  };

  const handleEditAccountFromBreakdown = (item: FinancialItem) => {
    setTypeFilter('active');
    setCategoryFilter('all');
    setSearchTerm('');
    startEdit(item);
    setTimeout(() => {
      const el = document.getElementById(`ledger-row-${item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const saveEdit = (item: FinancialItem) => {
    onUpdateItem({
      ...item,
      name: editName.trim() || item.name,
      type: editType,
      category: (editCategory as AssetCategory | LiabilityCategory) || item.category,
      value: Math.max(0, editValue),
      lastUpdated: editDate || new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Bulk Selection Logic
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllVisibleSelected = processedItems.length > 0 && processedItems.every((i) => selectedIds.has(i.id));
  const isSomeVisibleSelected = processedItems.some((i) => selectedIds.has(i.id)) && !isAllVisibleSelected;

  const toggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        processedItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        processedItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedItemsList = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.id));
  }, [items, selectedIds]);

  const selectedSummary = useMemo(() => {
    const assets = selectedItemsList.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
    const liabilities = selectedItemsList.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
      count: selectedItemsList.length,
      assetsCount: selectedItemsList.filter((i) => i.type === 'asset').length,
      liabilitiesCount: selectedItemsList.filter((i) => i.type === 'liability').length,
      insuranceCount: selectedItemsList.filter((i) => i.type === 'insurance').length,
    };
  }, [selectedItemsList]);

  const executeBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    if (onDeleteMultipleItems) {
      onDeleteMultipleItems(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteItem(id));
    }
    setSelectedIds(new Set());
    setIsConfirmBulkDeleteOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mb-6 transition-colors">
      
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Assets & Liabilities Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed ledger of all financial accounts, investment holdings, debts, and properties.
          </p>
        </div>

        {/* Search, Filter, & Add */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          
          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setTypeFilter('active'); setCategoryFilter('all'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'active' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Active ({activeItems.length})
            </button>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Records ({items.length})
            </button>
            <button
              onClick={() => setTypeFilter('asset')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'asset' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Assets ({items.filter(i => i.type === 'asset').length})
            </button>
            <button
              onClick={() => setTypeFilter('liability')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'liability' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Debts ({items.filter(i => i.type === 'liability').length})
            </button>
            <button
              onClick={() => setTypeFilter('insurance')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'insurance' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Insurance ({items.filter(i => i.type === 'insurance').length})
            </button>
            {excludedActiveItems.length > 0 && (
              <button
                onClick={() => setTypeFilter('excluded')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  typeFilter === 'excluded' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                }`}
                title="View accounts removed/excluded from net worth calculation"
              >
                <EyeOff className="w-3 h-3" />
                <span>Excluded ({excludedActiveItems.length})</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
            title="Filter by Category"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {cat}
              </option>
            ))}
          </select>

          {/* Breakdown Toggle Button */}
          <button
            onClick={() => setShowNetWorthBreakdown(!showNetWorthBreakdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              showNetWorthBreakdown 
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">{showNetWorthBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={onOpenAddItemModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Net Worth Calculation Formula & Interactive Breakdown */}
      {showNetWorthBreakdown && (
      <div className="mb-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Net Worth Calculation Formula
              </h3>
              <p className="text-[11px] text-slate-400">
                Net Worth = Total Assets ({netWorthSummary.assetCount}) − Total Liabilities ({netWorthSummary.liabilityCount})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto print:hidden">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBreakdownView('accounts')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    breakdownView === 'accounts' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Accounts ({netWorthSummary.activeItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownView('categories')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    breakdownView === 'categories' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </button>
              </div>
          </div>
        </div>

        {/* Interactive Calculation & Selection Formula Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">

          
          {/* 1. Active Net Worth Card */}
          <button
            type="button"
            onClick={() => {
              setTypeFilter('active');
              setCategoryFilter('all');
            }}
            className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all border cursor-pointer ${
              typeFilter === 'active'
                ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider flex items-center gap-1">
                <Equal className="w-3 h-3 text-emerald-400" />
                Active Net Worth
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                typeFilter === 'active' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeFilter === 'active' ? 'Selected' : 'Click to View'}
              </span>
            </div>
            <div className="text-lg font-extrabold text-emerald-400 mt-2">
              {formatCurrency(netWorthSummary.totalNetWorth, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Active Accounts ({netWorthSummary.assetCount + netWorthSummary.liabilityCount})
            </div>
          </button>

          {/* 2. Total Assets (+) Card */}
          <button
            type="button"
            onClick={() => {
              setTypeFilter('asset');
              setCategoryFilter('all');
            }}
            className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all border cursor-pointer ${
              typeFilter === 'asset'
                ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] uppercase font-bold text-emerald-400/90 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                (+) Assets
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                typeFilter === 'asset' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeFilter === 'asset' ? 'Selected' : 'Click to View'}
              </span>
            </div>
            <div className="text-lg font-extrabold text-white mt-2">
              {formatCurrency(netWorthSummary.totalAssets, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {netWorthSummary.assetCount} Asset Accounts
            </div>
          </button>

          {/* 3. Total Liabilities / Debts (-) Card */}
          <button
            type="button"
            onClick={() => {
              setTypeFilter('liability');
              setCategoryFilter('all');
            }}
            className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all border cursor-pointer ${
              typeFilter === 'liability'
                ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] uppercase font-bold text-rose-400/90 tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-rose-400" />
                (−) Debts & Liabilities
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                typeFilter === 'liability' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeFilter === 'liability' ? 'Selected' : 'Click to View'}
              </span>
            </div>
            <div className="text-lg font-extrabold text-white mt-2">
              {formatCurrency(netWorthSummary.totalLiabilities, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {netWorthSummary.liabilityCount} Debt Accounts
            </div>
          </button>

          {/* 4. Insurance Policies Card */}
          <button
            type="button"
            onClick={() => {
              setTypeFilter('insurance');
              setCategoryFilter('all');
            }}
            className={`text-left rounded-xl p-3 flex flex-col justify-between transition-all border cursor-pointer ${
              typeFilter === 'insurance'
                ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-400" />
                Insurance Coverage
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                typeFilter === 'insurance' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {typeFilter === 'insurance' ? 'Selected' : 'Click to View'}
              </span>
            </div>
            <div className="text-lg font-extrabold text-purple-300 mt-2">
              {formatCurrency(netWorthSummary.totalInsurance, currency)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {netWorthSummary.insuranceCount} Insurance Policies
            </div>
          </button>

        </div>

        {/* Expanded Breakdown Details: Individual Accounts or Categories */}
        {showNetWorthBreakdown && breakdownView === 'accounts' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
              <span>
                All <strong>{netWorthSummary.activeItems.length} Included Accounts</strong> making up the Net Worth calculation ({formatCurrency(netWorthSummary.totalNetWorth, currency)})
                {netWorthSummary.excludedActiveItems.length > 0 && (
                  <span className="text-amber-400 font-semibold ml-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    • {netWorthSummary.excludedActiveItems.length} Excluded from Calc
                  </span>
                )}. Use <strong>Exclude</strong> or <strong>Delete</strong> to remove items from calculation.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Asset Accounts */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Asset Accounts ({netWorthSummary.assetCount})</span>
                  </div>
                  <span className="text-[11px] font-extrabold">{formatCurrency(netWorthSummary.totalAssets, currency)}</span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {netWorthSummary.allAssets.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all text-xs group border ${
                        item.isExcluded
                          ? 'bg-amber-950/20 border-amber-500/30 opacity-80'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                          <span>{item.name}</span>
                          {item.isExcluded && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                              Excluded
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className={`font-extrabold ${item.isExcluded ? 'line-through text-slate-500 text-[11px]' : 'text-emerald-400'}`}>
                          {formatCurrency(item.value, currency)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleExclude(item)}
                            className={`px-1.5 py-0.5 font-bold text-[10px] rounded transition-colors border flex items-center gap-0.5 cursor-pointer ${
                              item.isExcluded
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-600 hover:text-white'
                                : 'bg-slate-800 hover:bg-amber-600/80 text-slate-300 hover:text-white border-slate-700'
                            }`}
                            title={item.isExcluded ? "Click to include in calculation" : "Click to remove/exclude from calculation"}
                          >
                            {item.isExcluded ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            <span>{item.isExcluded ? 'Include' : 'Exclude'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditAccountFromBreakdown(item)}
                            className="p-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                            title="Edit this account in ledger"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                            title="Delete account permanently"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debt Accounts */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Debt Accounts ({netWorthSummary.liabilityCount})</span>
                  </div>
                  <span className="text-[11px] font-extrabold">−{formatCurrency(netWorthSummary.totalLiabilities, currency)}</span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {netWorthSummary.allLiabilities.length === 0 ? (
                    <div className="text-slate-500 text-xs italic py-2">No debt accounts.</div>
                  ) : (
                    netWorthSummary.allLiabilities.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all text-xs group border ${
                          item.isExcluded
                            ? 'bg-amber-950/20 border-amber-500/30 opacity-80'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-rose-500/40 hover:bg-slate-900'
                        }`}
                      >
                        <div className="min-w-0 pr-2 flex-1">
                          <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                            <span>{item.name}</span>
                            {item.isExcluded && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                                Excluded
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <span>{item.category}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-1.5">
                          <span className={`font-extrabold ${item.isExcluded ? 'line-through text-slate-500 text-[11px]' : 'text-rose-400'}`}>
                            −{formatCurrency(item.value, currency)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleExclude(item)}
                              className={`px-1.5 py-0.5 font-bold text-[10px] rounded transition-colors border flex items-center gap-0.5 cursor-pointer ${
                                item.isExcluded
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-600 hover:text-white'
                                  : 'bg-slate-800 hover:bg-amber-600/80 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title={item.isExcluded ? "Click to include in calculation" : "Click to remove/exclude from calculation"}
                            >
                              {item.isExcluded ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                              <span>{item.isExcluded ? 'Include' : 'Exclude'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditAccountFromBreakdown(item)}
                              className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                              title="Edit this account in ledger"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                              title="Delete account permanently"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Insurance Policies */}
              <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/20 flex flex-col">
                <div className="text-xs font-bold text-purple-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Insurance ({netWorthSummary.insuranceCount})</span>
                  </div>
                  <span className="text-[11px] font-extrabold">{formatCurrency(netWorthSummary.totalInsurance, currency)}</span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {netWorthSummary.allInsurance.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all text-xs group border ${
                        item.isExcluded
                          ? 'bg-amber-950/20 border-amber-500/30 opacity-80'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900'
                      }`}
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                          <span>{item.name}</span>
                          {item.isExcluded && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 shrink-0">
                              Excluded
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <span>{item.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className={`font-extrabold ${item.isExcluded ? 'line-through text-slate-500 text-[11px]' : 'text-purple-300'}`}>
                          {formatCurrency(item.value, currency)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleExclude(item)}
                            className={`px-1.5 py-0.5 font-bold text-[10px] rounded transition-colors border flex items-center gap-0.5 cursor-pointer ${
                              item.isExcluded
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-600 hover:text-white'
                                : 'bg-slate-800 hover:bg-amber-600/80 text-slate-300 hover:text-white border-slate-700'
                            }`}
                            title={item.isExcluded ? "Click to include in calculation" : "Click to remove/exclude from calculation"}
                          >
                            {item.isExcluded ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            <span>{item.isExcluded ? 'Include' : 'Exclude'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditAccountFromBreakdown(item)}
                            className="p-1 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                            title="Edit this account in ledger"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                            title="Delete account permanently"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Expanded Category Breakdown Details */}
        {showNetWorthBreakdown && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Asset Categories Contribution */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                <span>Asset Categories</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Click category to filter table
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {netWorthSummary.sortedAssetCats.map((cat) => {
                  const pct = netWorthSummary.totalAssets > 0 ? (cat.total / netWorthSummary.totalAssets) * 100 : 0;
                  const isSelected = typeFilter === 'asset' && categoryFilter === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setTypeFilter('asset');
                        setCategoryFilter(cat.name);
                      }}
                      className={`w-full text-left flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                          : 'hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({cat.count})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-emerald-400">
                          {formatCurrency(cat.total, currency)}
                        </div>
                        <div className="text-[9px] text-slate-400">{pct.toFixed(1)}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liability Categories Deduction */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
              <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                <span>Debt Categories</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Click category to filter table
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {netWorthSummary.sortedLiabilityCats.length === 0 ? (
                  <div className="text-slate-500 text-xs italic py-2">No debt records.</div>
                ) : (
                  netWorthSummary.sortedLiabilityCats.map((cat) => {
                    const pct = netWorthSummary.totalLiabilities > 0 ? (cat.total / netWorthSummary.totalLiabilities) * 100 : 0;
                    const isSelected = typeFilter === 'liability' && categoryFilter === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setTypeFilter('liability');
                          setCategoryFilter(cat.name);
                        }}
                        className={`w-full text-left flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                            : 'hover:bg-slate-800/80 text-slate-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">({cat.count})</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-rose-400">
                            −{formatCurrency(cat.total, currency)}
                          </div>
                          <div className="text-[9px] text-slate-400">{pct.toFixed(1)}%</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Excluded Insurance Benefits Note */}
            <div className="bg-slate-900/80 rounded-xl p-3 border border-purple-500/20 md:col-span-2 lg:col-span-1">
              <div className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5 justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Insurance Policies</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Excluded from Net Worth</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('insurance');
                    setCategoryFilter('all');
                  }}
                  className={`w-full text-left rounded-lg p-2.5 transition-colors cursor-pointer border ${
                    typeFilter === 'insurance'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                      : 'bg-purple-950/40 border-purple-800/40 hover:bg-purple-900/40'
                  }`}
                >
                  <div className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Total Coverage / Benefits:</span>
                    <span className="text-[10px] text-purple-300 underline font-semibold">View Policies</span>
                  </div>
                  <div className="text-base font-extrabold text-purple-300 mt-0.5">
                    {formatCurrency(netWorthSummary.totalInsurance, currency)}
                  </div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">
                    ({netWorthSummary.insuranceCount} active policy records)
                  </div>
                </button>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <Info className="w-3 h-3 inline text-purple-400 mr-1 -mt-0.5" />
                  Click any policy or category to view and edit its values directly in the ledger table below.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
      )}

      {/* Active Selection Indicator Bar */}
      {(typeFilter !== 'all' || categoryFilter !== 'all' || searchTerm !== '') && (
        <div className="mb-3 flex items-center justify-between px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">Filtering Table By:</span>
            {typeFilter !== 'all' && (
              <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                typeFilter === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                typeFilter === 'asset' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                typeFilter === 'liability' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              }`}>
                Type: {typeFilter === 'active' ? 'Active Accounts' : typeFilter === 'asset' ? 'Assets' : typeFilter === 'liability' ? 'Debts' : 'Insurance'}
              </span>
            )}
            {categoryFilter !== 'all' && (
              <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                Category: {categoryFilter}
              </span>
            )}
            {searchTerm && (
              <span className="bg-slate-800 text-amber-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                Search: "{searchTerm}"
              </span>
            )}
            <span className="text-slate-500">({processedItems.length} accounts found — edit below)</span>
          </div>

          <button
            onClick={() => {
              setTypeFilter('all');
              setCategoryFilter('all');
              setSearchTerm('');
            }}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline shrink-0 cursor-pointer"
          >
            Show All Accounts
          </button>
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-3.5 px-4 py-3 bg-emerald-950/90 dark:bg-emerald-950/90 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white">
                {selectedIds.size} {selectedIds.size === 1 ? 'account' : 'accounts'} selected
              </span>
            </div>

            <div className="h-4 w-px bg-emerald-500/30 hidden sm:block" />

            <div className="text-xs text-emerald-200/90 flex items-center gap-2 flex-wrap font-medium">
              {selectedSummary.assetsCount > 0 && (
                <span>
                  Assets: <strong>{formatCurrency(selectedSummary.assets, currency)}</strong> ({selectedSummary.assetsCount})
                </span>
              )}
              {selectedSummary.liabilitiesCount > 0 && (
                <span>
                  Debts: <strong>−{formatCurrency(selectedSummary.liabilities, currency)}</strong> ({selectedSummary.liabilitiesCount})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isAllVisibleSelected && processedItems.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-colors cursor-pointer"
              >
                Select All Visible ({processedItems.length})
              </button>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmBulkDeleteOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3 w-10 text-center print:hidden">
                <input
                  type="checkbox"
                  id="select-all-ledger-items"
                  aria-label="Select all visible accounts"
                  checked={isAllVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeVisibleSelected;
                  }}
                  onChange={toggleSelectAllVisible}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer accent-emerald-500"
                />
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => { setSortField('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Account / Item <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-white" onClick={() => { setSortField('value'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Balance / Value <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => { setSortField('lastUpdated'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                As Of Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => { setSortField('category'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                Category
              </th>
              <th className="py-3 px-4 text-center print:hidden" title="Toggle whether item is included in Net Worth calculation">
                In Calc
              </th>
              <th className="py-3 px-4 text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                  No accounts found matching your filters.
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const isEditing = editingId === item.id;
                const isSelected = selectedIds.has(item.id);

                return (
                  <tr 
                    id={`ledger-row-${item.id}`} 
                    key={item.id} 
                    className={`hover:bg-slate-900/50 transition-colors group ${
                      isSelected ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center print:hidden">
                      <input
                        type="checkbox"
                        id={`select-item-${item.id}`}
                        aria-label={`Select ${item.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800 cursor-pointer accent-emerald-500"
                      />
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                            placeholder="Item name"
                          />
                          
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                            <span>{item.name}</span>
                            {item.currency && item.currency !== currency && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-0.5">
                                <Globe className="w-2.5 h-2.5" />
                                {item.currency} {getCurrencySymbol(item.currency)}
                              </span>
                            )}
                          </div>
                          
                        </div>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-32 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right font-bold"
                        />
                      ) : (
                        <div>
                          <span
                            className={`font-extrabold text-sm ${
                              item.type === 'asset' 
                                ? 'text-emerald-400' 
                                : item.type === 'liability' 
                                ? 'text-rose-400' 
                                : 'text-purple-300'
                            }`}
                          >
                            {item.type === 'liability' ? '-' : ''}
                            {formatCurrency(item.value, currency)}
                          </span>

                          {item.type === 'insurance' && (
                            <div className="text-[10px] text-purple-400/80 font-medium mt-0.5">
                              Death Benefit (Excluded from Net Worth)
                            </div>
                          )}

                          {item.currency && item.currency !== currency && item.originalValue !== undefined && (
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5" title={`Real-time FX converted from ${item.currency}`}>
                              Orig: {getCurrencySymbol(item.currency)}{item.originalValue.toLocaleString()} {item.currency}
                              {item.exchangeRate ? ` @ ${item.exchangeRate}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Date Column */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-300 font-mono inline-flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.lastUpdated || '—'}
                        </span>
                      )}
                    </td>

                    {/* Category Selector */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <select
                            value={isEditCustomCategory ? 'custom_category' : editCategory}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              if (newCat === 'custom_category') {
                                setIsEditCustomCategory(true);
                                setEditCategory('');
                              } else {
                                setIsEditCustomCategory(false);
                                setEditCategory(newCat);
                                if (ALL_INSURANCE_CATEGORIES.includes(newCat as InsuranceCategory)) {
                                  setEditType('insurance');
                                } else if (ALL_ASSET_CATEGORIES.includes(newCat as AssetCategory)) {
                                  setEditType('asset');
                                } else if (ALL_LIABILITY_CATEGORIES.includes(newCat as LiabilityCategory)) {
                                  setEditType('liability');
                                }
                              }
                            }}
                            className="px-2 py-1 bg-slate-800 border border-emerald-500 rounded text-xs text-white font-medium focus:outline-none"
                          >
                            <optgroup label="Assets" className="bg-slate-900 text-slate-400 font-bold">
                              {ALL_ASSET_CATEGORIES.map((c) => (
                                <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Liabilities & Debts" className="bg-slate-900 text-slate-400 font-bold">
                              {ALL_LIABILITY_CATEGORIES.map((c) => (
                                <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Insurance Policies" className="bg-slate-900 text-slate-400 font-bold">
                              {ALL_INSURANCE_CATEGORIES.map((c) => (
                                <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                                  {c}
                                </option>
                              ))}
                            </optgroup>
                            {customCategories.length > 0 && (
                              <optgroup label="Your Custom Categories" className="bg-slate-900 text-slate-400 font-bold">
                                <option key="custom-empty" value="" disabled>---</option>
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
                          {isEditCustomCategory && (
                            <input
                              type="text"
                              required
                              autoFocus
                              placeholder="e.g. Angel Investments"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="px-2 py-1 bg-slate-800 border border-emerald-500/50 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 animate-fade-in"
                            />
                          )}
                          {inlineCategorySuggestion && (editCategory !== inlineCategorySuggestion.suggestedCategory || editType !== inlineCategorySuggestion.suggestedType) && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditCustomCategory(false);
                                setEditCategory(inlineCategorySuggestion.suggestedCategory);
                                setEditType(inlineCategorySuggestion.suggestedType);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 flex items-center gap-1 text-left w-fit cursor-pointer transition-colors"
                              title={`Keyword match: "${inlineCategorySuggestion.matchedKeyword}"`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                              <span>Suggest: <strong className="text-white">{inlineCategorySuggestion.suggestedCategory}</strong></span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            if (newCat === 'custom_category') {
                              // Instead of immediate edit, start full row edit
                              startEdit(item);
                              setIsEditCustomCategory(true);
                              setEditCategory('');
                              return;
                            }
                            
                            let newType = item.type;
                            if (ALL_INSURANCE_CATEGORIES.includes(newCat as InsuranceCategory)) {
                              newType = 'insurance';
                            } else if (ALL_ASSET_CATEGORIES.includes(newCat as AssetCategory)) {
                              newType = 'asset';
                            } else if (ALL_LIABILITY_CATEGORIES.includes(newCat as LiabilityCategory)) {
                              newType = 'liability';
                            }
                            onUpdateItem({
                              ...item,
                              category: newCat,
                              type: newType,
                              lastUpdated: new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white font-medium text-[11px] border border-slate-700/80 hover:border-emerald-500/50 cursor-pointer focus:outline-none transition-colors"
                          title="Click to change category or type"
                        >
                          <optgroup label="Assets" className="bg-slate-900 text-slate-400 font-bold">
                            {ALL_ASSET_CATEGORIES.map((c) => (
                              <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                                {c}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Liabilities & Debts" className="bg-slate-900 text-slate-400 font-bold">
                            {ALL_LIABILITY_CATEGORIES.map((c) => (
                              <option key={c} value={c} className="bg-slate-900 text-white font-normal">
                                {c}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Insurance Policies" className="bg-slate-900 text-slate-400 font-bold">
                            {ALL_INSURANCE_CATEGORIES.map((c) => (
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
                            + Add Custom...
                          </option>
                        </select>
                      )}
                    </td>

                    {/* In Calc Toggle Button */}
                    <td className="py-3 px-4 text-center whitespace-nowrap print:hidden">
                      <button
                        type="button"
                        onClick={() => handleToggleExclude(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          item.isExcluded
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-emerald-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-amber-500/20'
                        }`}
                        title={
                          item.isExcluded
                            ? 'Excluded from Net Worth calculation. Click to include.'
                            : 'Included in Net Worth calculation. Click to exclude/remove.'
                        }
                      >
                        {item.isExcluded ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                        <span>{item.isExcluded ? 'Excluded' : 'Included'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right print:hidden">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(item)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Cancel edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-slate-900/90 border-t-2 border-slate-800 font-bold text-slate-200">
            <tr>
              <td className="py-3 px-3 print:hidden"></td>
              <td className="py-3 px-4 text-[11px] uppercase tracking-wider text-slate-400" colSpan={3}>
                View Totals ({filteredSummary.itemCount} shown)
              </td>
              <td className="py-3 px-4 text-xs font-semibold text-slate-400">
                Calculation Breakdown:
              </td>
              <td className="py-3 px-4 text-right">
                <div className="space-y-0.5">
                  {filteredSummary.assets > 0 && (
                    <div className="text-xs text-emerald-400 font-extrabold">
                      Assets: +{formatCurrency(filteredSummary.assets, currency)}
                    </div>
                  )}
                  {filteredSummary.liabilities > 0 && (
                    <div className="text-xs text-rose-400 font-extrabold">
                      Debts: −{formatCurrency(filteredSummary.liabilities, currency)}
                    </div>
                  )}
                  <div className="text-sm font-extrabold text-white border-t border-slate-800 pt-1 mt-1">
                    Net: {formatCurrency(filteredSummary.netWorth, currency)}
                  </div>
                  {filteredSummary.insurance > 0 && (
                    <div className="text-[10px] text-purple-400 font-normal">
                      Insurance (Excluded): {formatCurrency(filteredSummary.insurance, currency)}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {isConfirmBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 id="bulk-delete-title" className="text-base font-bold text-white">
                  Delete {selectedIds.size} {selectedIds.size === 1 ? 'Account' : 'Accounts'}?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete the selected {selectedIds.size} accounts from this portfolio? This operation will remove them from your active balance and ledger.
                </p>
              </div>
            </div>

            {/* Items preview list */}
            <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 space-y-1.5">
              {selectedItemsList.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/40">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({item.category})</span>
                  </div>
                  <span className={`font-mono font-bold shrink-0 ${
                    item.type === 'asset' ? 'text-emerald-400' : item.type === 'liability' ? 'text-rose-400' : 'text-purple-300'
                  }`}>
                    {item.type === 'liability' ? '-' : ''}{formatCurrency(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmBulkDeleteOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete {selectedIds.size} {selectedIds.size === 1 ? 'Item' : 'Items'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
