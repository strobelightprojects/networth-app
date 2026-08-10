import fs from 'fs';
let t = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t = t.replace(/parseCSVText: vi\.fn\(\)\.mockReturnValue\(\{[\s\S]*?\}\),/, 
`parseCSVText: vi.fn().mockReturnValue({
    fileName: 'pasted.csv',
    sheetNames: ['CSV Data'],
    activeSheetName: 'CSV Data',
    headers: ['Name', 'Value'],
    rows: [['Cash', '1000']],
    suggestedMapping: { nameCol: '', valueCol: '' }
  }),`);
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t);
