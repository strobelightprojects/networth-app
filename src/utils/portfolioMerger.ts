import { PortfolioData, FinancialItem, HistoricalSnapshot, CurrencyCode, TargetMilestone } from '../types';
import { convertCurrencyAmount, DEFAULT_USD_RATES } from './currency';

export type MergeMode = 'create_new' | 'merge_into_target';
export type DuplicateStrategy = 'keep_all' | 'keep_latest' | 'sum_values';

export interface MergePortfolioOptions {
  mode: MergeMode;
  sourcePortfolioIds: string[];
  targetPortfolioId?: string;
  newPortfolioName?: string;
  targetCurrency: CurrencyCode;
  duplicateStrategy: DuplicateStrategy;
  mergeHistory: boolean;
  deleteSourcesAfterMerge: boolean;
  rates?: Record<string, number>;
}

export interface MergeResult {
  mergedPortfolio: PortfolioData;
  deletedPortfolioIds: string[];
  updatedPortfolios: PortfolioData[];
}

/**
 * Normalizes an item's monetary value to the target currency
 */
export function convertItemToCurrency(
  item: FinancialItem,
  sourcePortfolioCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  rates: Record<string, number> = DEFAULT_USD_RATES
): FinancialItem {
  if (sourcePortfolioCurrency === targetCurrency && (!item.currency || item.currency === targetCurrency)) {
    return { ...item };
  }

  // If the item itself has an explicit foreign currency and original value
  const itemCurrency = item.currency || sourcePortfolioCurrency;
  const originalVal = item.originalValue ?? item.value;

  const { convertedValue, exchangeRate } = convertCurrencyAmount(
    originalVal,
    itemCurrency,
    targetCurrency,
    rates
  );

  return {
    ...item,
    value: convertedValue,
    originalValue: originalVal,
    currency: itemCurrency,
    exchangeRate,
  };
}

/**
 * Merges multiple portfolios based on provided configuration options
 */
