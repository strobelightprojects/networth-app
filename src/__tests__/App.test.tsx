import { vi, describe, it, expect } from 'vitest';
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
  syncAllPortfoliosToFirestore: vi.fn()
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getFirestore: vi.fn(),
  collection: vi.fn()
}));
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

describe('App', () => {
  it('renders without crashing and can interact with modals', async () => {
    render(<App />);
    expect(screen.getAllByText('Net Worth').length).toBeGreaterThan(0);
    
    // Open Add Item Modal
    fireEvent.click(screen.getAllByText('Add Item')[0]);
    expect(screen.getByText('Add Financial Account')).toBeDefined();
    fireEvent.click(screen.getByText('Cancel'));
    
    // Open Settings
    fireEvent.click(screen.getByTitle('App Settings'));
    expect(screen.getByText('App & Preferences Settings')).toBeDefined();
    // close
    const closeBtns = document.querySelectorAll('button');
    const closeBtn = Array.from(closeBtns).find(btn => btn.querySelector('.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);
  });

  it('can open the Import Data modal', async () => {
    render(<App />);
    
    // Find and click the desktop Import Data button
    const importButtons = screen.getAllByText('Import Data');
    fireEvent.click(importButtons[0]);
    
    // Assert the modal opens
    expect(screen.getByText('Import Financial Data')).toBeDefined();
    
    // Close the modal
    const closeBtns = document.querySelectorAll('button');
    const closeBtn = Array.from(closeBtns).find(btn => btn.querySelector('.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);
  });
  
  it('can add a new item and update state', async () => {
    render(<App />);
    
    // Open Add Item Modal
    fireEvent.click(screen.getAllByText('Add Item')[0]);
    
    // Fill out form
    const nameInput = screen.getByPlaceholderText('e.g. Vanguard 401k, Primary Home, Tesla');
    fireEvent.change(nameInput, { target: { value: 'Test Bank Account' } });
    
    const valueInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(valueInput, { target: { value: '12345' } });
    
    // Submit
    const submitBtn = screen.getByText('Save Account');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Test Bank Account')).toBeDefined();
      expect(screen.getAllByText(/12,345/).length).toBeGreaterThan(0);
    });
  });

  it('can delete an item', async () => {
    render(<App />);
    
    // Add item first
    fireEvent.click(screen.getAllByText('Add Item')[0]);
    fireEvent.change(screen.getByPlaceholderText('e.g. Vanguard 401k, Primary Home, Tesla'), { target: { value: 'Item To Delete' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '9999' } });
    fireEvent.click(screen.getByText('Save Account'));
    
    await waitFor(() => {
      expect(screen.getByText('Item To Delete')).toBeDefined();
    });

    const itemSpan = screen.getByText('Item To Delete');
    const row = itemSpan.closest('.group') || itemSpan.closest('tr') || itemSpan.parentElement?.parentElement;
    const delBtn = row?.querySelector('button[title*="Delete"]') as HTMLButtonElement | null;
    if (delBtn) {
      fireEvent.click(delBtn);
    }
    
    await waitFor(() => {
      expect(screen.queryByText('Item To Delete')).toBeNull();
    });
  });

  it('can open manage files', async () => {
    render(<App />);
    const switchBtn = screen.getByTitle('Manage & Remove Portfolio Files');
    fireEvent.click(switchBtn);
    expect(screen.getByText('Manage Portfolio Files')).toBeDefined();
  });

  it('can open auth modal', async () => {
    render(<App />);
    const authBtn = screen.getByTitle('Account & Cloud Storage');
    fireEvent.click(authBtn);
    expect(screen.getByText('User Account & Security')).toBeDefined();
  });

  it('can open the generate report modal', async () => {
    render(<App />);
    
    // Open settings modal first
    const settingsBtn = screen.getByTitle('App Settings');
    fireEvent.click(settingsBtn);

    // Open the report modal
    const generateReportBtns = screen.getAllByText('Net Worth Report');
    fireEvent.click(generateReportBtns[0]);
    
    expect(screen.getAllByText('Net Worth & Personal Financial Audit Report').length).toBeGreaterThan(0);
  });

  it('can click manage files from header select area', async () => {
    render(<App />);
    
    const manageBtn = screen.getByTitle('Manage & Remove Portfolio Files');
    if (manageBtn) {
      fireEvent.click(manageBtn);
      expect(screen.getByText('Manage Portfolio Files')).toBeDefined();
    }
  });

  it('can delete current portfolio', async () => {
    render(<App />);
    
    const delBtn = screen.getByTitle(/Remove file/i);
    fireEvent.click(delBtn);
    
    // Default portfolio deleted, should fallback to empty default
    await waitFor(() => {
      expect(screen.getByText('Net Worth Tracker')).toBeDefined();
    });
  });
});
