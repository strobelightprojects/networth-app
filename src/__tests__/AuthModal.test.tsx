import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from '../components/modals/AuthModal';

// Mock lib/firebase
vi.mock('../lib/firebase', () => ({
  signInWithGoogle: vi.fn(),
  signInGuest: vi.fn(),
  logoutUser: vi.fn(),
  deleteUserAccountAndData: vi.fn(),
  auth: {}
}));

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
  const onSyncLocalDataToCloud = vi.fn();

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

  it('calls handleGoogleSignIn when Google button is clicked', async () => {
    const { signInWithGoogle } = await import('../lib/firebase');
    (signInWithGoogle as any).mockResolvedValueOnce({});

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={null} onSyncLocalDataToCloud={onSyncLocalDataToCloud} isSyncing={false} />);
    
    const googleBtn = screen.getByText('Sign in with Google');
    fireEvent.click(googleBtn);
    
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls handleGuestSignIn when Guest button is clicked', async () => {
    const { signInGuest } = await import('../lib/firebase');
    (signInGuest as any).mockResolvedValueOnce({});

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={null} onSyncLocalDataToCloud={onSyncLocalDataToCloud} isSyncing={false} />);
    
    const guestBtn = screen.getByText('Continue as Guest (Anonymous Cloud Session)');
    fireEvent.click(guestBtn);
    
    await waitFor(() => {
      expect(signInGuest).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls handleLogout when Sign Out button is clicked', async () => {
    const { logoutUser } = await import('../lib/firebase');
    (logoutUser as any).mockResolvedValueOnce({});

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={{ uid: 'user1', email: 'test@test.com' } as any} onSyncLocalDataToCloud={onSyncLocalDataToCloud} isSyncing={false} />);
    
    const signOutBtn = screen.getByText('Sign Out');
    fireEvent.click(signOutBtn);
    
    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls handleDeleteAccount after confirmation', async () => {
    const { deleteUserAccountAndData } = await import('../lib/firebase');
    (deleteUserAccountAndData as any).mockResolvedValueOnce({});

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={{ uid: 'user1', email: 'test@test.com' } as any} onSyncLocalDataToCloud={onSyncLocalDataToCloud} isSyncing={false} />);
    
    const initDeleteBtn = screen.getByText('Delete Account & Purge Stored Data');
    fireEvent.click(initDeleteBtn);
    
    const confirmDeleteBtn = screen.getByText('Yes, Delete Everything');
    fireEvent.click(confirmDeleteBtn);
    
    await waitFor(() => {
      expect(deleteUserAccountAndData).toHaveBeenCalledWith({ uid: 'user1', email: 'test@test.com' });
      expect(onClose).toHaveBeenCalled();
    });
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
