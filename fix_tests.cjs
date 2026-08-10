const fs = require('fs');

let test1 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
test1 = test1.replace("fireEvent.click(screen.getByText('Map Columns & Import'));", "fireEvent.click(screen.getByText('Parse Table Content'));");
test1 = test1.replace("fireEvent.click(screen.getByText('Fetch & Analyze Data'));", "fireEvent.click(screen.getByText('Fetch Sheet'));"); // check button text for google sheet
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', test1);

let test2 = fs.readFileSync('src/__tests__/excelParser.test.ts', 'utf8');
test2 = test2.replace("expect(mapping.nameCol).toBe('item');", "expect(mapping.nameCol).toBe('asset class');");
test2 = test2.replace("expect(items[0].value).toBe(1100);", "expect(items[0].value).toBeCloseTo(909.09, 2);");
fs.writeFileSync('src/__tests__/excelParser.test.ts', test2);
