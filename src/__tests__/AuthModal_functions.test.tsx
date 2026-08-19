import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthModal } from '../components/modals/AuthModal';

// Mock lib/firebase to track function calls
vi.mock('../lib/firebase', () => ({
  signInWithGoogle: vi.fn(),
  signInGuest: vi.fn(),
  logoutUser: vi.fn(),
  deleteUserAccountAndData: vi.fn(),
  auth: {}
}));

// Mock firebase/auth for the email/password interactions
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

describe('AuthModal functions', () => {
  const onClose = vi.fn();
  const onSyncLocalDataToCloud = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('displays error if Google auth fails with unauthorized domain', async () => {
    const { signInWithGoogle } = await import('../lib/firebase');
    (signInWithGoogle as any).mockRejectedValueOnce({ code: 'auth/unauthorized-domain' });

    render(<AuthModal isOpen={true} onClose={onClose} currentUser={null} onSyncLocalDataToCloud={onSyncLocalDataToCloud} isSyncing={false} />);
    
    const googleBtn = screen.getByText('Sign in with Google');
    fireEvent.click(googleBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Domain Not Authorized for Google Sign-In')).toBeDefined();
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

    // Render with an active user
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
    
    // Initial delete click opens confirmation
    const initDeleteBtn = screen.getByText('Delete Account & Purge Stored Data');
    fireEvent.click(initDeleteBtn);
    
    // Now confirm delete
    const confirmDeleteBtn = screen.getByText('Yes, Delete Everything');
    fireEvent.click(confirmDeleteBtn);
    
    await waitFor(() => {
      expect(deleteUserAccountAndData).toHaveBeenCalledWith({ uid: 'user1', email: 'test@test.com' });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
