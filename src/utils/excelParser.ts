import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FinancialItem, ParsedSheetData, ColumnMapping, ItemType, AssetCategory, LiabilityCategory, InsuranceCategory } from '../types';
import { detectCurrencyCodeFromText, convertCurrencyAmount, DEFAULT_USD_RATES } from './currency';

/**
 * Parses XLSX/XLS ArrayBuffer file using SheetJS
 */
export function parseExcelFile(arrayBuffer: ArrayBuffer, fileName: string): ParsedSheetData {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const activeSheetName = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[activeSheetName];

  // Convert worksheet to raw 2D array matrix first
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Convert matrix back to CSV format to pass through smart CSV parser
  const csvContent = rawMatrix.map(row => row.map(cell => {
    const str = String(cell ?? '');
    return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(',')).join('\n');

  return parseCSVText(csvContent, fileName);
}

/**
 * Smart Multi-Section CSV Parser
 * Handles both standard single-table CSVs and complex multi-section/formatted ledger spreadsheets
 */
export function parseCSVText(csvContent: string, fileName: string = 'Spreadsheet.csv'): ParsedSheetData {
  const parsedRaw = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  const rawRows = parsedRaw.data || [];
  if (rawRows.length === 0) {
    return {
      fileName,
      sheetNames: ['CSV Data'],
      activeSheetName: 'CSV Data',
      headers: [],
      rows: [],
      suggestedMapping: { nameCol: '', valueCol: '' },
    };
  }

  // Detect if file is a multi-section spreadsheet or single table
  let isMultiSection = false;
  let sectionHeaderCount = 0;

  for (let i = 0; i < Math.min(rawRows.length, 35); i++) {
    const rowStr = rawRows[i].join(' ').toLowerCase();
    if (
      rowStr.includes('asset / line item') ||
      rowStr.includes('ledger summary') ||
      /^\d+\.\s+/.test(String(rawRows[i][0] || '').trim())
    ) {
      sectionHeaderCount++;
    }
  }

  const firstRowStr = rawRows[0].join(' ').toLowerCase();
  const hasStandardHeaderRow = rawRows.length > 0 && 
    (firstRowStr.includes('name') || firstRowStr.includes('account') || firstRowStr.includes('asset')) &&
    (firstRowStr.includes('value') || firstRowStr.includes('balance') || firstRowStr.includes('amount'));

  if (sectionHeaderCount >= 1 || (!hasStandardHeaderRow && rawRows.length > 5)) {
    isMultiSection = true;
  }

  if (isMultiSection) {
    const normalizedRows: Record<string, any>[] = [];
    let currentCategory = 'General';
    let nameColIdx = 0;
    let valueColIdx = 1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i].map((c) => String(c || '').trim());
      const nonEmp = row.map((val, idx) => ({ val, idx })).filter((item) => item.val !== '');

      if (nonEmp.length === 0) continue;

      const firstVal = nonEmp[0].val;
      const firstValLower = firstVal.toLowerCase();

      // Skip top title row or summary row
      if (firstValLower.includes('ledger summary') || firstValLower.includes('net worth summary')) {
        continue;
      }

      // Check if next row has headers like "Asset / Line Item"
      const nextRow = i < rawRows.length - 1 ? rawRows[i + 1].map((c) => String(c || '').trim().toLowerCase()) : [];
      const nextRowIsHeader = nextRow.some(
        (c) => c.includes('asset') || c.includes('line item') || c.includes('account') || c.includes('holding')
      );

      // Check if section header
      if (
        nextRowIsHeader ||
        /^\d+\.\s+/.test(firstVal) ||
        /^(real estate|work|accounts?|accts|retirement|insurance|hsa|holdings|misc|precious metals|liabilities|debts|assets)/i.test(firstVal)
      ) {
        if (!firstValLower.includes('asset') && !firstValLower.includes('line item') && !firstValLower.includes('subtotal')) {
          currentCategory = firstVal.replace(/^\d+\.\s*/, '').trim();
          continue;
        }
      }

      // Check column headers row
      if (
        firstValLower.includes('asset') ||
        firstValLower.includes('line item') ||
        firstValLower.includes('account') ||
        (firstValLower.includes('name') && !firstValLower.includes('first name'))
      ) {
        for (let c = 0; c < row.length; c++) {
          const cellLower = row[c].toLowerCase();
          if (cellLower.includes('asset') || cellLower.includes('line item') || cellLower.includes('account') || cellLower.includes('name')) {
            nameColIdx = c;
          } else if (
            cellLower.includes('amount') ||
            cellLower.includes('value') ||
            cellLower.includes('balance') ||
            cellLower.includes('$') ||
            cellLower.includes('acct value')
          ) {
            valueColIdx = c;
          }
        }
        continue;
      }

      // Skip subtotal / total rows
      if (firstValLower.includes('subtotal') || firstValLower.includes('total') || firstValLower === 'summary') {
        continue;
      }

      const rawName = row[nameColIdx] || firstVal;
      if (!rawName || rawName.toLowerCase().includes('subtotal') || rawName.toLowerCase().includes('total')) continue;

      let rawValStr = row[valueColIdx] || '';
      if (!rawValStr || !/[\d]/.test(rawValStr)) {
        for (let c = row.length - 1; c > 0; c--) {
          if (c !== nameColIdx && row[c] && /[\d]/.test(row[c]) && row[c] !== '?') {
            rawValStr = row[c];
            break;
          }
        }
      }

      const hasNum = /[\d]/.test(rawValStr);
      if (!hasNum && nonEmp.length === 1) continue;

      const cleanNum = parseFloat(rawValStr.replace(/[^0-9.-]/g, '')) || 0;

      normalizedRows.push({
        'Account Name': rawName,
        'Value ($)': cleanNum,
        'Category': currentCategory,
        'Type': /liab|debt|loan|mortgage|credit/i.test(currentCategory) ? 'liability' : 'asset',
      });
    }

    if (normalizedRows.length > 0) {
      return {
        fileName,
        sheetNames: ['Parsed Sheet'],
        activeSheetName: 'Parsed Sheet',
        headers: ['Account Name', 'Value ($)', 'Category', 'Type'],
        rows: normalizedRows,
        suggestedMapping: {
          nameCol: 'Account Name',
          valueCol: 'Value ($)',
          categoryCol: 'Category',
          typeCol: 'Type',
        },
      };
    }
  }

  // Fallback to standard PapaParse header mode for uniform single-table CSVs
  const standardParsed = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const stdRows = standardParsed.data || [];
  const headers = stdRows.length > 0 ? Object.keys(stdRows[0]) : [];

  return {
    fileName,
    sheetNames: ['CSV Data'],
    activeSheetName: 'CSV Data',
    headers,
    rows: stdRows,
    suggestedMapping: suggestColumnMapping(headers),
  };
}

