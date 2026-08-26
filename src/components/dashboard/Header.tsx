import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  TrendingUp, 
  FileSpreadsheet, 
  FolderKanban, 
  PlusCircle,
  Settings,
  Cloud,
  UserCheck,
  Menu,
  X,
  Lock,
  GitMerge
} from 'lucide-react';
import { PortfolioData } from '../../types';

interface HeaderProps {
  portfoliosList: PortfolioData[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenManageFilesModal: () => void;
  onOpenImportModal: () => void;
  onOpenAddItemModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
  currentUser: User | null;
  onLockVault?: () => void;
  isVaultEnabled?: boolean;
  onOpenMergeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  portfoliosList,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenManageFilesModal,
  onOpenImportModal,
  onOpenAddItemModal,
  onOpenSettingsModal,
  onOpenAuthModal,
  currentUser,
  onLockVault,
  isVaultEnabled,
  onOpenMergeModal,
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
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  id="header-portfolio-select"
                  value={selectedPortfolioId}
                  onChange={(e) => {
                    if (e.target.value === '__manage__') {
                      onOpenManageFilesModal();
                    } else if (e.target.value === '__merge__') {
                      if (onOpenMergeModal) onOpenMergeModal();
                    } else {
                      onSelectPortfolio(e.target.value);
                    }
                  }}
                  className="bg-transparent text-xs text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[170px] truncate py-0.5"
                >
                  {portfoliosList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                      {p.name}
                    </option>
                  ))}
                  {onOpenMergeModal && (
                    <option value="__merge__" className="bg-slate-100 dark:bg-slate-700 text-sky-600 dark:text-sky-400 font-semibold">
                      🔀 Merge Portfolios...
                    </option>
                  )}
                  <option value="__manage__" className="bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-semibold">
                    ⚙️ Manage Portfolios...
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            {onOpenMergeModal && (
              <button
                onClick={onOpenMergeModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Merge Portfolios"
              >
                <GitMerge className="w-4 h-4" />
                <span>Merge</span>
              </button>
            )}

            {/* Import Spreadsheet Button */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Data</span>
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
            
            {/* Account / Cloud Storage Button */}
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                currentUser
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={currentUser ? `Account Active (${currentUser.email || 'Guest'})` : 'Account & Cloud Storage'}
            >
              {currentUser ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="hidden md:inline font-semibold">Account</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Sign In</span>
                </>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {onLockVault && (
              <button
                onClick={onLockVault}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title={isVaultEnabled ? "Lock Vault" : "Setup Local Encryption Vault"}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Direct Quick Action + Menu Toggle */}
          <div className="flex sm:hidden items-center gap-1.5">
            {/* Quick Add Item on Mobile */}
            <button
              onClick={onOpenAddItemModal}
              className="p-2 bg-emerald-600 text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm active:scale-95 cursor-pointer"
              title="Add Item"
            >
              <PlusCircle className="w-4 h-4" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95 cursor-pointer"
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
                <span>Import Data</span>
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
                    <span>Account Active</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-slate-400" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>

            {/* Secondary Navigation List */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 space-y-1 border border-slate-200/60 dark:border-slate-800">
              {onOpenMergeModal && (
                <button
                  id="mobile-merge-portfolios-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMergeModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
                >
                  <GitMerge className="w-4 h-4 text-sky-500" />
                  <span>Merge Portfolios</span>
                </button>
              )}
              <button
                id="mobile-manage-files-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenManageFilesModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <FolderKanban className="w-4 h-4 text-slate-500" />
                <span>Manage Portfolios</span>
              </button>
              <button
                id="mobile-settings-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettingsModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings & Export</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
