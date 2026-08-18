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
});
