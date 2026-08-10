const fs = require('fs');
let t2 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t2 = t2.replace("parseCSVText: vi.fn().mockReturnValue({\n    fileName: 'pasted.csv',\n    rows: [{ Name: 'Cash', Value: '1000' }],\n    headers: ['Name', 'Value'],\n    suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }", 
"parseCSVText: vi.fn().mockReturnValue({\n    fileName: 'pasted.csv',\n    rows: [{ Name: 'Cash', Value: '1000' }],\n    headers: ['Name', 'Value'],\n    suggestedMapping: { nameCol: '', valueCol: '' }");
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t2);
