import fs from 'fs';
let t = fs.readFileSync('src/__tests__/App.test.tsx', 'utf8');
t = t.replace(
  "fireEvent.click(screen.getByText('Add Item'));",
  "fireEvent.click(screen.getAllByText('Add Item')[0]);"
);
fs.writeFileSync('src/__tests__/App.test.tsx', t);
