import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SAMPLE_PORTFOLIOS, DEFAULT_PORTFOLIO } from './data/samplePortfolios';
import { PortfolioData, FinancialItem, CurrencyCode, ParsedSheetData, ImportOptions, ImportMode, HistoricalSnapshot, BatchFileSnapshot } from './types';
import { 
  Header, 
  KPICards, 
  AssetsLiabilitiesLedger, 
  NetWorthChart, 
  AllocationChart, 
  ImportModal, 
  ColumnMapperModal, 
  AddItemModal, 
  ManageFilesModal, 
  SettingsModal, 
  AuthModal, 
  PrivacyModal,
  ReportPreviewModal
} from './components';
import { auth, subscribeUserPortfolios, saveUserPortfolioToFirestore, deleteUserPortfolioFromFirestore, syncAllPortfoliosToFirestore } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const isExamplePortfolio = (p: PortfolioData): boolean => {
  if (!p) return true;
  const exampleIds = ['balanced-growth', 'fire-investor', 'real-estate-investor', 'sample-portfolio'];
  if (exampleIds.includes(p.id)) return true;
  const nameLower = (p.name || '').toLowerCase();
  if (
    nameLower.includes('balanced growth') ||
    nameLower.includes('fire investor') ||
    nameLower.includes('real estate investor') ||
    nameLower.includes('sample') ||
    nameLower.includes('example')
  ) {
    return true;
  }
  return false;
};

