import React from 'react';
import { User } from 'firebase/auth';
import { 
  TrendingUp, 
  FileSpreadsheet, 
  FolderKanban, 
  PlusCircle,
  Trash2,
  FolderCog,
  Settings,
  Cloud,
  UserCheck,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { CurrencyCode, PortfolioData } from '../../types';
import { CURRENCY_SYMBOLS } from '../../utils/formatters';

interface HeaderProps {
  portfolio: PortfolioData;
  portfoliosList: PortfolioData[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenManageFilesModal: () => void;
  onDeleteCurrentPortfolio: () => void;
  onOpenImportModal: () => void;
  onOpenGuideModal: () => void;
  onOpenAddItemModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
  onOpenPrivacyModal: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  currency: CurrencyCode;
  onChangeCurrency: (c: CurrencyCode) => void;
  currentUser: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  portfolio,
  portfoliosList,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenManageFilesModal,
  onDeleteCurrentPortfolio,
  onOpenImportModal,
  onOpenGuideModal,
  onOpenAddItemModal,
  onOpenSettingsModal,
  onOpenAuthModal,
  onOpenPrivacyModal,
  onExportCSV,
  onPrint,
  currency,
  onChangeCurrency,
  currentUser,
}) => {
  return (
    <header className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand logo & portfolio switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">Net Worth Tracker</h1>
            </div>
            
            {/* Portfolio Selector Dropdown & File Management */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedPortfolioId}
                onChange={(e) => onSelectPortfolio(e.target.value)}
                className="bg-transparent text-xs text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {portfoliosList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Manage Files Modal Button */}
              <button
                onClick={onOpenManageFilesModal}
                className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Manage & Remove Portfolio Files"
              >
                <FolderCog className="w-3.5 h-3.5" />
              </button>

              {/* Delete Active File Button */}
              <button
                onClick={onDeleteCurrentPortfolio}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                title={`Remove file "${portfolio.name}"`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Import Spreadsheet Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Import Sheet / Excel</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* Add Item Quick Button */}
          <button
            onClick={onOpenAddItemModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Add custom asset or liability"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="hidden lg:inline">Add Item</span>
          </button>
          
          {/* Account / Cloud Sync Button */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              currentUser
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={currentUser ? `Cloud Sync Active (${currentUser.email || 'Guest'})` : 'Cloud Sync & Account'}
          >
            {currentUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="hidden md:inline font-semibold">Cloud Active</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Sign In / Sync</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors hidden sm:flex cursor-pointer"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Privacy & Legal Button */}
          <button
            onClick={onOpenPrivacyModal}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors hidden sm:flex cursor-pointer"
            title="Privacy Policy & Terms"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </button>
        </div>

      </div>
    </header>
  );
};
