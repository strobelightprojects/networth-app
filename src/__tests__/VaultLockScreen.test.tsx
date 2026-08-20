import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { VaultLockScreen } from '../components/VaultLockScreen';
import * as secureStorage from '../lib/secureStorage';

vi.mock('../lib/secureStorage', () => ({
  setupVault: vi.fn(),
  verifyPin: vi.fn(),
  removeVault: vi.fn(),
}));

describe('VaultLockScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in setup mode', () => {
    render(<VaultLockScreen isSetup={true} onUnlock={() => {}} />);
    expect(screen.getByText('Setup Vault PIN')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••')[0]).toBeInTheDocument();
    expect(screen.getByText('Confirm PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Encrypt & Setup' })).toBeInTheDocument();
  });

  it('renders correctly in unlock mode', () => {
    render(<VaultLockScreen isSetup={false} onUnlock={() => {}} />);
    expect(screen.getByText('Vault Locked')).toBeInTheDocument();
    expect(screen.queryByText('Confirm PIN')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock Vault' })).toBeInTheDocument();
  });

  it('shows error if PIN is too short during setup', () => {
    render(<VaultLockScreen isSetup={true} onUnlock={() => {}} />);
    
    const inputs = screen.getAllByPlaceholderText('••••');
    fireEvent.change(inputs[0], { target: { value: '123' } });
    fireEvent.change(inputs[1], { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt & Setup' }));

    expect(screen.getByText('PIN must be at least 4 characters.')).toBeInTheDocument();
  });

  it('shows error if PINs do not match during setup', () => {
    render(<VaultLockScreen isSetup={true} onUnlock={() => {}} />);
    
    const inputs = screen.getAllByPlaceholderText('••••');
    fireEvent.change(inputs[0], { target: { value: '1234' } });
    fireEvent.change(inputs[1], { target: { value: '1235' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt & Setup' }));

    expect(screen.getByText('PINs do not match.')).toBeInTheDocument();
  });

  it('calls setupVault and onUnlock on successful setup', () => {
    const onUnlock = vi.fn();
    render(<VaultLockScreen isSetup={true} onUnlock={onUnlock} />);
    
    const inputs = screen.getAllByPlaceholderText('••••');
    fireEvent.change(inputs[0], { target: { value: '1234' } });
    fireEvent.change(inputs[1], { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Encrypt & Setup' }));

    expect(secureStorage.setupVault).toHaveBeenCalledWith('1234');
    expect(onUnlock).toHaveBeenCalledWith('1234');
  });

  it('shows error if wrong PIN during unlock', () => {
    (secureStorage.verifyPin as any).mockReturnValue(false);
    render(<VaultLockScreen isSetup={false} onUnlock={() => {}} />);
    
    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Vault' }));

    expect(screen.getByText('Incorrect PIN.')).toBeInTheDocument();
  });

  it('calls onUnlock on successful unlock', () => {
    (secureStorage.verifyPin as any).mockReturnValue(true);
    const onUnlock = vi.fn();
    render(<VaultLockScreen isSetup={false} onUnlock={onUnlock} />);
    
    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock Vault' }));

    expect(onUnlock).toHaveBeenCalledWith('1234');
  });
});
