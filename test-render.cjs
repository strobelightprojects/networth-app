const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  console.log('HTML length:', content.length);
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log('Root HTML length:', rootHtml.length);
  if (rootHtml.length < 100) {
    console.log('Root HTML:', rootHtml);
  }
  
  await browser.close();
})();
