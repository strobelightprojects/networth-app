import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthModal } from '../components/modals/AuthModal';
import * as firebaseLib from '../lib/firebase';
import * as firebaseAuth from 'firebase/auth';

vi.mock('../lib/firebase', () => ({
  signInWithGoogle: vi.fn(),
  signInGuest: vi.fn(),
  logoutUser: vi.fn(),
  deleteUserAccountAndData: vi.fn(),
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AuthModal correctly when not logged in', () => {
    render(
      <AuthModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    expect(screen.getByText('User Account & Security')).toBeDefined();
    expect(screen.getByText('Sign in with Google')).toBeDefined();
    expect(screen.getByText('Continue as Guest (Anonymous Cloud Session)')).toBeDefined();
  });

  it('renders null when not open', () => {
    const { container } = render(
      <AuthModal
        isOpen={false}
        onClose={vi.fn()}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('handles Google sign in', async () => {
    const onClose = vi.fn();
    (firebaseLib.signInWithGoogle as any).mockResolvedValueOnce(undefined);
    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    fireEvent.click(screen.getByText('Sign in with Google'));
    await waitFor(() => {
      expect(firebaseLib.signInWithGoogle).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles Guest sign in', async () => {
    const onClose = vi.fn();
    (firebaseLib.signInGuest as any).mockResolvedValueOnce(undefined);
    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    fireEvent.click(screen.getByText('Continue as Guest (Anonymous Cloud Session)'));
    await waitFor(() => {
      expect(firebaseLib.signInGuest).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles email/password registration', async () => {
    const onClose = vi.fn();
    (firebaseAuth.createUserWithEmailAndPassword as any).mockResolvedValueOnce(undefined);
    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    fireEvent.click(screen.getByText('Need an account? Register'));
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Create Free Account'));
    await waitFor(() => {
      expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles email/password sign in', async () => {
    const onClose = vi.fn();
    (firebaseAuth.signInWithEmailAndPassword as any).mockResolvedValueOnce(undefined);
    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={null}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In with Email'));
    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows logged in user view and handles logout', async () => {
    const onClose = vi.fn();
    (firebaseLib.logoutUser as any).mockResolvedValueOnce(undefined);
    const mockUser: any = { uid: '123', email: 'test@example.com', isAnonymous: false };
    render(
      <AuthModal
        isOpen={true}
        onClose={onClose}
        currentUser={mockUser}
        onSyncLocalDataToCloud={vi.fn()}
        isSyncing={false}
      />
    );
    expect(screen.getByText('test@example.com')).toBeDefined();
    fireEvent.click(screen.getByText('Sign Out'));
    await waitFor(() => {
      expect(firebaseLib.logoutUser).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
