import React, { useState } from 'react';
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
  Menu,
  X,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { CurrencyCode, PortfolioData } from '../../types';

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
  theme?: string;
  onToggleTheme?: () => void;
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
  currency,
  onChangeCurrency,
  currentUser,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand logo & portfolio switcher */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  Net Worth Tracker
                </h1>
              </div>
              
              {/* Portfolio Selector Dropdown & File Management */}
              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedPortfolioId}
                  onChange={(e) => onSelectPortfolio(e.target.value)}
                  className="bg-transparent text-xs text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[200px] truncate py-0.5"
                >
                  {portfoliosList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Manage Files Button */}
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

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {/* Import Spreadsheet Button */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Sheet</span>
            </button>

            {/* Add Item Quick Button */}
            <button
              onClick={onOpenAddItemModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Add custom asset or liability"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Add Item</span>
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

            {/* Guide Modal Button */}
            <button
              onClick={onOpenGuideModal}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Google Sheets & Integration Guide"
            >
              <BookOpen className="w-4 h-4 text-teal-500" />
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Privacy & Legal Button */}
            <button
              onClick={onOpenPrivacyModal}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Privacy Policy & Terms"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </button>
          </div>

          {/* Mobile Direct Quick Action + Menu Toggle */}
          <div className="flex sm:hidden items-center gap-1.5">
            {/* Quick Add Item on Mobile */}
            <button
              onClick={onOpenAddItemModal}
              className="p-2 bg-emerald-600 text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm active:scale-95"
              title="Add Item"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Expanded Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-3 pb-4 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenImportModal();
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Sheet</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold ${
                  currentUser
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {currentUser ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cloud Active</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-slate-400" />
                    <span>Sign In / Sync</span>
                  </>
                )}
              </button>
            </div>

            {/* secondary Navigation List */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 space-y-1 border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettingsModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings & Export / Print</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGuideModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <BookOpen className="w-4 h-4 text-teal-500" />
                <span>Google Sheets Integration Guide</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacyModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Privacy & Security Policy</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

