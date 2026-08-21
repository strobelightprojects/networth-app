import React, { useState } from 'react';
import { Lock, AlertCircle, X } from 'lucide-react';
import { verifyPin, setupVault, removeVault } from '../lib/secureStorage';

interface VaultLockScreenProps {
  isSetup: boolean;
  onUnlock: (pin: string) => void;
  onCancel?: () => void;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ isSetup, onUnlock, onCancel }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetup) {
      if (pin.length < 4) {
        setError('PIN must be at least 4 characters.');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match.');
        return;
      }
      setupVault(pin);
      onUnlock(pin);
    } else {
      if (verifyPin(pin)) {
        onUnlock(pin);
      } else {
        setError('Incorrect PIN.');
        setPin('');
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("WARNING: This will permanently delete all your encrypted local data (API keys, offline portfolios). Are you sure?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full relative">
        {isSetup && onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Lock className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          {isSetup ? 'Setup Vault PIN' : 'Vault Locked'}
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          {isSetup
            ? 'Create a PIN to encrypt your local financial data and API keys.'
            : 'Enter your PIN to decrypt your local data.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {isSetup ? 'New PIN' : 'Enter PIN'}
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
              placeholder="••••"
            />
          </div>
          
          {isSetup && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirm PIN
              </label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                placeholder="••••"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {isSetup ? 'Encrypt & Setup' : 'Unlock Vault'}
          </button>
        </form>

        {!isSetup && (
          <div className="mt-6 text-center">
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Forgot PIN? Factory Reset App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
