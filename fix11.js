import fs from 'fs';
let t = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t = t.replace(
  "expect(handleClose).toHaveBeenCalled();",
  "expect(handleImportItems).toHaveBeenCalled();"
);
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t);
