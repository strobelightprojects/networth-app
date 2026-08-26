import React, { useState } from 'react';
import { 
  FolderKanban, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Plus, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2,
  GitMerge
} from 'lucide-react';
import { PortfolioData } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ManageFilesModalProps {
  isOpen: boolean;
  portfolios: PortfolioData[];
  selectedPortfolioId: string;
  onClose: () => void;
  onSelectPortfolio: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onRenamePortfolio: (id: string, newName: string) => void;
  onCreatePortfolio: (name: string) => void;
  onOpenImportModal: () => void;
  onOpenMergeModal?: () => void;
}

export const ManageFilesModal: React.FC<ManageFilesModalProps> = ({
  isOpen,
  portfolios,
  selectedPortfolioId,
  onClose,
  onSelectPortfolio,
  onDeletePortfolio,
  onRenamePortfolio,
  onCreatePortfolio,
  onOpenImportModal,
  onOpenMergeModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newFileName, setNewFileName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartEdit = (p: PortfolioData) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onRenamePortfolio(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreatePortfolio(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const confirmDelete = (id: string) => {
    onDeletePortfolio(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Manage Portfolio Files</h3>
              <p className="text-xs text-slate-400">Select, rename, remove, or organize imported portfolio files.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Files / Portfolios ({portfolios.length})
            </span>
            <div className="flex items-center gap-2">
              {portfolios.length >= 2 && onOpenMergeModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMergeModal();
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                  title="Merge multiple portfolios into one"
                >
                  <GitMerge className="w-3.5 h-3.5" /> Merge Files
                </button>
              )}
              <button
                onClick={() => setIsCreating(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New File
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenImportModal();
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Import Sheet
              </button>
            </div>
          </div>

          {/* Inline Create Form */}
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 animate-fade-in">
              <label className="block text-xs font-bold text-slate-300">
                New Portfolio File Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Real Estate & Crypto Holdings"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Portfolio List */}
          <div className="space-y-2">
            {portfolios.map((p) => {
              const isSelected = p.id === selectedPortfolioId;
              const isEditing = editingId === p.id;
              const isDeleting = deleteConfirmId === p.id;
              const assetsTotal = p.items.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
              const liabilitiesTotal = p.items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
              const netWorth = assetsTotal - liabilitiesTotal;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {isDeleting ? (
                    <div className="flex items-center justify-between text-xs py-1 animate-fade-in">
                      <div className="flex items-center gap-2 text-rose-400 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Delete "{p.name}"? This action cannot be undone.</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => confirmDelete(p.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg"
                        >
                          Confirm Remove
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      {/* Left side info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => onSelectPortfolio(p.id)}
                          className={`mt-0.5 p-1 rounded-lg transition-colors ${
                            isSelected ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={isSelected ? 'Active File' : 'Switch to this File'}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="px-2 py-1 bg-slate-900 border border-emerald-500 rounded text-xs text-white font-bold focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(p.id)}
                                className="p-1 rounded bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 
                                onClick={() => onSelectPortfolio(p.id)}
                                className="font-bold text-sm text-white truncate cursor-pointer hover:text-emerald-400"
                              >
                                {p.name}
                              </h4>
                              {isSelected && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Active
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{p.items.length} accounts/items</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-300">
                              Net Worth: {formatCurrency(netWorth, p.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Rename file"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div>
            {portfolios.length >= 2 && onOpenMergeModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMergeModal();
                }}
                className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold text-xs rounded-xl border border-sky-500/20 flex items-center gap-1.5 transition-colors"
              >
                <GitMerge className="w-4 h-4" /> Merge Portfolios
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
