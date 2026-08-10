export type AssetCategory = 
  | 'Stocks & ETFs'
  | 'Real Estate'
  | 'Retirement (401k/IRA)'
  | 'Cash & Equivalents'
  | 'Crypto'
  | 'Precious Metals'
  | 'Bonds & Fixed Income'
  | 'Alternative & Private'
  | 'Vehicle & Physical'
  | (string & {});

export type LiabilityCategory = 
  | 'Mortgage'
  | 'Credit Cards'
  | 'Student Loans'
  | 'Auto Loans'
  | 'Personal Loans'
  | 'Other Liabilities'
  | (string & {});

export type InsuranceCategory = 
  | 'Term Life Insurance'
  | 'Whole Life Insurance'
  | 'Universal Life Insurance'
  | 'Disability Insurance'
  | 'Health & Long-Term Care'
  | 'Property & Umbrella'
  | (string & {});

export type ItemType = 'asset' | 'liability' | 'insurance';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'INR' | 'SGD' | 'MXN' | 'BRL';

export interface FinancialItem {
  id: string;
  name: string;
  category: AssetCategory | LiabilityCategory | InsuranceCategory;
  type: ItemType;
  value: number; // Converted value in base portfolio currency
  currency?: string; // Original currency code (e.g. 'EUR', 'GBP', 'CAD', 'JPY')
  originalValue?: number; // Value in original currency before conversion
  exchangeRate?: number; // Applied conversion rate to base currency
  notes?: string;
  lastUpdated: string; // ISO date string
  tickerSymbol?: string; // Optional stock/crypto ticker
  interestRate?: number; // Optional for liabilities or high yield cash
  isExcluded?: boolean; // If true, excluded from Net Worth calculations
}

export interface HistoricalSnapshot {
  date: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface TargetMilestone {
  id: string;
  title: string;
  targetAmount: number;
  targetDate?: string;
  color?: string;
}

export interface PortfolioData {
  id: string;
  name: string;
  currency: CurrencyCode;
  items: FinancialItem[];
  history: HistoricalSnapshot[];
  milestones?: TargetMilestone[];
  targetAllocation?: Partial<Record<AssetCategory, number>>; // percentage 0-100
}

export interface ColumnMapping {
  nameCol: string;
  valueCol: string;
  typeCol?: string;
  categoryCol?: string;
  currencyCol?: string;
}

export type ImportMode = 'replace' | 'snapshot_only' | 'append' | 'new_portfolio';

export interface ImportOptions {
  mode: ImportMode;
  importDate: string; // YYYY-MM-DD or YYYY-MM
  portfolioName?: string;
}

export interface BatchFileSnapshot {
  fileName: string;
  importDate: string; // YYYY-MM-DD or YYYY-MM
  items: FinancialItem[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface ParsedSheetData {
  fileName: string;
  sheetNames: string[];
  activeSheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  suggestedMapping?: ColumnMapping;
}

export interface AIAnalysisResult {
  items: Omit<FinancialItem, 'id'>[];
  summaryNote?: string;
  currencyDetected?: CurrencyCode;
}
