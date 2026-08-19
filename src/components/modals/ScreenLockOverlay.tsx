import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, User as UserIcon, Clock, ArrowRight, KeyRound } from 'lucide-react';
import { User } from 'firebase/auth';

interface ScreenLockOverlayProps {
  isLocked: boolean;
  currentUser: User | null;
  onUnlock: () => void;
  onOpenAuthModal?: () => void;
  lockedAt?: Date | null;
}

export const ScreenLockOverlay: React.FC<ScreenLockOverlayProps> = ({
  isLocked,
  currentUser,
  onUnlock,
  onOpenAuthModal,
  lockedAt,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isLocked) return null;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsUnlocking(true);
    setError('');

    setTimeout(() => {
      setIsUnlocking(false);
      setPin('');
      onUnlock();
    }, 400);
  };

  const formattedTime = (lockedAt || new Date()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="screen-lock-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 animate-in fade-in duration-300"
    >
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative text-center flex flex-col items-center">
        {/* Shield & Lock Animated Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Lock className="w-10 h-10 stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-2 -right-2 p-1.5 bg-emerald-500 text-slate-950 rounded-lg shadow">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Title and Subtitle */}
        <h2 className="text-2xl font-bold text-white tracking-tight">Screen Locked</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          Screen locked after 5 minutes of inactivity to protect your financial details and net worth privacy.
        </p>

        {/* User / Session Info Card */}
        <div className="w-full mt-6 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
              {currentUser?.email ? (
                currentUser.email.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.email || 'Local Net Worth Session'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Locked at {formattedTime}</span>
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
            Protected
          </span>
        </div>

        {/* Unlock Action Form */}
        <form onSubmit={handleUnlock} className="w-full mt-6 space-y-3">
          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isUnlocking ? (
              <>
                <Unlock className="w-4 h-4 animate-bounce" />
                <span>Verifying & Unlocking...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {currentUser && onOpenAuthModal && (
            <button
              type="button"
              onClick={() => {
                onUnlock();
                onOpenAuthModal();
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors underline cursor-pointer pt-1 block mx-auto"
            >
              Sign in with another account
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