/**
 * Auto-detects headers based on fuzzy keywords
 */
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    nameCol: '',
    valueCol: '',
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // 1. Name column
  const nameKeywords = ['name', 'account', 'asset', 'item', 'description', 'holding', 'title', 'account name'];
  for (const kw of nameKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.nameCol = headers[idx];
      break;
    }
  }
  if (!mapping.nameCol && headers.length > 0) {
    mapping.nameCol = headers[0];
  }

  // 2. Value column
  const valueKeywords = ['value', 'balance', 'amount', 'current value', 'val', 'price', 'usd', 'total', 'worth'];
  for (const kw of valueKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.valueCol = headers[idx];
      break;
    }
  }
  if (!mapping.valueCol && headers.length > 1) {
    mapping.valueCol = headers[1];
  }

  // 3. Type column (Asset vs Liability)
  const typeKeywords = ['type', 'asset/liability', 'side', 'kind', 'class'];
  for (const kw of typeKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.typeCol = headers[idx];
      break;
    }
  }

  // 4. Category column
  const catKeywords = ['category', 'asset class', 'group', 'tag', 'sector'];
  for (const kw of catKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.categoryCol = headers[idx];
      break;
    }
  }

  // 5. Currency column
  const currKeywords = ['currency', 'curr', 'fx', 'ccy', 'denom'];
  for (const kw of currKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.currencyCol = headers[idx];
      break;
    }
  }

  // 6. Date column
  const dateKeywords = ['date', 'as of date', 'as of', 'statement date', 'transaction date', 'updated date', 'last updated', 'created', 'period', 'month', 'timestamp'];
  for (const kw of dateKeywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      mapping.dateCol = headers[idx];
      break;
    }
  }

  return mapping;
}

