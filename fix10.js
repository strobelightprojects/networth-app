import fs from 'fs';
let t = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t = t.replace(
  "expect(handleOpenColumnMapper).toHaveBeenCalled();",
  "expect(handleClose).toHaveBeenCalled();"
);
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t);
