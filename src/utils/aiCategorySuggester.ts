import { AssetCategory, LiabilityCategory, InsuranceCategory, ItemType } from '../types';

export interface CategorySuggestion {
  suggestedCategory: AssetCategory | LiabilityCategory | InsuranceCategory;
  suggestedType: ItemType;
  confidence: 'high' | 'medium' | 'low';
  matchedKeyword: string;
}

/**
 * Heuristic AI engine to infer asset/liability category based on account name
 */
export function suggestCategoryFromAccountName(
  accountName: string,
  
): CategorySuggestion | null {
  if (!accountName || accountName.trim().length < 2) {
    return null;
  }

  const text = `${accountName}`.toLowerCase().trim();

  // 0. Insurance Policy / Death Benefit checks first
  if (
    text.includes('term life') ||
    text.includes('life insurance') ||
    text.includes('death benefit') ||
    text.includes('whole life') ||
    text.includes('universal life') ||
    text.includes('policy coverage') ||
    text.includes('prudential') ||
    text.includes('northwestern mutual') ||
    text.includes('new york life') ||
    text.includes('metlife') ||
    text.includes('disability insurance') ||
    text.includes('umbrella policy')
  ) {
    let cat: InsuranceCategory = 'Term Life Insurance';
    if (text.includes('whole life')) cat = 'Whole Life Insurance';
    else if (text.includes('universal life')) cat = 'Universal Life Insurance';
    else if (text.includes('disability')) cat = 'Disability Insurance';
    else if (text.includes('health') || text.includes('care')) cat = 'Health & Long-Term Care';
    else if (text.includes('umbrella') || text.includes('property')) cat = 'Property & Umbrella';

    return {
      suggestedCategory: cat,
      suggestedType: 'insurance',
      confidence: 'high',
      matchedKeyword: 'insurance / death benefit',
    };
  }

  // 1. Debt & Liabilities checks next
  if (
    text.includes('mortgage') ||
    text.includes('home loan') ||
    text.includes('housing loan') ||
    text.includes('house loan')
  ) {
    return {
      suggestedCategory: 'Mortgage',
      suggestedType: 'liability',
      confidence: 'high',
      matchedKeyword: 'mortgage / home loan',
    };
  }

  if (
    text.includes('credit card') ||
    text.includes('visa') ||
    text.includes('mastercard') ||
    text.includes('amex') ||
    text.includes('american express') ||
    text.includes('sapphire') ||
    text.includes('freedom') ||
    text.includes('card balance') ||
    text.includes('apple card') ||
    text.includes('discover card')
  ) {
    return {
      suggestedCategory: 'Credit Cards',
      suggestedType: 'liability',
      confidence: 'high',
      matchedKeyword: 'credit card',
    };
  }

  if (
    text.includes('student') ||
    text.includes('nelnet') ||
    text.includes('edfinancial') ||
    text.includes('navient') ||
    text.includes('aidvantage') ||
    text.includes('mohela') ||
    text.includes('tuition')
  ) {
    return {
      suggestedCategory: 'Student Loans',
      suggestedType: 'liability',
      confidence: 'high',
      matchedKeyword: 'student loan',
    };
  }

  if (
    text.includes('auto loan') ||
    text.includes('car loan') ||
    text.includes('vehicle loan') ||
    text.includes('honda financial') ||
    text.includes('toyota financial') ||
    text.includes('ford credit')
  ) {
    return {
      suggestedCategory: 'Auto Loans',
      suggestedType: 'liability',
      confidence: 'high',
      matchedKeyword: 'auto loan',
    };
  }

  if (
    text.includes('loan') ||
    text.includes('sofi') ||
    text.includes('lendingclub') ||
    text.includes('heloc') ||
    text.includes('line of credit') ||
    text.includes('debt consolidation')
  ) {
    return {
      suggestedCategory: 'Personal Loans',
      suggestedType: 'liability',
      confidence: 'medium',
      matchedKeyword: 'loan / debt',
    };
  }

  // 2. Asset checks
  if (
    text.includes('401k') ||
    text.includes('401(k)') ||
    text.includes('ira') ||
    text.includes('roth') ||
    text.includes('pension') ||
    text.includes('403b') ||
    text.includes('superannuation') ||
    text.includes('retirement') ||
    text.includes('tsp')
  ) {
    return {
      suggestedCategory: 'Retirement (401k/IRA)',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'retirement / 401k / IRA',
    };
  }

  if (
    text.includes('crypto') ||
    text.includes('bitcoin') ||
    text.includes('btc') ||
    text.includes('ethereum') ||
    text.includes('eth') ||
    text.includes('binance') ||
    text.includes('coinbase') ||
    text.includes('solana') ||
    text.includes('cardano') ||
    text.includes('wallet') ||
    text.includes('ledger') ||
    text.includes('kraken') ||
    text.includes('metamask')
  ) {
    return {
      suggestedCategory: 'Crypto',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'crypto / blockchain',
    };
  }

  if (
    text.includes('house') ||
    text.includes('home') ||
    text.includes('apartment') ||
    text.includes('condo') ||
    text.includes('real estate') ||
    text.includes('property') ||
    text.includes('land') ||
    text.includes('rental') ||
    text.includes('zillow') ||
    text.includes('villa') ||
    text.includes('flat') ||
    text.includes('reit')
  ) {
    return {
      suggestedCategory: 'Real Estate',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'real estate / property',
    };
  }

  if (
    text.includes('checking') ||
    text.includes('savings') ||
    text.includes('cash') ||
    text.includes('bank') ||
    text.includes('hysa') ||
    text.includes('money market') ||
    text.includes('revolut') ||
    text.includes('wise') ||
    text.includes('chase') ||
    text.includes('wells fargo') ||
    text.includes('bank of america') ||
    text.includes('capital one') ||
    text.includes('deposit') ||
    text.includes('emergency fund')
  ) {
    return {
      suggestedCategory: 'Cash & Equivalents',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'banking / cash',
    };
  }

  if (
    text.includes('stock') ||
    text.includes('etf') ||
    text.includes('share') ||
    text.includes('vanguard') ||
    text.includes('fidelity') ||
    text.includes('schwab') ||
    text.includes('robinhood') ||
    text.includes('index fund') ||
    text.includes('s&p') ||
    text.includes('nasdaq') ||
    text.includes('equity') ||
    text.includes('e*trade') ||
    text.includes('interactive brokers') ||
    text.includes('acorns') ||
    text.includes('wealthfront') ||
    text.includes('betterment') ||
    text.includes('portfolio') ||
    text.includes('trading')
  ) {
    return {
      suggestedCategory: 'Stocks & ETFs',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'stocks / brokerage',
    };
  }

  if (
    text.includes('bond') ||
    text.includes('treasury') ||
    text.includes('t-bill') ||
    text.includes('fixed income') ||
    text.includes('muni')
  ) {
    return {
      suggestedCategory: 'Bonds & Fixed Income',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'bonds / treasuries',
    };
  }

  if (
    text.includes('gold') ||
    text.includes('silver') ||
    text.includes('platinum') ||
    text.includes('palladium') ||
    text.includes('bullion') ||
    text.includes('krugerrand') ||
    text.includes('pamp') ||
    text.includes('ingot') ||
    text.includes('precious metal') ||
    text.includes('metal') ||
    text.includes(' bullion') ||
    text.includes('oz gold') ||
    text.includes('oz silver')
  ) {
    return {
      suggestedCategory: 'Precious Metals',
      suggestedType: 'asset',
      confidence: 'high',
      matchedKeyword: 'precious metals / bullion',
    };
  }

  if (
    text.includes('car') ||
    text.includes('vehicle') ||
    text.includes('auto') ||
    text.includes('tesla') ||
    text.includes('bmw') ||
    text.includes('watch') ||
    text.includes('rolex') ||
    text.includes('jewelry') ||
    text.includes('boat')
  ) {
    return {
      suggestedCategory: 'Vehicle & Physical',
      suggestedType: 'asset',
      confidence: 'medium',
      matchedKeyword: 'vehicle / physical asset',
    };
  }

  if (
    text.includes('startup') ||
    text.includes('venture') ||
    text.includes('private equity') ||
    text.includes('hedge fund') ||
    text.includes('angel')
  ) {
    return {
      suggestedCategory: 'Alternative & Private',
      suggestedType: 'asset',
      confidence: 'medium',
      matchedKeyword: 'alternative / private equity',
    };
  }

  return null;
}