/**
 * Safely parses string, JS Date object, or Excel serial into YYYY-MM-DD
 */
export function parseDateString(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // Handle JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }

  // Handle Excel Serial number (e.g. 44500 -> 2021-11-03)
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Try YYYY-MM-DD
  const ymd = str.match(/\b(20\d\d)[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // Try MM/DD/YYYY or M/D/YYYY
  const mdy = str.match(/\b(0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])[-/.](20\d\d)\b/);
  if (mdy) {
    const mm = mdy[1].padStart(2, '0');
    const dd = mdy[2].padStart(2, '0');
    return `${mdy[3]}-${mm}-${dd}`;
  }

  // Try DD/MM/YYYY where DD > 12
  const dmy = str.match(/\b([012]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d\d)\b/);
  if (dmy && Number(dmy[1]) > 12) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${mm}-${dd}`;
  }

  // Try YYYY-MM
  const ym = str.match(/\b(20\d\d)[-/.](0[1-9]|1[0-2])\b/);
  if (ym) return `${ym[1]}-${ym[2]}-01`;

  // Try standard JS Date parse (e.g. "January 15, 2024", "Jan 2024")
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2099) {
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

/**
 * Searches rows, headers, and filename for an "As Of" date or statement date
 */
export function detectGlobalDateFromSheet(rows: Record<string, any>[], fileName?: string): string | null {
  // 1. Scan rows for explicit date cells or "as of" text
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    for (const val of Object.values(row)) {
      if (!val) continue;
      const strVal = String(val).trim();

      const asOfMatch = strVal.match(/as\s+of\s+([a-zA-Z0-9\s,/-]+)/i);
      if (asOfMatch && asOfMatch[1]) {
        const parsedAsOf = parseDateString(asOfMatch[1]);
        if (parsedAsOf) return parsedAsOf;
      }

      const parsedDirect = parseDateString(strVal);
      if (parsedDirect && (strVal.includes('-') || strVal.includes('/') || strVal.includes('20'))) {
        return parsedDirect;
      }
    }
  }

  // 2. Scan filename
  if (fileName) {
    const fnDate = extractDateFromFilename(fileName, '');
    if (fnDate) return fnDate;
  }

  return null;
}

/**
 * Converts parsed table rows to FinancialItem array given a column mapping
 */
export function convertRowsToItems(
  rows: Record<string, any>[],
  mapping: ColumnMapping,
  baseCurrency: string = 'USD',
  rates: Record<string, number> = DEFAULT_USD_RATES,
  defaultDate?: string
): FinancialItem[] {
  const items: FinancialItem[] = [];

  // Determine global sheet date if defaultDate not provided
  const globalSheetDate = defaultDate || detectGlobalDateFromSheet(rows) || new Date().toISOString().split('T')[0];

  rows.forEach((row, idx) => {
    const rawName = String(row[mapping.nameCol] || '').trim();
    const rawValCell = row[mapping.valueCol];

    if (!rawName) return;

    const rawValStr = String(rawValCell ?? '');

    // Extract raw numeric balance
    let numValue = 0;
    if (typeof rawValCell === 'number') {
      numValue = rawValCell;
    } else {
      const cleanStr = rawValStr.replace(/[^0-9.-]/g, '');
      numValue = parseFloat(cleanStr) || 0;
    }

    // Detect Currency
    let detectedCurr: string | null = null;
    if (mapping.currencyCol && row[mapping.currencyCol]) {
      detectedCurr = detectCurrencyCodeFromText(String(row[mapping.currencyCol]));
    }
    if (!detectedCurr) {
      // Try detecting from raw value string (e.g., "€10,000", "£500", "CAD 2,000")
      detectedCurr = detectCurrencyCodeFromText(rawValStr);
    }
    if (!detectedCurr) {
      // Try detecting from name (e.g. "European Real Estate (EUR)", "UK Savings (GBP)")
      detectedCurr = detectCurrencyCodeFromText(rawName);
    }

    const itemCurrency = detectedCurr || baseCurrency;

    // Convert to base portfolio currency
    const rawNumAbs = Math.abs(numValue);
    const { convertedValue, exchangeRate } = convertCurrencyAmount(rawNumAbs, itemCurrency, baseCurrency, rates);

    // Determine type
    let itemType: ItemType = 'asset';
    let rawTypeStr = mapping.typeCol ? String(row[mapping.typeCol] || '').toLowerCase() : '';
    let rawCatStr = mapping.categoryCol ? String(row[mapping.categoryCol] || '').toLowerCase() : '';
    let nameLower = rawName.toLowerCase();

    // Check negative numbers as liabilities if not specified
    let isNegativeValue = numValue < 0;

    if (
      rawTypeStr.includes('insur') ||
      rawCatStr.includes('insur') ||
      rawTypeStr.includes('benefit') ||
      nameLower.includes('insurance') ||
      nameLower.includes('death benefit')
    ) {
      itemType = 'insurance';
    } else if (
      rawTypeStr.includes('liab') ||
      rawTypeStr.includes('debt') ||
      rawTypeStr.includes('loan') ||
      rawTypeStr.includes('credit') ||
      rawCatStr.includes('mortgage') ||
      rawCatStr.includes('loan') ||
      rawCatStr.includes('debt') ||
      nameLower.includes('mortgage') ||
      nameLower.includes('loan') ||
      nameLower.includes('credit card') ||
      isNegativeValue
    ) {
      itemType = 'liability';
    }

    // Determine category
    let category: AssetCategory | LiabilityCategory | InsuranceCategory = inferCategory(rawName, rawCatStr, itemType);

    // Detect Date for this specific row
    let itemDate: string | null = null;

    if (mapping.dateCol && row[mapping.dateCol]) {
      itemDate = parseDateString(row[mapping.dateCol]);
    }

    if (!itemDate) {
      // Search row cells for a valid date string
      for (const [key, cellVal] of Object.entries(row)) {
        if (key === mapping.nameCol || key === mapping.valueCol) continue;
        const parsedCellDate = parseDateString(cellVal);
        if (parsedCellDate) {
          itemDate = parsedCellDate;
          break;
        }
      }
    }

    const finalItemDate = itemDate || globalSheetDate;

    items.push({
      id: `imported-${Date.now()}-${idx}`,
      name: rawName,
      category,
      type: itemType,
      value: convertedValue,
      originalValue: rawNumAbs,
      currency: itemCurrency,
      exchangeRate: exchangeRate,
      lastUpdated: finalItemDate,
    });
  });

  return items;
}

import { suggestCategoryFromAccountName } from './aiCategorySuggester';

/**
 * Infer asset/liability/insurance category from strings using AI heuristic
 */
export function inferCategory(name: string, catStr: string, type: ItemType): AssetCategory | LiabilityCategory | InsuranceCategory {
  const aiMatch = suggestCategoryFromAccountName(name + ' ' + catStr);
  if (aiMatch) {
    return aiMatch.suggestedCategory;
  }

  const combined = (name + ' ' + catStr).toLowerCase();

  if (type === 'insurance') {
    if (combined.includes('term')) return 'Term Life Insurance';
    if (combined.includes('whole')) return 'Whole Life Insurance';
    if (combined.includes('universal')) return 'Universal Life Insurance';
    if (combined.includes('disability')) return 'Disability Insurance';
    if (combined.includes('health') || combined.includes('long-term care')) return 'Health & Long-Term Care';
    return 'Term Life Insurance';
  } else if (type === 'liability') {
    if (combined.includes('mortgage') || combined.includes('home loan')) return 'Mortgage';
    if (combined.includes('credit') || combined.includes('card')) return 'Credit Cards';
    if (combined.includes('student') || combined.includes('education')) return 'Student Loans';
    if (combined.includes('auto') || combined.includes('car') || combined.includes('vehicle loan')) return 'Auto Loans';
    if (combined.includes('personal loan')) return 'Personal Loans';
    return 'Other Liabilities';
  } else {
    if (combined.includes('stock') || combined.includes('etf') || combined.includes('equity') || combined.includes('index') || combined.includes('fund') || combined.includes('shares')) return 'Stocks & ETFs';
    if (combined.includes('house') || combined.includes('real estate') || combined.includes('property') || combined.includes('home') || combined.includes('condo') || combined.includes('duplex')) return 'Real Estate';
    if (combined.includes('401k') || combined.includes('ira') || combined.includes('pension') || combined.includes('retirement') || combined.includes('403b')) return 'Retirement (401k/IRA)';
    if (combined.includes('cash') || combined.includes('checking') || combined.includes('savings') || combined.includes('hysa') || combined.includes('money market')) return 'Cash & Equivalents';
    if (combined.includes('crypto') || combined.includes('bitcoin') || combined.includes('btc') || combined.includes('eth') || combined.includes('solana') || combined.includes('coin')) return 'Crypto';
    if (combined.includes('bond') || combined.includes('treasury') || combined.includes('cd') || combined.includes('fixed income')) return 'Bonds & Fixed Income';
    if (combined.includes('car') || combined.includes('tesla') || combined.includes('vehicle') || combined.includes('watch') || combined.includes('gold')) return 'Vehicle & Physical';
    return 'Alternative & Private';
  }
}

/**

 */


/**
 * Extract date from filename if available (e.g. jan_2025.csv, 2026-01.xlsx, Portfolio_2024.csv)
 */
export function extractDateFromFilename(filename: string, fallbackDate: string = ''): string {
  if (!filename) return fallbackDate;
  const name = filename.toLowerCase();

  // Try YYYY-MM-DD
  const ymd = name.match(/(20\d\d)[-_.](0[1-9]|1[0-2])[-_.](0[1-9]|[12]\d|3[01])/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  // Try YYYY-MM
  const ym = name.match(/(20\d\d)[-_.](0[1-9]|1[0-2])/);
  if (ym) return `${ym[1]}-${ym[2]}`;

  // Try Month Year e.g. jan_2025, january2025, jan2025, 2025_jan
  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  const monthKeys = Object.keys(monthMap).join('|');
  const monthYearMatch = name.match(new RegExp(`(${monthKeys})[\\s-_.]*(20\\d\\d)`));
  if (monthYearMatch) {
    const mStr = monthMap[monthYearMatch[1]];
    const yStr = monthYearMatch[2];
    return `${yStr}-${mStr}`;
  }

  const yearMonthMatch = name.match(new RegExp(`(20\\d\\d)[\\s-_.]*(${monthKeys})`));
  if (yearMonthMatch) {
    const yStr = yearMonthMatch[1];
    const mStr = monthMap[yearMonthMatch[2]];
    return `${yStr}-${mStr}`;
  }

  // Try just year 20XX
  const yearOnly = name.match(/(20\d\d)/);
  if (yearOnly) {
    return `${yearOnly[1]}-01`;
  }

  return fallbackDate;
}
