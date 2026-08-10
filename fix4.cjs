const fs = require('fs');

// Fix AuthModal.test.tsx
let t1 = fs.readFileSync('src/__tests__/AuthModal.test.tsx', 'utf8');
t1 = t1.replace("screen.getByText('Sign In with Email')", "screen.getByText('Sign In with Email')"); // verify no issues here
t1 = t1.replace(/Continue as Guest/g, "Continue as Guest (Anonymous Cloud Session)");
t1 = t1.replace(/"Don't have an account\? Sign Up"/g, "'Need an account? Register'");
t1 = t1.replace(/'Create Account'/g, "'Create Free Account'");
fs.writeFileSync('src/__tests__/AuthModal.test.tsx', t1);

// Fix ImportModal.test.tsx
let t2 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t2 = t2.replace("vi.mock('../utils/excelParser', () => ({", "vi.mock('../utils/excelParser', () => ({\n  convertRowsToItems: vi.fn(() => [{id: '1', name: 'Test', value: 100}]),");
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t2);

// Fix App.test.tsx
let t3 = fs.readFileSync('src/__tests__/App.test.tsx', 'utf8');
t3 = `import { vi } from 'vitest';
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null);
    return vi.fn();
  }),
}));
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {}
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getFirestore: vi.fn(),
  collection: vi.fn()
}));
` + t3;
fs.writeFileSync('src/__tests__/App.test.tsx', t3);

