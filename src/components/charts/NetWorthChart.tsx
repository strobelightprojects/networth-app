import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

import { PortfolioData, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getMostRecentItems } from '../../utils/itemHelpers';

interface NetWorthChartProps {
  portfolio: PortfolioData;
  currency: CurrencyCode;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ portfolio, currency }) => {
  const [timeframe, setTimeframe] = useState<'6M' | '1Y' | '3Y' | 'ALL'>('1Y');
  const [chartMode, setChartMode] = useState<'networth' | 'stacked'>('networth');

  // Helper to step to next month string YYYY-MM
  const getNextMonthKey = (yearMonth: string): string => {
    const [yStr, mStr] = yearMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10);
    if (isNaN(y) || isNaN(m)) return yearMonth;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    return `${y}-${m.toString().padStart(2, '0')}`;
  };

  // Current active totals based on most recent accounts within the last year
  const activeItems = useMemo(() => getMostRecentItems(portfolio.items), [portfolio.items]);

  const currentTotalAssets = useMemo(() => {
    return activeItems
      .filter((i) => i.type === 'asset')
      .reduce((sum, i) => sum + i.value, 0);
  }, [activeItems]);

  const currentTotalLiabilities = useMemo(() => {
    return activeItems
      .filter((i) => i.type === 'liability')
      .reduce((sum, i) => sum + i.value, 0);
  }, [activeItems]);

  const currentNetWorth = currentTotalAssets - currentTotalLiabilities;

  // Build chart data including historical points (forward-filled) + future projections
  const chartData = useMemo(() => {
    const rawHistory = [...portfolio.history];

    // Identify current month key
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthKey = todayStr.slice(0, 7); // e.g., "2026-08"

    // Map of recorded snapshots
    const historyMap = new Map<string, { totalAssets: number; totalLiabilities: number; netWorth: number }>();
    rawHistory.forEach((h) => {
      historyMap.set(h.date, {
        totalAssets: h.totalAssets,
        totalLiabilities: h.totalLiabilities,
        netWorth: h.netWorth,
      });
    });

    // Ensure current month point is set to the current active items net worth
    if (activeItems.length > 0) {
      historyMap.set(currentMonthKey, {
        totalAssets: currentTotalAssets,
        totalLiabilities: currentTotalLiabilities,
        netWorth: currentNetWorth,
      });
    }

    const allRecordedMonths = Array.from(historyMap.keys()).sort();
    if (allRecordedMonths.length === 0) {
      allRecordedMonths.push(currentMonthKey);
      historyMap.set(currentMonthKey, {
        totalAssets: currentTotalAssets,
        totalLiabilities: currentTotalLiabilities,
        netWorth: currentNetWorth,
      });
    }

    const startMonth = allRecordedMonths[0];
    let endMonth = allRecordedMonths[allRecordedMonths.length - 1];
    if (currentMonthKey > endMonth) {
      endMonth = currentMonthKey;
    }

    // Build continuous monthly data carrying forward last inputted values
    const filledHistory: { date: string; netWorth: number; totalAssets: number; totalLiabilities: number; isProjection: boolean }[] = [];

    let curr = startMonth;
    let lastAssets = currentTotalAssets;
    let lastLiabilities = currentTotalLiabilities;
    let lastNetWorth = currentNetWorth;
    let hasValidValue = false;

    let iterations = 0;
    while (curr <= endMonth && iterations < 300) {
      iterations++;
      const point = historyMap.get(curr);

      if (point && (point.totalAssets > 0 || point.totalLiabilities > 0 || point.netWorth !== 0 || !hasValidValue)) {
        lastAssets = point.totalAssets;
        lastLiabilities = point.totalLiabilities;
        lastNetWorth = point.netWorth;
        hasValidValue = true;
      }

      filledHistory.push({
        date: curr,
        netWorth: lastNetWorth,
        totalAssets: lastAssets,
        totalLiabilities: lastLiabilities,
        isProjection: false,
      });

      if (curr === endMonth) break;
      curr = getNextMonthKey(curr);
    }

    // Apply timeframe filter to the continuous filled history
    let slicedHistory = filledHistory;
    if (timeframe === '6M') slicedHistory = filledHistory.slice(-6);
    else if (timeframe === '1Y') slicedHistory = filledHistory.slice(-12);
    else if (timeframe === '3Y') slicedHistory = filledHistory.slice(-36);

    const dataPoints = [...slicedHistory];
    return dataPoints;
  }, [portfolio.history, timeframe, activeItems, currentTotalAssets, currentTotalLiabilities, currentNetWorth]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm mb-6 transition-colors">
      
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Historical Net Worth</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track asset growth and debt amortization over time.
          </p>
        </div>

        {/* Filters and mode toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Chart mode button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartMode('networth')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                chartMode === 'networth'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Net Worth
            </button>
            <button
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                chartMode === 'stacked'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Assets vs Debt
            </button>
          </div>

          {/* Timeframe filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['6M', '1Y', '3Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'networth' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, currency, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs text-slate-900 dark:text-white">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between gap-3">
                          <span>{label}</span>
                          {data.isProjection && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px]">
                              Forecast
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            Net Worth: {formatCurrency(data.netWorth, currency)}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">Total Assets: {formatCurrency(data.totalAssets, currency)}</div>
                          <div className="text-rose-600 dark:text-rose-400">Total Debt: {formatCurrency(data.totalLiabilities, currency)}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, currency, true)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs text-slate-900 dark:text-white">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {label}
                        </div>
                        <div className="space-y-1">
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">Total Assets: {formatCurrency(data.totalAssets, currency)}</div>
                          <div className="text-rose-600 dark:text-rose-400 font-semibold">Total Liabilities: {formatCurrency(data.totalLiabilities, currency)}</div>
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold border-t border-slate-200 dark:border-slate-800 pt-1 mt-1">
                            Net Worth: {formatCurrency(data.netWorth, currency)}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                name="Total Assets"
                type="monotone"
                dataKey="totalAssets"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#assetsGrad)"
              />
              <Area
                name="Total Liabilities"
                type="monotone"
                dataKey="totalLiabilities"
                stroke="#F43F5E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#debtGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
};
