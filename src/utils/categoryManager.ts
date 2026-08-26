import { useEffect, useState } from 'react';
import { AssetCategory, LiabilityCategory, InsuranceCategory } from '../types';

export const DEFAULT_ASSET_CATEGORIES: string[] = [
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

export const DEFAULT_LIABILITY_CATEGORIES: string[] = [
  'Mortgage',
  'Credit Cards',
  'Student Loans',
  'Auto Loans',
  'Personal Loans',
  'Other Liabilities',
];

export const DEFAULT_INSURANCE_CATEGORIES: string[] = [
  'Term Life Insurance',
  'Whole Life Insurance',
  'Universal Life Insurance',
  'Disability Insurance',
  'Health & Long-Term Care',
  'Property & Umbrella',
];

export type CategoryType = 'asset' | 'liability' | 'insurance';

export function getCustomCategories(type: CategoryType): string[] {
  try {
    const raw = localStorage.getItem(`custom_categories_${type}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  if (type === 'asset') return [...DEFAULT_ASSET_CATEGORIES];
  if (type === 'liability') return [...DEFAULT_LIABILITY_CATEGORIES];
  return [...DEFAULT_INSURANCE_CATEGORIES];
}

export function saveCustomCategories(type: CategoryType, categories: string[]) {
  localStorage.setItem(`custom_categories_${type}`, JSON.stringify(categories));
  window.dispatchEvent(new Event('categories_updated'));
}

export function resetCustomCategories(type: CategoryType) {
  localStorage.removeItem(`custom_categories_${type}`);
  window.dispatchEvent(new Event('categories_updated'));
}

export function useCustomCategories(type: CategoryType) {
  const [categories, setCategories] = useState<string[]>(getCustomCategories(type));

  useEffect(() => {
    const handleUpdate = () => {
      setCategories(getCustomCategories(type));
    };
    window.addEventListener('categories_updated', handleUpdate);
    return () => window.removeEventListener('categories_updated', handleUpdate);
  }, [type]);

  return categories;
}