export default function App() {
  // Helper to sanitize portfolio data and ensure clean object structure
  const sanitizePortfolio = (p: PortfolioData): PortfolioData => {
    return {
      ...p,
      items: p.items || [],
      history: p.history || [],
    };
  };

  // Load initial portfolios from localStorage or default empty portfolio
  const [portfolios, setPortfolios] = useState<PortfolioData[]>(() => {
    try {
      const saved = localStorage.getItem('networth_pulse_portfolios');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((p) => !isExamplePortfolio(p));
          if (filtered.length > 0) {
            return filtered.map(sanitizePortfolio);
          }
        }
      }
    } catch (e) {
      console.error('Failed loading portfolios from localStorage', e);
    }
    const cleanSamples = SAMPLE_PORTFOLIOS.filter((p) => !isExamplePortfolio(p)).map(sanitizePortfolio);
    return cleanSamples.length > 0 ? cleanSamples : [DEFAULT_PORTFOLIO];
  });

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(() => {
    return portfolios[0]?.id || 'main-portfolio';
  });

  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  // Firebase User & Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const isFirestoreUpdateRef = useRef<boolean>(false);

  // Listen to Auth state changes and subscribe to Firestore portfolios
  const [isPrivacyBlur, setIsPrivacyBlur] = useState<boolean>(false);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (user) {
        let isInitialLoad = true;

        unsubFirestore = subscribeUserPortfolios(user.uid, (firestorePortfolios) => {
          // Identify and purge any example files from Firestore
          const realPortfolios = (firestorePortfolios || []).filter((p) => !isExamplePortfolio(p));

          (firestorePortfolios || []).forEach((p) => {
            if (isExamplePortfolio(p)) {
              deleteUserPortfolioFromFirestore(user.uid, p.id);
            }
          });

          if (realPortfolios.length > 0) {
            isFirestoreUpdateRef.current = true;
            setPortfolios(realPortfolios.map(sanitizePortfolio));
          } else if (isInitialLoad) {
            isInitialLoad = false;
            // First time login and user has 0 cloud portfolios
            const cleanLocal = portfolios.filter((p) => !isExamplePortfolio(p));
            const toSync = cleanLocal.length > 0 ? cleanLocal : [DEFAULT_PORTFOLIO];
            syncAllPortfoliosToFirestore(user.uid, toSync);
            isFirestoreUpdateRef.current = true;
            setPortfolios(toSync);
          } else {
            // User deleted all portfolios in cloud
            const defaultCleanPortfolio: PortfolioData = {
              id: `portfolio-${Date.now()}`,
              name: 'My Wealth Portfolio',
              currency,
              items: [],
              history: [
                {
                  date: new Date().toISOString().slice(0, 7),
                  totalAssets: 0,
                  totalLiabilities: 0,
                  netWorth: 0,
                },
              ],
            };
            saveUserPortfolioToFirestore(user.uid, defaultCleanPortfolio);
            isFirestoreUpdateRef.current = true;
            setPortfolios([defaultCleanPortfolio]);
          }
          isInitialLoad = false;
        });
      }
    });

    return () => {
      if (unsubFirestore) unsubFirestore();
      unsubscribe();
    };
  }, []);

  // Sync to localStorage and Firestore whenever portfolios change
  useEffect(() => {
    const cleanPortfolios = portfolios.filter((p) => !isExamplePortfolio(p));
    try {
      localStorage.setItem('networth_pulse_portfolios', JSON.stringify(cleanPortfolios));
    } catch (e) {
      console.error('Failed saving portfolios to localStorage', e);
    }

    if (isFirestoreUpdateRef.current) {
      isFirestoreUpdateRef.current = false;
      return;
    }

    if (currentUser) {
      cleanPortfolios.forEach((p) => {
        saveUserPortfolioToFirestore(currentUser.uid, p);
      });
    }
  }, [portfolios, currentUser]);

  const handleSyncLocalDataToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      const cleanPortfolios = portfolios.filter((p) => !isExamplePortfolio(p));
      await syncAllPortfoliosToFirestore(currentUser.uid, cleanPortfolios.length > 0 ? cleanPortfolios : [DEFAULT_PORTFOLIO]);
    } catch (err) {
      console.error('Cloud sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState<boolean>(false);
  const [parsedSheetForMapper, setParsedSheetForMapper] = useState<ParsedSheetData | null>(null);
  const [mapperImportOptions, setMapperImportOptions] = useState<ImportOptions | undefined>(undefined);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);
  const [isManageFilesOpen, setIsManageFilesOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState<boolean>(false);

  // Global Date Filter for Reports
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Helper to upsert history points chronologically
  const upsertHistoryPoint = (
    history: HistoricalSnapshot[],
    dateMonth: string,
    totalAssets: number,
    totalLiabilities: number,
    netWorth: number
  ): HistoricalSnapshot[] => {
    const existingIdx = history.findIndex((h) => h.date === dateMonth);
    let updatedHistory = [...history];
    if (existingIdx >= 0) {
      updatedHistory[existingIdx] = { date: dateMonth, totalAssets, totalLiabilities, netWorth };
    } else {
      updatedHistory.push({ date: dateMonth, totalAssets, totalLiabilities, netWorth });
    }
    return updatedHistory.sort((a, b) => a.date.localeCompare(b.date));
  };

  // File / Portfolio Management Handlers
  const handleDeletePortfolio = async (id: string) => {
    if (currentUser) {
      await deleteUserPortfolioFromFirestore(currentUser.uid, id);
    }
    setPortfolios((prev) => {
      const remaining = prev.filter((p) => p.id !== id && !isExamplePortfolio(p));
      if (remaining.length === 0) {
        // If last portfolio deleted, create default empty portfolio
        const defaultPortfolio: PortfolioData = {
          id: `portfolio-${Date.now()}`,
          name: 'My Wealth Portfolio',
          currency,
          items: [],
          history: [
            {
              date: new Date().toISOString().slice(0, 7),
              totalAssets: 0,
              totalLiabilities: 0,
              netWorth: 0,
            },
          ],
        };
        if (currentUser) {
          saveUserPortfolioToFirestore(currentUser.uid, defaultPortfolio);
        }
        setSelectedPortfolioId(defaultPortfolio.id);
        return [defaultPortfolio];
      }

      if (selectedPortfolioId === id) {
        setSelectedPortfolioId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleRenamePortfolio = (id: string, newName: string) => {
    setPortfolios((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleCreatePortfolio = (name: string) => {
    const newP: PortfolioData = {
      id: `portfolio-${Date.now()}`,
      name,
      currency,
      items: [],
      history: [
        {
          date: new Date().toISOString().slice(0, 7),
          totalAssets: 0,
          totalLiabilities: 0,
          netWorth: 0,
        },
      ],
    };
    setPortfolios((prev) => [...prev, newP]);
    setSelectedPortfolioId(newP.id);
  };

  // Active Portfolio Object
  const currentPortfolio = portfolios.find((p) => p.id === selectedPortfolioId) || portfolios[0];

  const filteredPortfolio = useMemo(() => {
    let items = currentPortfolio.items;
    let history = currentPortfolio.history;

    if (reportStartDate) {
      items = items.filter((i) => (i.lastUpdated || '') >= reportStartDate);
      history = history.filter((h) => h.date >= reportStartDate.substring(0, 7));
    }
    if (reportEndDate) {
      items = items.filter((i) => (i.lastUpdated || '') <= reportEndDate);
      history = history.filter((h) => h.date <= reportEndDate.substring(0, 7));
    }

    return { ...currentPortfolio, items, history };
  }, [currentPortfolio, reportStartDate, reportEndDate]);

  // Handle Item Updates (Inline edit or toggle)
  const handleUpdateItem = (updatedItem: FinancialItem) => {
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        return {
          ...p,
          items: p.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
        };
      })
    );
  };

  // Handle Item Deletion
  const handleDeleteItem = (id: string) => {
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        return {
          ...p,
          items: p.items.filter((i) => i.id !== id),
        };
      })
    );
  };

  // Handle Multiple Items Bulk Deletion
  const handleDeleteMultipleItems = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        return {
          ...p,
          items: p.items.filter((i) => !idSet.has(i.id)),
        };
      })
    );
  };

  // Handle Adding Single Item
  const handleAddItem = (newItem: FinancialItem) => {
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        return {
          ...p,
          items: [...p.items, newItem],
        };
      })
    );
  };

  // Handle Importing Array of Items (From Excel / Google Sheets) with ImportOptions
  const handleImportItems = (importedItems: FinancialItem[], options?: ImportOptions | string) => {
    let mode: ImportMode = 'replace';
    let importDate = new Date().toISOString().split('T')[0];
    let customPortfolioName: string | undefined = undefined;

    if (typeof options === 'string') {
      customPortfolioName = options;
    } else if (options) {
      mode = options.mode;
      importDate = options.importDate || importDate;
      customPortfolioName = options.portfolioName;
    }

    const monthKey = importDate.slice(0, 7); // e.g. "2025-01"
    const taggedItems = importedItems.map((item) => ({
      ...item,
      lastUpdated: importDate,
    }));

    const importedAssets = taggedItems.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
    const importedLiabilities = taggedItems.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
    const importedNetWorth = importedAssets - importedLiabilities;

    if (mode === 'new_portfolio') {
      const newName = customPortfolioName?.trim() || `Portfolio (${monthKey})`;
      const newPortfolio: PortfolioData = {
        id: `imported-${Date.now()}`,
        name: newName,
        currency,
        items: taggedItems,
        history: [
          {
            date: monthKey,
            totalAssets: importedAssets,
            totalLiabilities: importedLiabilities,
            netWorth: importedNetWorth,
          },
        ],
        milestones: [],
      };
      setPortfolios((prev) => [...prev, newPortfolio]);
      setSelectedPortfolioId(newPortfolio.id);
      return;
    }

    if (mode === 'snapshot_only') {
      // Historical CSV snapshot only - keep current active items intact, add history point!
      setPortfolios((prev) =>
        prev.map((p) => {
          if (p.id !== currentPortfolio.id) return p;
          const newHistory = upsertHistoryPoint(
            p.history,
            monthKey,
            importedAssets,
            importedLiabilities,
            importedNetWorth
          );
          return {
            ...p,
            history: newHistory,
          };
        })
      );
      return;
    }

    if (mode === 'append') {
      // Append items to current active items
      setPortfolios((prev) =>
        prev.map((p) => {
          if (p.id !== currentPortfolio.id) return p;
          const combinedItems = [...p.items, ...taggedItems];
          const totalAssets = combinedItems.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
          const totalLiabilities = combinedItems.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
          const netWorth = totalAssets - totalLiabilities;
          const newHistory = upsertHistoryPoint(p.history, monthKey, totalAssets, totalLiabilities, netWorth);
          return {
            ...p,
            items: combinedItems,
            history: newHistory,
          };
        })
      );
      return;
    }

    // Default 'replace': replace items in current portfolio
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        const newHistory = upsertHistoryPoint(
          p.history,
          monthKey,
          importedAssets,
          importedLiabilities,
          importedNetWorth
        );
        return {
          ...p,
          items: taggedItems,
          history: newHistory,
        };
      })
    );
  };

  // Handle Importing multiple files at once (Batch)
  const handleImportBatch = (batch: BatchFileSnapshot[], options: ImportOptions) => {
    if (!batch || batch.length === 0) return;

    // Sort batch snapshots chronologically (earliest date first)
    const sortedBatch = [...batch].sort((a, b) => a.importDate.localeCompare(b.importDate));
    const latestSnapshot = sortedBatch[sortedBatch.length - 1];

    let mode: ImportMode = options.mode || 'replace';
    let customPortfolioName = options.portfolioName;

    if (mode === 'new_portfolio') {
      const name = customPortfolioName?.trim() || `Portfolio (${sortedBatch.length} Statements)`;

      let newHistory: HistoricalSnapshot[] = [];
      sortedBatch.forEach((snap) => {
        const monthKey = snap.importDate.slice(0, 7);
        newHistory = upsertHistoryPoint(
          newHistory,
          monthKey,
          snap.totalAssets,
          snap.totalLiabilities,
          snap.netWorth
        );
      });

      // Preserve all statement items for historical ledger tracking
      const allBatchItems = sortedBatch.flatMap((s) => s.items);

      const newPortfolio: PortfolioData = {
        id: `imported-batch-${Date.now()}`,
        name,
        currency,
        items: allBatchItems,
        history: newHistory,
        milestones: [],
      };

      setPortfolios((prev) => [...prev, newPortfolio]);
      setSelectedPortfolioId(newPortfolio.id);
      return;
    }

    // Update existing active portfolio with all snapshot history points
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;

        let updatedHistory = [...p.history];
        sortedBatch.forEach((snap) => {
          const monthKey = snap.importDate.slice(0, 7);
          updatedHistory = upsertHistoryPoint(
            updatedHistory,
            monthKey,
            snap.totalAssets,
            snap.totalLiabilities,
            snap.netWorth
          );
        });

        let updatedItems = p.items;
        const allBatchItems = sortedBatch.flatMap((s) => s.items);
        if (mode === 'replace') {
          updatedItems = allBatchItems;
        } else if (mode === 'append') {
          updatedItems = [...p.items, ...allBatchItems];
        }

        return {
          ...p,
          items: updatedItems,
          history: updatedHistory,
        };
      })
    );
  };

  // Handler for adding manual history point from NetWorthChart
  const handleAddHistoryPoint = (point: { date: string; totalAssets: number; totalLiabilities: number; netWorth: number }) => {
    setPortfolios((prev) =>
      prev.map((p) => {
        if (p.id !== currentPortfolio.id) return p;
        const newHistory = upsertHistoryPoint(
          p.history,
          point.date,
          point.totalAssets,
          point.totalLiabilities,
          point.netWorth
        );
        return {
          ...p,
          history: newHistory,
        };
      })
    );
  };

  // CSV Export
  const handleExportCSV = (startDate?: string, endDate?: string) => {
    let items = currentPortfolio.items;
    let history = currentPortfolio.history;

    if (startDate) {
      items = items.filter((i) => (i.lastUpdated || '') >= startDate);
      history = history.filter((h) => h.date >= startDate.substring(0, 7));
    }
    if (endDate) {
      items = items.filter((i) => (i.lastUpdated || '') <= endDate);
      history = history.filter((h) => h.date <= endDate.substring(0, 7));
    }

    const headers = ['Account Name', 'Type', 'Category', 'Balance', 'Last Updated'];
    const rows = items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      i.type,
      `"${i.category}"`,
      i.value,
      i.lastUpdated || ''
    ]);

    const historyHeaders = ['Date (YYYY-MM)', 'Total Assets', 'Total Liabilities', 'Net Worth'];
    const historyRows = history.map((h) => [
      h.date,
      h.totalAssets,
      h.totalLiabilities,
      h.netWorth
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + 'Items\n'
      + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      + '\n\nHistory\n'
      + [historyHeaders.join(','), ...historyRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentPortfolio.name.toLowerCase().replace(/\s+/g, '_')}_net_worth.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (startDate?: string, endDate?: string) => {
    setIsSettingsModalOpen(false);
    setIsManageFilesOpen(false);
    setIsImportModalOpen(false);
    setIsColumnMapperOpen(false);
    setIsAddItemModalOpen(false);
    setIsAuthModalOpen(false);
    setIsPrivacyModalOpen(false);
    setIsReportPreviewOpen(false);
    setReportStartDate(startDate || '');
    setReportEndDate(endDate || '');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors">
      
      {/* Top Header */}
      <Header
        portfolio={currentPortfolio}
        portfoliosList={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSelectPortfolio={(id) => setSelectedPortfolioId(id)}
        onOpenManageFilesModal={() => setIsManageFilesOpen(true)}
        onDeleteCurrentPortfolio={() => handleDeletePortfolio(currentPortfolio.id)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddItemModal={() => setIsAddItemModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        currency={currency}
        onChangeCurrency={(c) => setCurrency(c)}
        currentUser={currentUser}
        isPrivacyBlur={isPrivacyBlur}
        onTogglePrivacyBlur={() => setIsPrivacyBlur(!isPrivacyBlur)}
      />

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Print-only Executive Report Header */}
        <div className="hidden print:block mb-8 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
                Net Worth & Personal Financial Audit Report
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {filteredPortfolio.name}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Consolidated Financial Statement • Account Items: {filteredPortfolio.items.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700">Statement Date</div>
              <div className="text-sm font-bold text-slate-900">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="text-xs text-slate-600 mt-1">Base Currency: {currency}</div>
            </div>
          </div>
          {(reportStartDate || reportEndDate) && (
            <div className="mt-3 p-2 bg-slate-100 rounded border border-slate-300 text-xs text-slate-700 font-medium">
              Filtered Date Range: {reportStartDate || 'Beginning'} to {reportEndDate || 'Present'}
            </div>
          )}
        </div>

        {/* KPI Cards Summary */}
        <KPICards portfolio={filteredPortfolio} currency={currency} isPrivacyBlur={isPrivacyBlur} />

        {/* Portfolio Allocation */}
        <div className="grid grid-cols-1 gap-6">
          <AllocationChart portfolio={filteredPortfolio} currency={currency} isPrivacyBlur={isPrivacyBlur} />
        </div>

        {/* Historical Net Worth Trajectory & Projection Chart */}
        <NetWorthChart
          portfolio={filteredPortfolio}
          currency={currency}
          isPrivacyBlur={isPrivacyBlur}
        />

        {/* Asset & Liability Ledger Table */}
        <AssetsLiabilitiesLedger
          items={filteredPortfolio.items}
          currency={currency}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDeleteMultipleItems={handleDeleteMultipleItems}
          onOpenAddItemModal={() => setIsAddItemModalOpen(true)}
          isPrivacyBlur={isPrivacyBlur}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-3">
        <p className="max-w-4xl mx-auto text-slate-400 leading-relaxed text-[11px]">
          <strong>Financial Disclaimer:</strong> Net Worth Tracker is strictly an informational tool provided for personal tracking and spreadsheet visualization. It does not constitute formal tax, legal, investment, financial planning, or accounting advice. Calculations and milestones are estimates based on user input.
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span>Net Worth Tracker © 2026</span>
          <span>•</span>
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
          >
            Privacy Policy & Terms
          </button>
          <span>•</span>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Security & Account
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportItems={handleImportItems}
        onImportBatch={handleImportBatch}
        onOpenColumnMapper={(parsedData, options) => {
          setParsedSheetForMapper(parsedData);
          setMapperImportOptions(options);
          setIsColumnMapperOpen(true);
        }}
      />

      <ColumnMapperModal
        parsedData={parsedSheetForMapper}
        importOptions={mapperImportOptions}
        baseCurrency={currency}
        onClose={() => {
          setIsColumnMapperOpen(false);
          setParsedSheetForMapper(null);
          setMapperImportOptions(undefined);
        }}
        onConfirmImport={handleImportItems}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={handleAddItem}
      />

      <ManageFilesModal
        isOpen={isManageFilesOpen}
        portfolios={portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onClose={() => setIsManageFilesOpen(false)}
        onSelectPortfolio={(id) => setSelectedPortfolioId(id)}
        onDeletePortfolio={handleDeletePortfolio}
        onRenamePortfolio={handleRenamePortfolio}
        onCreatePortfolio={handleCreatePortfolio}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        onPreviewReport={() => setIsReportPreviewOpen(true)}
      />

      <ReportPreviewModal
        isOpen={isReportPreviewOpen}
        onClose={() => setIsReportPreviewOpen(false)}
        portfolio={filteredPortfolio}
        currency={currency}
        onPrint={handlePrint}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSyncLocalDataToCloud={handleSyncLocalDataToCloud}
        isSyncing={isSyncing}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

    </div>
  );
}
