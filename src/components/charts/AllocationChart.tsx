import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { PortfolioData, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getMostRecentItems } from '../../utils/itemHelpers';

interface AllocationChartProps {
  portfolio: PortfolioData;
  currency: CurrencyCode;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Stocks & ETFs': '#3B82F6', // Blue
  'Real Estate': '#10B981', // Emerald
  'Retirement (401k/IRA)': '#8B5CF6', // Purple
  'Cash & Equivalents': '#F59E0B', // Amber
  'Crypto': '#EC4899', // Pink
  'Precious Metals': '#EAB308', // Gold
  'Bonds & Fixed Income': '#06B6D4', // Cyan
  'Alternative & Private': '#64748B', // Slate
  'Vehicle & Physical': '#D97706', // Yellow/Brown
  'Mortgage': '#EF4444', // Red
  'Credit Cards': '#F43F5E', // Rose
  'Student Loans': '#A855F7', // Violet
  'Auto Loans': '#E11D48', // Crimson
  'Personal Loans': '#FB7185', // Coral
  'Other Liabilities': '#94A3B8',
  'Term Life Insurance': '#A855F7',
  'Whole Life Insurance': '#C084FC',
  'Universal Life Insurance': '#E879F9',
  'Disability Insurance': '#818CF8',
  'Health & Long-Term Care': '#38BDF8',
  'Property & Umbrella': '#34D399',
};

export const AllocationChart: React.FC<AllocationChartProps> = ({ portfolio, currency }) => {
  const [viewMode, setViewMode] = useState<'assetCategory' | 'liabilityType' | 'insuranceType'>('assetCategory');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleViewModeChange = (mode: 'assetCategory' | 'liabilityType' | 'insuranceType') => {
    setViewMode(mode);
    setExpandedCategory(null);
  };

  const toggleCategory = (catName: string) => {
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  // Active items using most recent values per account
  const activeItems = useMemo(() => getMostRecentItems(portfolio.items), [portfolio.items]);

  // Helper to get holdings under a specific key / category
  const getCategoryHoldings = (keyName: string) => {
    if (viewMode === 'assetCategory') {
      return activeItems.filter((i) => i.type === 'asset' && i.category === keyName);
    } else if (viewMode === 'liabilityType') {
      return activeItems.filter((i) => i.type === 'liability' && i.category === keyName);
    } else if (viewMode === 'insuranceType') {
      return activeItems.filter((i) => i.type === 'insurance' && i.category === keyName);
    } else {
      return activeItems.filter((i) => i.type !== 'insurance');
    }
  };

  // Compute breakdown data
  const data = useMemo(() => {
    if (viewMode === 'assetCategory') {
      const assets = activeItems.filter((i) => i.type === 'asset');
      const catMap: Record<string, number> = {};
      assets.forEach((i) => {
        catMap[i.category] = (catMap[i.category] || 0) + i.value;
      });
      const total = Object.values(catMap).reduce((a, b) => a + b, 0);

      return Object.entries(catMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: CATEGORY_COLORS[name] || `hsl(${Math.abs(name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (viewMode === 'liabilityType') {
      const liabilities = activeItems.filter((i) => i.type === 'liability');
      const catMap: Record<string, number> = {};
      liabilities.forEach((i) => {
        catMap[i.category] = (catMap[i.category] || 0) + i.value;
      });
      const total = Object.values(catMap).reduce((a, b) => a + b, 0);

      return Object.entries(catMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: CATEGORY_COLORS[name] || `hsl(${Math.abs(name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`,
        }))
        .sort((a, b) => b.value - a.value);
    } else if (viewMode === 'insuranceType') {
      const insuranceItems = activeItems.filter((i) => i.type === 'insurance');
      const catMap: Record<string, number> = {};
      insuranceItems.forEach((i) => {
        catMap[i.category] = (catMap[i.category] || 0) + i.value;
      });
      const total = Object.values(catMap).reduce((a, b) => a + b, 0);

      return Object.entries(catMap)
        .map(([name, value]) => ({
          name,
          value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          color: CATEGORY_COLORS[name] || `hsl(${Math.abs(name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)) % 360}, 70%, 50%)`,
        }))
        .sort((a, b) => b.value - a.value);
    }
    return [];
  }, [portfolio, viewMode, activeItems]);

  const totalSum = useMemo(() => data.reduce((a, b) => a + b.value, 0), [data]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mb-6 transition-colors">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Portfolio Allocation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visual distribution of asset classes and debt. Click any key to view underlying accounts.</p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => handleViewModeChange('assetCategory')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'assetCategory'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => handleViewModeChange('liabilityType')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'liabilityType'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Debt
          </button>
          <button
            onClick={() => handleViewModeChange('insuranceType')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewMode === 'insuranceType'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Insurance
          </button>
        </div>
      </div>

      {/* Chart & Legend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Donut Chart */}
        <div className="lg:col-span-5 h-[260px] relative flex items-center justify-center self-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs text-slate-900 dark:text-white">
                        <div className="font-bold text-slate-900 dark:text-white mb-0.5">{item.name}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(item.value, currency)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">{item.percentage.toFixed(1)}% of total</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Summary */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Total</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(totalSum, currency, true)}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="lg:col-span-7 space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {data.map((item) => {
            const isExpanded = expandedCategory === item.name;
            const holdings = getCategoryHoldings(item.name);

            return (
              <div
                key={item.name}
                className={`rounded-xl bg-slate-50 dark:bg-slate-950/60 border transition-all text-xs overflow-hidden ${
                  isExpanded 
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-slate-950/90 shadow-md' 
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(item.name)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({holdings.length})</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-slate-500 dark:text-slate-400">{item.percentage.toFixed(1)}%</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {formatCurrency(item.value, currency)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ml-1" />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu of holdings under this key */}
                {isExpanded && (
                  <div className="bg-white dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80 p-2.5 space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-1 flex justify-between items-center">
                      <span>Holdings in {item.name}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Total: {formatCurrency(item.value, currency)}
                      </span>
                    </div>
                    {holdings.length === 0 ? (
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] italic px-1">No individual items found.</div>
                    ) : (
                      holdings.map((holding) => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-[11px] transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{holding.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(holding.value, currency)}
                            </div>
                            {item.value > 0 && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                {((holding.value / item.value) * 100).toFixed(1)}% of category
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
