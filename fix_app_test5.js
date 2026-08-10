import fs from 'fs';
let t = fs.readFileSync('src/__tests__/App.test.tsx', 'utf8');
t = t.replace(
  "fireEvent.click(screen.getByTitle('Settings'));",
  "fireEvent.click(screen.getByTitle('App Settings'));"
);
fs.writeFileSync('src/__tests__/App.test.tsx', t);
