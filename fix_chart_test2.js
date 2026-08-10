import fs from 'fs';
const testCode = fs.readFileSync('src/__tests__/NetWorthChart.test.tsx', 'utf8');
const fixed = testCode.replace("screen.getByText('Total Assets')", "screen.getByText('Historical Net Worth')");
fs.writeFileSync('src/__tests__/NetWorthChart.test.tsx', fixed);
