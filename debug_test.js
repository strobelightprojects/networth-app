import fs from 'fs';
let t = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t = t.replace(
  "expect(handleOpenColumnMapper).toHaveBeenCalled();",
  "if (handleOpenColumnMapper.mock.calls.length === 0) { console.log(screen.debug()); } expect(handleOpenColumnMapper).toHaveBeenCalled();"
);
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t);
