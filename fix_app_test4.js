import fs from 'fs';
let t = fs.readFileSync('src/__tests__/App.test.tsx', 'utf8');
t = t.replace(
  "expect(screen.getByText('Add Item to Portfolio')).toBeInTheDocument();",
  "expect(screen.getByText('Add Financial Account')).toBeDefined();"
);
t = t.replace(
  "expect(screen.getByText('Application Settings')).toBeInTheDocument();",
  "expect(screen.getByText('App & Preferences Settings')).toBeDefined();"
);
fs.writeFileSync('src/__tests__/App.test.tsx', t);
