import React, { useState } from 'react';
import { Tag, Plus, Trash2, GripVertical, RotateCcw, AlertCircle } from 'lucide-react';
import { 
  CategoryType, 
  useCustomCategories, 
  saveCustomCategories, 
  resetCustomCategories 
} from '../../utils/categoryManager';

export const CategoryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CategoryType>('asset');
  
  const assetCategories = useCustomCategories('asset');
  const liabilityCategories = useCustomCategories('liability');
  const insuranceCategories = useCustomCategories('insurance');
  
  const [newCategory, setNewCategory] = useState('');

  const getActiveCategories = () => {
    if (activeTab === 'asset') return assetCategories;
    if (activeTab === 'liability') return liabilityCategories;
    return insuranceCategories;
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    
    const current = getActiveCategories();
    if (current.includes(trimmed)) return; // Prevent duplicates
    
    const updated = [...current, trimmed];
    saveCustomCategories(activeTab, updated);
    setNewCategory('');
  };

  const handleDeleteCategory = (cat: string) => {
    const current = getActiveCategories();
    const updated = current.filter(c => c !== cat);
    saveCustomCategories(activeTab, updated);
  };

  const handleReset = () => {
    if (window.confirm(`Are you sure you want to restore default ${activeTab} categories? Any custom categories not assigned to items will be lost.`)) {
      resetCustomCategories(activeTab);
    }
  };

  // Simple move up/down (since we don't have a drag-and-drop library ready)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const current = [...getActiveCategories()];
    if (direction === 'up' && index > 0) {
      const temp = current[index];
      current[index] = current[index - 1];
      current[index - 1] = temp;
      saveCustomCategories(activeTab, current);
    } else if (direction === 'down' && index < current.length - 1) {
      const temp = current[index];
      current[index] = current[index + 1];
      current[index + 1] = temp;
      saveCustomCategories(activeTab, current);
    }
  };

  const activeList = getActiveCategories();

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['asset', 'liability', 'insurance'] as CategoryType[]).map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
              activeTab === type 
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {type}s
          </button>
        ))}
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-yellow-900 dark:text-yellow-200/90 leading-relaxed">
          Modifying categories here will update the options in the Add Item menu and Ledger. Existing items with removed categories will keep them until edited.
        </p>
      </div>

      {/* Add New */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          placeholder={`Add new ${activeTab} category...`}
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={handleAddCategory}
          disabled={!newCategory.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {activeList.map((cat, index) => (
          <div key={cat} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl group">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cat}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleMove(index, 'up')}
                disabled={index === 0}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
              >
                ↑
              </button>
              <button 
                onClick={() => handleMove(index, 'down')}
                disabled={index === activeList.length - 1}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
              >
                ↓
              </button>
              <button 
                onClick={() => handleDeleteCategory(cat)}
                className="p-1 text-rose-400 hover:text-rose-600 disabled:opacity-30 ml-1"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleReset}
          className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          Restore Defaults
        </button>
      </div>
    </div>
  );
};