export function mergePortfolios(
  allPortfolios: PortfolioData[],
  options: MergePortfolioOptions
): MergeResult {
  const {
    mode,
    sourcePortfolioIds,
    targetPortfolioId,
    newPortfolioName = 'Merged Portfolio',
    targetCurrency,
    duplicateStrategy,
    mergeHistory = true,
    deleteSourcesAfterMerge = false,
    rates = DEFAULT_USD_RATES,
  } = options;

  const sourcePortfolios = allPortfolios.filter((p) => sourcePortfolioIds.includes(p.id));
  if (sourcePortfolios.length === 0) {
    throw new Error('At least one portfolio must be selected for merging.');
  }

  const primaryTarget =
    mode === 'merge_into_target' && targetPortfolioId
      ? allPortfolios.find((p) => p.id === targetPortfolioId)
      : null;

  const resolvedCurrency: CurrencyCode =
    primaryTarget && mode === 'merge_into_target'
      ? primaryTarget.currency
      : targetCurrency || 'USD';

  // 1. Gather and convert all financial items
  const allConvertedItems: FinancialItem[] = [];

  sourcePortfolios.forEach((p) => {
    p.items.forEach((item) => {
      const converted = convertItemToCurrency(item, p.currency, resolvedCurrency, rates);
      allConvertedItems.push(converted);
    });
  });

  // If merging into an existing target and target is not in sources, include target's items
  if (primaryTarget && !sourcePortfolioIds.includes(primaryTarget.id)) {
    primaryTarget.items.forEach((item) => {
      const converted = convertItemToCurrency(item, primaryTarget.currency, resolvedCurrency, rates);
      allConvertedItems.push(converted);
    });
  }

  // 2. Process duplicate strategy
  let processedItems: FinancialItem[] = [];

  if (duplicateStrategy === 'keep_all') {
    // Generate fresh unique IDs if needed to prevent ID collisions
    const seenIds = new Set<string>();
    processedItems = allConvertedItems.map((item, idx) => {
      let finalId = item.id;
      if (seenIds.has(finalId)) {
        finalId = `${item.id}-merged-${idx}`;
      }
      seenIds.add(finalId);
      return { ...item, id: finalId };
    });
  } else if (duplicateStrategy === 'keep_latest') {
    // Group by unique key: (normalized name + type + category)
    const grouped = new Map<string, FinancialItem>();

    allConvertedItems.forEach((item) => {
      const key = `${item.type}|${item.category.trim().toLowerCase()}|${item.name.trim().toLowerCase()}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, item);
      } else {
        // Keep the one with the more recent lastUpdated date, or higher value if equal
        const existingDate = existing.lastUpdated ? new Date(existing.lastUpdated).getTime() : 0;
        const currentDate = item.lastUpdated ? new Date(item.lastUpdated).getTime() : 0;
        if (currentDate >= existingDate) {
          grouped.set(key, item);
        }
      }
    });

    processedItems = Array.from(grouped.values());
  } else if (duplicateStrategy === 'sum_values') {
    // Group by unique key and sum the values together
    const grouped = new Map<string, FinancialItem>();

    allConvertedItems.forEach((item) => {
      const key = `${item.type}|${item.category.trim().toLowerCase()}|${item.name.trim().toLowerCase()}`;
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { ...item });
      } else {
        const sumValue = Math.round((existing.value + item.value) * 100) / 100;
        const latestDate =
          (item.lastUpdated || '') > (existing.lastUpdated || '') ? item.lastUpdated : existing.lastUpdated;
        grouped.set(key, {
          ...existing,
          value: sumValue,
          lastUpdated: latestDate,
          notes: existing.notes && item.notes && existing.notes !== item.notes 
            ? `${existing.notes} | ${item.notes}` 
            : (existing.notes || item.notes),
        });
      }
    });

    processedItems = Array.from(grouped.values());
  }

  // 3. Process History Snapshots
  let processedHistory: HistoricalSnapshot[] = [];

  if (mergeHistory) {
    const monthlyData = new Map<
      string,
      { totalAssets: number; totalLiabilities: number; netWorth: number }
    >();

    const portfoliosToSumHistory = [...sourcePortfolios];
    if (primaryTarget && !sourcePortfolioIds.includes(primaryTarget.id)) {
      portfoliosToSumHistory.push(primaryTarget);
    }

    portfoliosToSumHistory.forEach((p) => {
      (p.history || []).forEach((snap) => {
        const monthKey = snap.date.substring(0, 7);
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
        }
        const curr = monthlyData.get(monthKey)!;

        // Convert snapshot values if currency differs
        let assets = snap.totalAssets;
        let liabilities = snap.totalLiabilities;
        let nw = snap.netWorth;

        if (p.currency !== resolvedCurrency) {
          assets = convertCurrencyAmount(snap.totalAssets, p.currency, resolvedCurrency, rates).convertedValue;
          liabilities = convertCurrencyAmount(snap.totalLiabilities, p.currency, resolvedCurrency, rates).convertedValue;
          nw = assets - liabilities;
        }

        curr.totalAssets += assets;
        curr.totalLiabilities += liabilities;
        curr.netWorth += nw;
      });
    });

    // If history was empty, create a current snapshot
    if (monthlyData.size === 0) {
      const activeAssets = processedItems.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
      const activeLiabilities = processedItems.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
      const currentMonth = new Date().toISOString().slice(0, 7);
      monthlyData.set(currentMonth, {
        totalAssets: Math.round(activeAssets * 100) / 100,
        totalLiabilities: Math.round(activeLiabilities * 100) / 100,
        netWorth: Math.round((activeAssets - activeLiabilities) * 100) / 100,
      });
    }

    processedHistory = Array.from(monthlyData.entries())
      .map(([date, data]) => ({
        date,
        totalAssets: Math.round(data.totalAssets * 100) / 100,
        totalLiabilities: Math.round(data.totalLiabilities * 100) / 100,
        netWorth: Math.round(data.netWorth * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } else {
    // Current snapshot only
    const activeAssets = processedItems.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
    const activeLiabilities = processedItems.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
    const currentMonth = new Date().toISOString().slice(0, 7);
    processedHistory = [
      {
        date: currentMonth,
        totalAssets: Math.round(activeAssets * 100) / 100,
        totalLiabilities: Math.round(activeLiabilities * 100) / 100,
        netWorth: Math.round((activeAssets - activeLiabilities) * 100) / 100,
      },
    ];
  }

  // 4. Combine Milestones
  const mergedMilestones: TargetMilestone[] = [];
  const seenMilestoneTitles = new Set<string>();

  sourcePortfolios.forEach((p) => {
    (p.milestones || []).forEach((m) => {
      const key = m.title.trim().toLowerCase();
      if (!seenMilestoneTitles.has(key)) {
        seenMilestoneTitles.add(key);
        // Convert milestone target amount if needed
        let targetAmt = m.targetAmount;
        if (p.currency !== resolvedCurrency) {
          targetAmt = convertCurrencyAmount(m.targetAmount, p.currency, resolvedCurrency, rates).convertedValue;
        }
        mergedMilestones.push({
          ...m,
          targetAmount: targetAmt,
        });
      }
    });
  });

  // Construct final merged portfolio object
  let mergedPortfolio: PortfolioData;

  if (mode === 'merge_into_target' && primaryTarget) {
    mergedPortfolio = {
      ...primaryTarget,
      items: processedItems,
      history: processedHistory,
      milestones: mergedMilestones.length > 0 ? mergedMilestones : primaryTarget.milestones,
    };
  } else {
    mergedPortfolio = {
      id: `portfolio-${Date.now()}`,
      name: newPortfolioName.trim() || 'Merged Portfolio',
      currency: resolvedCurrency,
      items: processedItems,
      history: processedHistory,
      milestones: mergedMilestones.length > 0 ? mergedMilestones : undefined,
    };
  }

  // 5. Determine deleted portfolio IDs
  const deletedPortfolioIds: string[] = [];
  if (deleteSourcesAfterMerge) {
    sourcePortfolioIds.forEach((id) => {
      // Don't delete target if we merged into it
      if (mode === 'merge_into_target' && id === targetPortfolioId) return;
      deletedPortfolioIds.push(id);
    });
  }

  // 6. Build updated portfolios list
  let updatedPortfolios: PortfolioData[] = [];

  if (mode === 'merge_into_target') {
    updatedPortfolios = allPortfolios
      .map((p) => (p.id === targetPortfolioId ? mergedPortfolio : p))
      .filter((p) => !deletedPortfolioIds.includes(p.id));
  } else {
    const remaining = allPortfolios.filter((p) => !deletedPortfolioIds.includes(p.id));
    updatedPortfolios = [mergedPortfolio, ...remaining];
  }

  return {
    mergedPortfolio,
    deletedPortfolioIds,
    updatedPortfolios,
  };
}
