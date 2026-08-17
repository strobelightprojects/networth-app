# 📄 Product Requirements & Functional Specification (FSD)

**Product Name:** Net Worth Tracker  
**Platform:** Web (Responsive Desktop & Mobile)  
**Architecture:** Offline-First Client-Side SPA (React/Vite) with a lightweight Express backend proxy for API routing.

## 1. Executive Summary
The Net Worth Tracker is a privacy-first, multi-currency financial dashboard designed to help users consolidate, categorize, and track their wealth. It operates securely in the browser (offline-capable) with no forced accounts, utilizing AI to automatically categorize imported financial statements (CSV/Excel) and offering real-time currency conversions. 

## 2. Current Features & Capabilities (The "As-Is")

### 📊 Dashboard & Visualization
*   **KPI Overview:** Real-time calculation of Net Worth, Total Assets, Total Liabilities, and Liquid Net Worth.
*   **Visual Analytics:** 
    *   Interactive Donut Charts for Asset/Liability allocation (by category).
    *   Net Worth Historical Trend Line Chart (tracking snapshots over time).
*   **Ledger & Item Management:** A searchable, sortable table of all individual accounts/holdings. Includes toggles to temporarily "exclude" an item from calculations without deleting it.

### 📥 Data Ingestion & Automation
*   **Multi-Format File Import:** Drag-and-drop parsing for `.xlsx`, `.xls`, and `.csv` bank exports.
*   **Smart Column Mapper:** A visual wizard that lets users map spreadsheet columns (e.g., "Balance", "Account Name") to the app's internal data model before importing.
*   **Raw Data Paste:** Ability to copy-paste raw text from statements directly into the app for parsing.
*   **AI Auto-Categorization:** Uses LLMs (Gemini/OpenAI) to automatically assign the correct financial category (e.g., "Brokerage", "Real Estate", "Credit Card") based on the account name. Falls back to local keyword heuristics if offline.

### 🔐 Security & Privacy (Privacy-First Approach)
*   **Offline-First & Local Storage:** All portfolio data is stored locally in the browser (`localStorage`). No forced cloud sync or login walls.
*   **Privacy Blur Mode (Eye Icon):** A one-click toggle that applies a CSS blur filter to all sensitive balances on the screen, allowing users to safely view their dashboard in public spaces (cafes, offices).
*   **PII & Account Number Redaction:** Automatically detects and masks sensitive identifiers (SSNs, IBANs, Credit Cards, long Account Numbers) imported via spreadsheets or typed into notes (e.g., `Chase Checking ****1234`).
*   **Hardened Headers:** Server enforces strict Content-Security-Policy (CSP), X-Frame-Options, and Permissions-Policy headers to prevent XSS and data exfiltration.

### 🌍 Multi-Currency & Localization
*   **Live Exchange Rates:** Automatically fetches live FX rates to convert foreign holdings into the user's selected "Base Currency" (USD, EUR, GBP, CAD, etc.).
*   **Per-Item Currency:** Users can hold a checking account in USD, a mortgage in GBP, and a brokerage in EUR in the same portfolio; the app normalizes everything into a unified net worth.

### 📂 Portfolio Management & Reporting
*   **Multiple Portfolios:** Create and switch between multiple isolated portfolios (e.g., "Personal", "Joint Household", "Business").
*   **Financial Statement Generation:** A "Report Preview" modal that generates a clean, printable (PDF-ready) financial statement summarizing assets and liabilities.
*   **Data Export:** Download the entire portfolio as a sanitized CSV for external backups.

---

## 3. Data Model & Architecture

### Core Entities
1.  **Portfolio (`PortfolioData`)**
    *   `id`: string
    *   `name`: string
    *   `currency`: Base currency code (e.g., 'USD')
    *   `items`: Array of `FinancialItem`
    *   `history`: Array of historical snapshots for the trend chart.
2.  **Financial Item (`FinancialItem`)**
    *   `id`, `name`, `type` (asset/liability/insurance), `category`.
    *   `originalValue` & `currency` (The exact amount in its native currency).
    *   `value` (The calculated value converted to the portfolio's base currency).
    *   `liquidityLevel` (High, Medium, Low, Locked).
    *   `institution`, `notes`, `lastUpdated`.

---

## 4. Potential Future Features (The "Could Be" Roadmap)

### Phase 1: Enhanced Tracking & Syncing
*   **Cloud Sync & Multi-Device Access (Opt-in):** Allow users to securely back up their encrypted local storage to Firebase to access their portfolio across their phone and laptop.
*   **Historical Snapshots via Cron:** Automatically take a "snapshot" of the net worth at the end of each month to build a robust historical chart without manual effort.
*   **Asset Depreciation / Appreciation Logic:** Allow users to set an estimated annual growth rate (e.g., 7% for index funds, -10% for vehicles) so the app projects future net worth.

### Phase 2: Live Market & Banking Data
*   **Plaid / Teller Integration:** Connect directly to bank accounts for real-time balance fetching (replaces manual CSV uploads).
*   **Stock / Crypto Ticker Integration:** Allow users to enter a ticker symbol (e.g., `AAPL`, `BTC`) and a quantity of shares, and the app fetches the live closing price via a financial API (like Yahoo Finance or Alpha Vantage).

### Phase 3: Advanced Analytics & Planning
*   **FIRE (Financial Independence, Retire Early) Calculator:** Input monthly expenses, and the app calculates your "Safe Withdrawal Rate" and estimates how many years until retirement based on current liquid assets.
*   **Tax Optimization Views:** A toggle to view "Pre-Tax" vs "Post-Tax" net worth (e.g., applying a 20% haircut to Traditional 401ks vs no haircut for Roth accounts).
*   **Goal Tracking:** Set a target net worth or debt-payoff goal with visual progress bars and confetti animations when milestones are hit.
