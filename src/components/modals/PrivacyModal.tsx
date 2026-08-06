import React from 'react';
import { X, ShieldCheck, Scale, Lock, Trash2, HardDrive, Info } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthModal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Privacy Policy & Terms of Service</h2>
            <p className="text-xs text-slate-400">Data collection, security measures & legal disclaimers</p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Data Collection & Usage */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-emerald-400" />
              1. What Data We Collect & Store
            </h3>
            <p className="text-slate-400">
              NetWorth Pulse is designed with a minimal data footprint. We only store:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Account Identifiers:</strong> Your email address or anonymous Firebase Auth UID when signed in.</li>
              <li><strong>Financial Figures:</strong> User-entered assets, liabilities, valuation amounts, category names, currency preferences, and net worth history logs.</li>
              <li><strong>Local Storage:</strong> Temporary cached copies of your active session data stored safely in your browser browser context.</li>
            </ul>
            <p className="text-slate-400 pt-1">
              We <strong>never</strong> collect bank login credentials, social security numbers, credit card numbers, or real account balances via direct institution connections.
            </p>
          </div>

          {/* Section 2: Security & Encryption */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              2. Data Security & Encryption Standards
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Firestore Isolation:</strong> Strict server-side Firestore Security Rules verify that only your authenticated account UID can read or write your documents.</li>
              <li><strong>Encryption:</strong> Data is encrypted in transit via TLS 1.3 and at rest using AES-256 standard encryption on Google Cloud Infrastructure.</li>
              <li><strong>No Third-Party Sharing:</strong> Your personal financial data is never sold, shared, or analyzed for advertising purposes.</li>
            </ul>
          </div>

          {/* Section 3: Retention & Automatic Deletion */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4 text-amber-400" />
              3. Data Compression & 1-Year Inactivity Cleanup Policy
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Historical Downsampling:</strong> History datapoints older than 180 days are automatically compressed into weekly averages to optimize cloud storage footprint.</li>
              <li><strong>1-Year Inactivity Purge:</strong> Accounts inactive for 365 consecutive days are subject to automatic database cleanup to prevent dormant data retention.</li>
              <li><strong>Instant Data Deletion:</strong> You can purge your entire cloud database record and delete your account at any time via the Account Security menu.</li>
            </ul>
          </div>

          {/* Section 4: Financial Disclaimer */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <h3 className="font-semibold text-amber-300 flex items-center gap-2 text-sm">
              <Scale className="w-4 h-4 text-amber-400" />
              4. Financial & Legal Disclaimer
            </h3>
            <p className="text-amber-200/90 leading-relaxed">
              NetWorth Pulse is strictly an informational tool provided for personal tracking and spreadsheet visualization. 
              <strong> It does not constitute formal tax, legal, investment, financial planning, or accounting advice.</strong> 
              Calculations, exchange conversions, and milestones are estimates based on user input. Always consult a qualified CPA or licensed financial advisor for professional guidance regarding financial decisions.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Manage Data & Account Purge</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Close Privacy & Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
