import { FinancialItem } from '../types';

/**
 * Filter items to return only the most recent version of each account,
 * AND restrict active accounts to those updated within the last 1 year
 * relative to the most recent date in the portfolio dataset (or today).
 * Accounts are grouped by name, type,.
 * If includeExcluded is false (default), items marked with isExcluded: true are filtered out.
 */
export function getMostRecentItems(items: FinancialItem[], includeExcluded: boolean = false): FinancialItem[] {
  if (!items || items.length === 0) return [];

  const groupMap = new Map<string, FinancialItem>();

  // 1. Pick the most recent entry for each unique account key
  items.forEach((item) => {
    const key = `${item.name.toLowerCase().trim()}|${item.type}`;
    const existing = groupMap.get(key);

    if (!existing) {
      groupMap.set(key, item);
    } else {
      const dateA = existing.lastUpdated || '1970-01-01';
      const dateB = item.lastUpdated || '1970-01-01';
      // Pick the item with the later date (or higher ID if dates are identical)
      if (dateB > dateA || (dateB === dateA && item.id > existing.id)) {
        groupMap.set(key, item);
      }
    }
  });

  const mostRecentPerAccount = Array.from(groupMap.values());

  // 2. Find the anchor reference date (latest lastUpdated in dataset, or current time)
  let maxTime = 0;
  items.forEach((item) => {
    if (item.lastUpdated) {
      const t = new Date(item.lastUpdated).getTime();
      if (!isNaN(t) && t > maxTime) {
        maxTime = t;
      }
    }
  });

  if (maxTime === 0) {
    maxTime = Date.now();
  }

  // 1 year cutoff (365.25 days in milliseconds)
  const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
  const cutoffTime = maxTime - ONE_YEAR_MS;

  // 3. Exclude accounts whose latest entry is older than 1 year or are marked as excluded
  return mostRecentPerAccount.filter((item) => {
    if (!includeExcluded && item.isExcluded) return false;
    if (!item.lastUpdated) return true; // keep items without explicit dates
    const itemTime = new Date(item.lastUpdated).getTime();
    if (isNaN(itemTime)) return true;
    return itemTime >= cutoffTime;
  });
}

/**
 * Group historical versions of items by account key
 */
export interface AccountHistoryGroup {
  accountKey: string;
  name: string;
  type: string;
  category: string;
  latestItem: FinancialItem;
  history: FinancialItem[]; // sorted newest to oldest
}

export function groupAccountHistory(items: FinancialItem[]): AccountHistoryGroup[] {
  if (!items || items.length === 0) return [];

  const groups = new Map<string, FinancialItem[]>();

  items.forEach((item) => {
    const key = `${item.name.toLowerCase().trim()}|${item.type}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  const result: AccountHistoryGroup[] = [];

  groups.forEach((itemList, key) => {
    // Sort newest date first
    const sorted = [...itemList].sort((a, b) => {
      const dateA = a.lastUpdated || '1970-01-01';
      const dateB = b.lastUpdated || '1970-01-01';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return b.id.localeCompare(a.id);
    });

    const latest = sorted[0];

    result.push({
      accountKey: key,
      name: latest.name,
      type: latest.type,
      category: latest.category,
      latestItem: latest,
      history: sorted,
    });
  });

  return result;
}
