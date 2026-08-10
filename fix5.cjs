const fs = require('fs');

let t1 = fs.readFileSync('src/__tests__/AuthModal.test.tsx', 'utf8');
t1 = t1.replace(/getByPlaceholderText\('Email address'\)/g, "getByPlaceholderText('you@example.com')");
t1 = t1.replace(/getByPlaceholderText\('Password'\)/g, "getByPlaceholderText('••••••••')");
fs.writeFileSync('src/__tests__/AuthModal.test.tsx', t1);
