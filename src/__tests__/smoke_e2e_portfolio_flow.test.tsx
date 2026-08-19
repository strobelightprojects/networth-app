import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return vi.fn();
  }),
}));

vi.mock('../lib/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  subscribeUserPortfolios: vi.fn(() => vi.fn()),
  saveUserPortfolioToFirestore: vi.fn(),
  deleteUserPortfolioFromFirestore: vi.fn(),
  syncAllPortfoliosToFirestore: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getFirestore: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('Smoke E2E Portfolio Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('smoke tests opening Manage Portfolios and creating a new portfolio file', async () => {
    render(<App />);

    // Open Manage Files / Portfolios modal via header button
    const manageBtn = screen.getByTitle('Manage & Remove Portfolio Files');
    fireEvent.click(manageBtn);

    expect(screen.getByText(/Manage Portfolio Files/i)).toBeDefined();

    // Click "New File" button to show creation form
    const newFileBtn = screen.getByText('New File');
    fireEvent.click(newFileBtn);

    // Enter name for new portfolio
    const newNameInput = screen.getByPlaceholderText(/Real Estate & Crypto Holdings/i);
    fireEvent.change(newNameInput, { target: { value: 'Retirement 2050' } });

    const createBtn = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getAllByText('Retirement 2050').length).toBeGreaterThan(0);
    });
  });

  it('smoke tests opening Settings modal from header', async () => {
    render(<App />);

    // Open Settings Modal
    const settingsBtn = screen.getByTitle('App Settings');
    fireEvent.click(settingsBtn);
    expect(screen.getByText(/App & Preferences Settings/i)).toBeDefined();
  });

  it('smoke tests opening Add Item modal and entering item details', async () => {
    render(<App />);

    const addItemBtn = screen.getByTitle('Add custom asset or liability');
    fireEvent.click(addItemBtn);

    expect(screen.getByText(/Add Financial Account/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Vanguard 401k/i)).toBeDefined();
  });
});
