import fs from 'fs';
let t = `import { vi, describe, it, expect } from 'vitest';
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
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
  };
});

describe('App', () => {
  it('renders without crashing and can interact with modals', async () => {
    render(<App />);
    expect(screen.getAllByText('Net Worth').length).toBeGreaterThan(0);
    
    // Open Add Item Modal
    fireEvent.click(screen.getByText('Add Asset/Liability'));
    expect(screen.getByText('Add Item to Portfolio')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    
    // Open Settings
    fireEvent.click(screen.getByTitle('Settings'));
    expect(screen.getByText('Application Settings')).toBeInTheDocument();
    // close
    fireEvent.click(screen.getAllByRole('button', { name: '' }).find(b => b.querySelector('svg.lucide-x')));
  });
});
`;
fs.writeFileSync('src/__tests__/App.test.tsx', t);
