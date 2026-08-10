const fs = require('fs');
let t1 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t1 = t1.replace("fireEvent.click(screen.getByText('Map Columns & Import'));", "fireEvent.click(screen.getByText('Parse Table Content'));");
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t1);

let t2 = fs.readFileSync('src/__tests__/excelParser.test.ts', 'utf8');
t2 = t2.replace("expect(mapping.typeCol).toBe('');", "expect(mapping.typeCol).toBe('asset class');");
fs.writeFileSync('src/__tests__/excelParser.test.ts', t2);
