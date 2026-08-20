import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from '../components/modals/AuthModal';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  GithubAuthProvider: vi.fn(),
  updateProfile: vi.fn(),
}));

describe('AuthModal component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders auth modal correctly', () => {
    render(<AuthModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText('User Account & Security')).toBeDefined();
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined();
  });

  it('handles sign in with email correctly', async () => {
    const auth = await import('firebase/auth');
    (auth.signInWithEmailAndPassword as any).mockResolvedValueOnce({ user: { uid: '123' } });

    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In with Email/i }));
    
    await waitFor(() => {
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles sign up switch and creation', async () => {
    const auth = await import('firebase/auth');
    (auth.createUserWithEmailAndPassword as any).mockResolvedValueOnce({ user: { uid: '123' } });

    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    fireEvent.click(screen.getByText(/Need an account\? Register/i));
    expect(screen.getByText(/Create Free Account/i)).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Create Free Account/i }));
    
    await waitFor(() => {
      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('displays error on failed sign in', async () => {
    const auth = await import('firebase/auth');
    (auth.signInWithEmailAndPassword as any).mockRejectedValueOnce(new Error('Invalid password'));
    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Sign In with Email/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid password/i)).toBeDefined();
    });
  });

  it('handles sign out correctly when user is logged in', async () => {
    const auth = await import('firebase/auth');
    const mockSignOut = vi.fn().mockResolvedValueOnce(undefined);
    (auth as any).signOut = mockSignOut;

    const mockUser = { uid: '123', email: 'test@example.com' } as any;

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={mockUser} onSyncLocalDataToCloud={vi.fn()} isSyncing={false} />);
    
    // UI should show "Signed In" state
    expect(screen.getByText('User Account & Security')).toBeDefined();
    
    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);
  });

  it('calls onSyncLocalDataToCloud if requested', async () => {
    const mockSync = vi.fn();
    const mockUser = { uid: '123', email: 'test@example.com' } as any;

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={mockUser} onSyncLocalDataToCloud={mockSync} isSyncing={false} />);
    
    const syncBtn = screen.getByRole('button', { name: /Force Sync Local Portfolios to Cloud/i });
    fireEvent.click(syncBtn);
    
    expect(mockSync).toHaveBeenCalled();
  });
});
