import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function executeOpenAICompatible({
  apiKey,
  provider,
  baseUrl,
  model,
  prompt,
}: {
  apiKey: string;
  provider?: string;
  baseUrl?: string;
  model?: string;
  prompt: string;
}) {
  let targetUrl = baseUrl ? baseUrl.trim().replace(/\/+$/, '') : '';

  if (!targetUrl) {
    if (provider === 'deepseek') {
      targetUrl = 'https://api.deepseek.com/v1';
    } else if (provider === 'groq') {
      targetUrl = 'https://api.groq.com/openai/v1';
    } else if (provider === 'ollama') {
      targetUrl = 'http://localhost:11434/v1';
    } else {
      targetUrl = 'https://api.openai.com/v1';
    }
  }

  if (!targetUrl.endsWith('/chat/completions')) {
    targetUrl = targetUrl + '/chat/completions';
  }

  let defaultModel = 'gpt-4o-mini';
  if (provider === 'deepseek') defaultModel = 'deepseek-chat';
  else if (provider === 'groq') defaultModel = 'llama-3.3-70b-versatile';
  else if (provider === 'ollama') defaultModel = 'llama3';

  const targetModel = (model && model.trim()) || defaultModel;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: 'You are a helpful financial AI assistant. Respond strictly in valid raw JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI Provider API request failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('No response returned from AI provider.');
  }

  const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      const { rawText, headers, sampleRows, apiKey: userApiKey, provider: reqProvider, baseUrl: reqBaseUrl, model: reqModel } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      
      if (!apiKey && reqProvider !== 'ollama') {
        return res.status(401).json({
          error: 'AI API Key is required. Please enter your API Key in Settings to use AI features.',
        });
      }

      if (!userApiKey && reqProvider !== 'ollama') {
        if (!process.env.GEMINI_API_KEY) {
          return res.status(401).json({
            error: 'AI API Key is required. Please enter your API Key in Settings to use AI features.',
          });
        }
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

      // Check if user is using an OpenAI-compatible provider (OpenAI, DeepSeek, Groq, Ollama, Custom API, or sk- key)
      const isCustomProvider =
        reqProvider === 'openai' ||
        reqProvider === 'deepseek' ||
        reqProvider === 'groq' ||
        reqProvider === 'ollama' ||
        reqProvider === 'custom' ||
        (reqBaseUrl && reqBaseUrl.trim().length > 0) ||
        (userApiKey && userApiKey.startsWith('sk-'));

      if (isCustomProvider) {
        const parsedJSON = await executeOpenAICompatible({
          apiKey: apiKey,
          provider: reqProvider,
          baseUrl: reqBaseUrl,
          model: reqModel,
          prompt,
        });
        return res.json(parsedJSON);
      }

      // Default Gemini Provider
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const modelsToTry = reqModel ? [reqModel, 'gemini-3.6-flash', 'gemini-3.1-pro-preview'] : ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
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
      console.error('AI parse-statement error:', err);
      res.status(500).json({ error: err?.message || 'Failed to process spreadsheet with AI' });
    }
  });

  // Dedicated AI Category Suggester using Gemini or custom OpenAI-compatible API
  app.post('/api/suggest-categories', async (req, res) => {
    try {
      const { items, apiKey: userApiKey, provider: reqProvider, baseUrl: reqBaseUrl, model: reqModel } = req.body;
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;

      if (!apiKey && reqProvider !== 'ollama') {
        return res.status(401).json({
          error: 'AI API Key is required. Please enter your API Key in Settings to use AI features.',
        });
      }

      if (!userApiKey && reqProvider !== 'ollama') {
        if (!process.env.GEMINI_API_KEY) {
          return res.status(401).json({
            error: 'AI API Key is required. Please enter your API Key in Settings to use AI features.',
          });
        }
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Please provide an array of items to categorize.' });
      }

      // Enforce auth requirement and rate limiting for shared server API key
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
              const isNotExpired = payload.exp && payload.exp > nowSec;
              const provider = payload.firebase?.sign_in_provider;
              const isAnon = provider === 'anonymous' || req.body.isAnonymous === true;

              if (isNotExpired && provider && !isAnon) {
                isAuthenticatedUser = true;
              }
            }
          } catch (err) {
            console.error('Error verifying auth token for suggest-categories:', err);
          }
        }

        if (!isAuthenticatedUser) {
          return res.status(401).json({
            error: 'Account sign-in required to use default Gemini AI features. Please sign in or provide your custom AI API key in Settings.',
          });
        }
      }

      const prompt = `You are a financial classification AI. You are given a list of account/holding/debt names.
Analyze each item name and determine its exact classification:

Available Asset Categories:
- "Cash & Equivalents" (checking, savings, bank accounts, HYSA, money market, cash, PayPal, Venmo, Revolut)
- "Stocks & ETFs" (brokerage accounts, index funds, equities, stock portfolios, Vanguard, Schwab, Fidelity)
- "Real Estate" (primary residence, rental property, house, condo, land, commercial real estate)
- "Retirement (401k/IRA)" (401k, 403b, Roth IRA, Traditional IRA, pension, TSP, superannuation)
- "Crypto" (Bitcoin, Ethereum, crypto wallets, Coinbase, Binance, digital assets)
- "Precious Metals" (gold bullion, silver coins, physical metals, platinum)
- "Bonds & Fixed Income" (treasury bonds, t-bills, municipal bonds, corporate bonds, CDs)
- "Alternative & Private" (startup equity, private equity, venture capital, hedge fund, angel investments)
- "Vehicle & Physical" (automobiles, cars, Tesla, boats, luxury watches, jewelry, physical collectibles)

Available Liability Categories:
- "Mortgage" (home loan, housing mortgage, property loan)
- "Credit Cards" (Visa, Mastercard, Amex, credit card balances, Chase Freedom, Sapphire)
- "Student Loans" (Nelnet, Aidvantage, Navient, MOHELA, university tuition debt)
- "Auto Loans" (car loan, vehicle financing, Honda Financial, Ford Credit)
- "Personal Loans" (SoFi loan, personal line of credit, debt consolidation loan, HELOC)
- "Other Liabilities" (tax debt, medical bills, loans payable)

Available Insurance Categories:
- "Term Life Insurance" (term life policy coverage/death benefit)
- "Whole Life Insurance" (whole life cash value / death benefit)
- "Universal Life Insurance" (universal life insurance)
- "Disability Insurance" (short-term / long-term disability)
- "Health & Long-Term Care" (health insurance, long-term care policy)
- "Property & Umbrella" (homeowners policy, umbrella insurance)

Input Items:
${JSON.stringify(items.slice(0, 100), null, 2)}

Return a JSON object containing a "suggestions" array with one object per input item:
{
  "suggestions": [
    {
      "index": 0,
      "name": "Item Name",
      "suggestedType": "asset" | "liability" | "insurance",
      "suggestedCategory": "Exact Category Name from above lists",
      "confidence": "high" | "medium" | "low",
      "reasoning": "Short 1-sentence concise explanation of why this category fits this account name"
    }
  ]
}`;

      // Check if user specified a custom AI provider (OpenAI, DeepSeek, Groq, Ollama, etc.)
      const isCustomProvider =
        reqProvider === 'openai' ||
        reqProvider === 'deepseek' ||
        reqProvider === 'groq' ||
        reqProvider === 'ollama' ||
        reqProvider === 'custom' ||
        (reqBaseUrl && reqBaseUrl.trim().length > 0) ||
        (userApiKey && userApiKey.startsWith('sk-'));

      if (isCustomProvider) {
        const parsedJSON = await executeOpenAICompatible({
          apiKey: apiKey,
          provider: reqProvider,
          baseUrl: reqBaseUrl,
          model: reqModel,
          prompt,
        });
        return res.json(parsedJSON);
      }

      // Gemini API
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const modelsToTry = reqModel ? [reqModel, 'gemini-3.6-flash', 'gemini-3.1-pro-preview'] : ['gemini-3.6-flash', 'gemini-3.1-pro-preview'];
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
      console.error('AI suggest-categories error:', err);
      res.status(500).json({ error: err?.message || 'Failed to suggest categories with AI' });
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
