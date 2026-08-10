import fs from 'fs';
let code = fs.readFileSync('src/utils/currency.ts', 'utf8');
code = code.replace(
  "const res = await fetch(`/api/exchange-rates?base=${encodeURIComponent(base)}`);",
  `
    let fetchUrl = \`/api/exchange-rates?base=\${encodeURIComponent(base)}\`;
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
      fetchUrl = window.location.origin + fetchUrl;
    } else if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      fetchUrl = 'http://localhost' + fetchUrl;
    }
    const res = await fetch(fetchUrl);
  `
);
fs.writeFileSync('src/utils/currency.ts', code);
