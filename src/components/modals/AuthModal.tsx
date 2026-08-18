import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Cloud, 
  CloudCheck, 
  UserCheck, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Database,
  Lock,
  Mail,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';
import { signInWithGoogle, signInGuest, logoutUser, deleteUserAccountAndData } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSyncLocalDataToCloud: () => void;
  isSyncing: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncLocalDataToCloud,
  isSyncing,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Google auth error:", err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google Sign-in pop-up was blocked by the browser or embedded iframe preview. You can open the app in a new tab, or sign in using Email/Password or Instant Guest Mode.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google OAuth yet. You can sign in using Email & Password or Instant Guest Mode.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInGuest();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in as guest');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUserAccountAndData(currentUser);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setError(err.message || "Failed to delete account. You may need to sign out and sign back in before deleting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">User Account & Security</h2>
            <p className="text-xs text-slate-400">Firebase Firestore (100% Free Tier Cloud Storage)</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {error.includes('unauthorized-domain') 
                  ? 'Domain Not Authorized for Google Sign-In' 
                  : 'Authentication Notice'}
              </span>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {error.includes('unauthorized-domain') ? (
                <>
                  Google Auth requires this hosting domain to be added to Firebase Console under <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
                </>
              ) : (
                error
              )}
            </p>

            {error.includes('unauthorized-domain') && (
              <div className="pt-2 border-t border-rose-500/20 space-y-2">
                <div className="text-[10px] text-slate-400 font-medium">Domain to add in Firebase Console:</div>
                <div className="bg-slate-950 p-2 rounded-lg flex items-center justify-between border border-slate-800">
                  <span className="font-mono text-[11px] text-emerald-400 truncate mr-2">
                    {typeof window !== 'undefined' ? window.location.hostname : 'current-domain'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] rounded flex items-center gap-1 font-medium shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Copied!' : 'Copy Domain'}</span>
                  </button>
                </div>

                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
                  💡 <strong>Instant Alternative:</strong> Sign in with <strong>Email &amp; Password</strong> or <strong>Continue as Guest</strong> below — they work immediately without requiring domain whitelisting!
                </div>
              </div>
            )}
          </div>
        )}

        {currentUser ? (
          /* User Logged In State */
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Active Account</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                  {currentUser.isAnonymous ? 'Guest Account' : 'Cloud Synced'}
                </span>
              </div>

              <div className="text-sm font-medium text-white truncate">
                {currentUser.email || (currentUser.isAnonymous ? `Guest (${currentUser.uid.substring(0, 8)}...)` : currentUser.displayName || 'Signed In User')}
              </div>

              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Isolated Firestore Rules
                </span>
                <span className="flex items-center gap-1.5 text-teal-300">
                  <HardDrive className="w-3.5 h-3.5" />
                  Auto-Compressed History
                </span>
              </div>
            </div>

            {/* Storage Optimization & Inactivity Policy */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Storage Saving & 1-Year Inactivity Policy</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                • <strong>Data Pruning:</strong> History points older than 180 days are automatically compressed into weekly averages to stay well under the free tier limit.
                <br />
                • <strong>1-Year Auto Cleanup:</strong> Accounts inactive for more than 365 consecutive days are marked for automatic deletion to keep cloud storage clean and free.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onSyncLocalDataToCloud}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                <CloudCheck className="w-4 h-4" />
                {isSyncing ? 'Syncing Portfolios...' : 'Force Sync Local Portfolios to Cloud'}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Sign Out
              </button>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer pt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account & Purge Stored Data</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Confirm Account Deletion</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    This will permanently delete your account and all stored portfolio documents from Cloud Firestore.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* User Signed Out / Login Form State */
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs rounded-xl transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">or Email</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-emerald-950 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing...' : isRegistering ? 'Create Free Account' : 'Sign In with Email'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-slate-400 hover:text-emerald-400 underline"
                >
                  {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2 px-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl border border-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Continue as Guest (Anonymous Cloud Session)</span>
              </button>
            </div>
          </div>
        )}

        {/* Security & Free Tier Info Banner */}
        <div className="mt-4 p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Strict owner-only Firestore Security Rules prevent unauthorized access. Data is protected with AES-256 encryption at rest under Firebase&apos;s 100% free tier.
          </span>
        </div>
      </div>
    </div>
  );
};

