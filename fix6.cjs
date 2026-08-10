const fs = require('fs');
let t2 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
t2 = t2.replace("suggestedMapping: { nameCol: 'Name', valueCol: 'Value' }", "suggestedMapping: { nameCol: '', valueCol: '' }");
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', t2);
