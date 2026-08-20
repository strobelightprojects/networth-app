import { describe, it, expect, beforeEach } from 'vitest';
import { setupVault, verifyPin, removeVault, isVaultEnabled, setSecureItem, getSecureItem } from '../lib/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reports vault disabled initially', () => {
    expect(isVaultEnabled()).toBe(false);
  });

  it('sets up vault and verifies pin correctly', () => {
    setupVault('1234');
    expect(isVaultEnabled()).toBe(true);
    expect(verifyPin('1234')).toBe(true);
    expect(verifyPin('0000')).toBe(false);
  });

  it('removes vault', () => {
    setupVault('1234');
    removeVault();
    expect(isVaultEnabled()).toBe(false);
  });

  it('stores plaintext when vault is disabled', () => {
    const data = { test: 'value' };
    setSecureItem('my_key', data, null);
    expect(localStorage.getItem('my_key')).toBe(JSON.stringify(data));
    expect(getSecureItem('my_key', null)).toEqual(data);
  });

  it('encrypts data when vault is enabled', () => {
    const data = { test: 'value' };
    setupVault('1234');
    setSecureItem('my_key', data, '1234');
    
    // Original key should be removed, encrypted_ key should exist
    expect(localStorage.getItem('my_key')).toBeNull();
    expect(localStorage.getItem('encrypted_my_key')).not.toBeNull();
    expect(localStorage.getItem('encrypted_my_key')).not.toContain('value');

    // Decrypting with correct pin
    expect(getSecureItem('my_key', '1234')).toEqual(data);
    
    // Decrypting with wrong pin yields null
    expect(getSecureItem('my_key', '0000')).toBeNull();
  });
});
