import CryptoJS from 'crypto-js';

const PIN_HASH_KEY = 'networth_pulse_vault_pin_hash';
const VAULT_SALT = 'networth_pulse_secure_salt_v1';

export const isVaultEnabled = (): boolean => {
  return !!localStorage.getItem(PIN_HASH_KEY);
};

export const setupVault = (pin: string) => {
  const hash = CryptoJS.SHA256(pin + VAULT_SALT).toString();
  localStorage.setItem(PIN_HASH_KEY, hash);
};

export const verifyPin = (pin: string): boolean => {
  const hash = CryptoJS.SHA256(pin + VAULT_SALT).toString();
  return localStorage.getItem(PIN_HASH_KEY) === hash;
};

export const removeVault = () => {
  localStorage.removeItem(PIN_HASH_KEY);
};

export const setSecureItem = (key: string, data: any, pin: string | null) => {
  const jsonStr = JSON.stringify(data);
  if (!isVaultEnabled() || !pin) {
    localStorage.setItem(key, jsonStr);
    localStorage.removeItem(`encrypted_${key}`);
    return;
  }
  const encrypted = CryptoJS.AES.encrypt(jsonStr, pin).toString();
  localStorage.setItem(`encrypted_${key}`, encrypted);
  localStorage.removeItem(key);
};

export const getSecureItem = (key: string, pin: string | null): any => {
  // If vault is not enabled, read plaintext
  if (!isVaultEnabled()) {
    const plain = localStorage.getItem(key);
    return plain ? JSON.parse(plain) : null;
  }

  // If vault enabled but no pin provided, we can't decrypt
  if (!pin) return null;

  const encrypted = localStorage.getItem(`encrypted_${key}`);
  if (!encrypted) {
    // If vault enabled but data is still plaintext (migration), read and return it
    const plain = localStorage.getItem(key);
    return plain ? JSON.parse(plain) : null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, pin);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
};
