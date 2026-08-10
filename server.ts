import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Proxy endpoint to fetch Google Sheets CSV directly (bypassing browser CORS)
  app.get('/api/fetch-google-sheet', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: 'URL query parameter is required' });
      }

      // Ensure it's a valid http or https URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'Invalid URL scheme' });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NetWorthTracker/1.0',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch Google Sheet: ${response.statusText}`,
        });
      }

      const csvData = await response.text();
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvData);
    } catch (err: any) {
      console.error('Error fetching Google Sheet:', err);
      res.status(500).json({ error: err?.message || 'Server error fetching sheet' });
    }
  });

  // Real-Time Exchange Rate API Proxy
  let serverFxCache: { base: string; rates: Record<string, number>; timestamp: number } | null = null;

  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const base = ((req.query.base as string) || 'USD').toUpperCase();
      const now = Date.now();

      if (serverFxCache && serverFxCache.base === base && now - serverFxCache.timestamp < 600000) {
        return res.json({
          base: serverFxCache.base,
          rates: serverFxCache.rates,
          cached: true,
          timestamp: serverFxCache.timestamp,
        });
      }

      const fxResponse = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
      if (fxResponse.ok) {
        const data = await fxResponse.json();
        if (data && data.rates) {
          serverFxCache = {
            base: data.base_code || base,
            rates: data.rates,
            timestamp: now,
          };
          return res.json({
            base: data.base_code || base,
            rates: data.rates,
            cached: false,
            timestamp: now,
          });
        }
      }

      // Fallback rates relative to USD
      res.json({
        base,
        rates: {
          USD: 1.0,
          EUR: 0.922,
          GBP: 0.781,
          CAD: 1.365,
          AUD: 1.522,
          JPY: 154.8,
          CHF: 0.895,
          INR: 83.5,
          SGD: 1.348,
          MXN: 18.25,
          BRL: 5.42,
          CNY: 7.26,
          HKD: 7.81,
          NZD: 1.64,
          SEK: 10.45,
        },
        cached: false,
        fallback: true,
        timestamp: now,
      });
    } catch (err: any) {
      console.error('Exchange rate proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
  });

  // AI-Powered Spreadsheet Mapper using Gemini API
  let serverApiKeyUsageTimestamps: number[] = [];

  app.post('/api/parse-spreadsheet', async (req, res) => {
    try {
      const { rawText, headers, sampleRows, apiKey: userApiKey } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'Gemini API key is required. Please provide it in settings.',
        });
      }

      // Enforce signed-in account requirement and rate limit if using shared server API key
      if (!userApiKey) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : req.body.idToken;

        let isAuthenticatedUser = false;

        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              const nowSec = Math.floor(Date.now() / 1000);
              
              // Verify token is not expired and user is not an anonymous guest
              const isNotExpired = payload.exp && payload.exp > nowSec;
              const provider = payload.firebase?.sign_in_provider;
              const isAnon = provider === 'anonymous' || req.body.isAnonymous === true;

              if (isNotExpired && provider && !isAnon) {
                isAuthenticatedUser = true;
              }
            }
          } catch (err) {
            console.error('Error verifying auth token:', err);
          }
        }

        if (!isAuthenticatedUser) {
          return res.status(401).json({
            error: 'Account sign-in required to use default Gemini AI features. Please sign in with Google or Email, or provide your custom Gemini API key in Settings.',
          });
        }

        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();
        serverApiKeyUsageTimestamps = serverApiKeyUsageTimestamps.filter((t) => now - t < ONE_HOUR);

        if (serverApiKeyUsageTimestamps.length >= 10) {
          const oldest = serverApiKeyUsageTimestamps[0];
          const waitMinutes = Math.max(1, Math.ceil((oldest + ONE_HOUR - now) / 60000));
          return res.status(429).json({
            error: `Shared server AI rate limit reached (10 documents per hour). Please wait ${waitMinutes} minute(s) or add your custom Gemini API key in Settings for unlimited extractions.`,
          });
        }

        serverApiKeyUsageTimestamps.push(now);
      }

      if (!rawText && (!headers || !sampleRows)) {
        return res.status(400).json({ error: 'Please provide rawText or headers and sampleRows' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert financial analyst AI. You are given table data or text extracted from a financial spreadsheet, Google Sheet, or bank statement.
Analyze this raw data and extract all financial asset and liability items into a structured JSON array of items.

Input Data:
${rawText ? rawText.slice(0, 8000) : JSON.stringify({ headers, sampleRows }).slice(0, 8000)}

Instructions:
1. Identify each account / holding / debt as an item.
2. Exclude summary and total/subtotal rows.
3. Determine if each item is an "asset", "liability", or "insurance":
   - Assets: Stocks, ETFs, Real Estate, Bank Accounts, 401k, IRAs, Crypto, Cash, Vehicles, Investments, Business holdings, Precious metals.
   - Liabilities: Mortgages, Credit Cards, Student Loans, Auto Loans, Personal Loans, Debt.
   - Insurance: Term Life, Whole Life, Universal Life, Disability, Health & Long-Term Care, Property & Umbrella insurance policy death benefits and coverage.
4. Assign the item to one of these EXACT categories:
   Asset categories: "Cash & Equivalents", "Stocks & ETFs", "Real Estate", "Retirement (401k/IRA)", "Crypto", "Bonds & Fixed Income", "Alternative & Private", "Vehicle & Physical"
   Liability categories: "Mortgage", "Credit Cards", "Student Loans", "Auto Loans", "Personal Loans", "Other Liabilities"
   Insurance categories: "Term Life Insurance", "Whole Life Insurance", "Universal Life Insurance", "Disability Insurance", "Health & Long-Term Care", "Property & Umbrella"
5. Clean and normalize the numerical value (must be positive number for both assets and liabilities).
6. Extract the Institution name (e.g. Vanguard, Fidelity, Schwab, Chase) if mentioned or inferrable.
7. Flag liquid assets as isLiquid: true/false.
8. Detect item currency code if specified (e.g. EUR, GBP, CAD, AUD, JPY, USD, CHF, INR, BRL, MXN).
9. Extract any statement date or "as of" date mentioned in the document/table or per item as "date" in YYYY-MM-DD or YYYY-MM format if available.

Respond STRICTLY with valid JSON in this exact structure without markdown formatting or code blocks:
{
  "currencyDetected": "USD",
  "date": "2024-03-31",
  "summaryNote": "Brief 1-sentence analysis of parsed data",
  "items": [
    {
      "name": "Vanguard Total Stock ETF",
      "type": "asset",
      "category": "Stocks & ETFs",
      "value": 150000,
      "currency": "USD",
      "institution": "Vanguard",
      "isLiquid": true,
      "date": "2024-03-31"
    }
  ]
}`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let response = null;
      let lastErr = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });
          if (response && response.text) break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!response || !response.text) {
        throw lastErr || new Error('No available Gemini model responded.');
      }

      const jsonText = response.text || '{}';
      const parsedJSON = JSON.parse(jsonText);

      res.json(parsedJSON);
    } catch (err: any) {
      console.error('Gemini API parse error:', err);
      res.status(500).json({ error: err?.message || 'Failed to process spreadsheet with AI' });
    }
  });

  // Serve Vite in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
