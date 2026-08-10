const fs = require('fs');
let test1 = fs.readFileSync('src/__tests__/ImportModal.test.tsx', 'utf8');
test1 = test1.replace("fireEvent.click(screen.getByText('Fetch Sheet'));", "fireEvent.click(screen.getByText('Fetch & Parse Google Sheet'));");
fs.writeFileSync('src/__tests__/ImportModal.test.tsx', test1);
