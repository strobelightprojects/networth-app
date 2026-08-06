import React from 'react';
import { Wallet, ShieldCheck, CreditCard, Shield, TrendingUp, TrendingDown, ArrowUpRight, HeartHandshake } from 'lucide-react';
import { PortfolioData, CurrencyCode } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { getMostRecentItems } from '../../utils/itemHelpers';

interface KPICardsProps {
  portfolio: PortfolioData;
  currency: CurrencyCode;
}

export const KPICards: React.FC<KPICardsProps> = ({ portfolio, currency }) => {
  // Calculate Totals using most recent items per account
  const activeItems = getMostRecentItems(portfolio.items);

  const totalAssets = activeItems
    .filter((item) => item.type === 'asset')
    .reduce((sum, item) => sum + item.value, 0);

  const totalLiabilities = activeItems
    .filter((item) => item.type === 'liability')
    .reduce((sum, item) => sum + item.value, 0);

  const insuranceItems = activeItems.filter((item) => item.type === 'insurance');
  const totalInsuranceCoverage = insuranceItems.reduce((sum, item) => sum + item.value, 0);
  const insuranceCount = insuranceItems.length;

  const netWorth = totalAssets - totalLiabilities;

  // Equity Ratio (% of assets owned outright)
  const equityRatio = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 100;
  const assetCount = activeItems.filter(i => i.type === 'asset').length;
  const liabilityCount = activeItems.filter(i => i.type === 'liability').length;
  const avgAssetVal = assetCount > 0 ? totalAssets / assetCount : 0;

  // Month over month calculation
  let momChangePct = 0;
  let momChangeAmount = 0;
  if (portfolio.history.length >= 2) {
    const latest = portfolio.history[portfolio.history.length - 1];
    const prev = portfolio.history[portfolio.history.length - 2];
    momChangeAmount = latest.netWorth - prev.netWorth;
    momChangePct = prev.netWorth > 0 ? (momChangeAmount / prev.netWorth) * 100 : 0;
  }

  const leverageRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      
      {/* 1. NET WORTH CARD */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Worth</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight mb-2">
          {formatCurrency(netWorth, currency)}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center font-semibold px-2 py-0.5 rounded-md ${
            momChangeAmount >= 0 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {momChangeAmount >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {formatPercent(momChangePct)}
          </span>
          <span className="text-slate-400 text-[11px]">vs last month</span>
        </div>
      </div>

      {/* 2. TOTAL ASSETS CARD */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Assets</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight mb-2">
          {formatCurrency(totalAssets, currency)}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-blue-400 font-semibold">{assetCount} Assets</span>
          <span>•</span>
          <span>Avg {formatCurrency(avgAssetVal, currency, true)}</span>
        </div>
      </div>

      {/* 3. TOTAL LIABILITIES CARD */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Liabilities</span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight mb-2">
          {formatCurrency(totalLiabilities, currency)}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-rose-400">{leverageRatio.toFixed(1)}% Debt</span>
          <span>•</span>
          <span>{liabilityCount} Debts</span>
        </div>
      </div>

      {/* 4. INSURANCE & DEATH BENEFITS CARD (SEPARATE FROM NET WORTH) */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-purple-400" /> Insurance
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HeartHandshake className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight mb-1">
          {formatCurrency(totalInsuranceCoverage, currency)}
        </div>
        <div className="flex items-center justify-between text-xs text-purple-300/80">
          <span className="font-semibold text-purple-400">{insuranceCount} {insuranceCount === 1 ? 'Policy' : 'Policies'}</span>
          <span className="text-[10px] text-slate-400 font-medium">Excluded from Net Worth</span>
        </div>
      </div>

    </div>
  );
};
