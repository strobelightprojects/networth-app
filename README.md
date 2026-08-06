# Net Worth Tracker

A modern full-stack web application designed to help users track, analyze, and forecast their net worth over time. Easily import financial data from Google Sheets, Excel spreadsheets, or CSV statements, map columns intelligently using Gemini AI, and interact with real-time dashboards and scenario modeling tools.

## Features

- **Multi-Format Financial Data Import**: Upload CSVs, Excel files (`.xlsx`), or paste data from Google Sheets.
- **Smart AI Column Mapping**: Uses Gemini AI (`@google/genai`) to parse, standardize, and map disparate financial headers and formats automatically.
- **Interactive Visualizations**: High-contrast interactive net worth trajectory charts, asset allocation breakdowns, and liability distributions powered by Recharts.
- **Cloud Persistence**: Sync assets, liabilities, and snapshot histories seamlessly with Firebase Firestore.
- **Scenario Modeling & Forecasting**: Simulate compound interest rates, dynamic contribution scenarios, and debt payoff timelines.
- **Automated CI/CD**: Configured for continuous integration and automated GitHub Pages deployment via GitHub Actions.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion
- **Charts & Visuals**: Recharts
- **Backend / Server**: Express.js, TypeScript (`tsx`)
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Database & Auth**: Firebase Firestore
- **Testing**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/strobelightprojects/networth-app.git
   cd networth-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Gemini API key and Firebase configurations.
   ```bash
   cp .env.example .env
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the local development server with Express and Vite middleware.
- `npm run build`: Builds the production bundle using Vite and esbuild.
- `npm start`: Starts the production CommonJS server (`node dist/server.cjs`).
- `npm run lint`: Runs TypeScript type checking (`tsc --noEmit`).
- `npm run test`: Executes unit and integration test suites with Vitest.

## Security & Public Repository Safety

This project is structured specifically to be safe for open-source publication on public GitHub repositories:

1. **Server-Side API Key Protection**:
   - Private secrets like `GEMINI_API_KEY` are kept strictly on the Express backend (`/api/parse-spreadsheet`). They are never exposed in client bundles or HTML markup.
   - `.gitignore` ensures that local `.env` files containing actual secrets are excluded from git commits.

2. **Public Web Identifiers & Security Rules**:
   - Firebase config properties (`apiKey`, `projectId`, `appId`) are standard client-side identifiers required by single-page web applications.
   - Database protection is strictly enforced by **Firestore Security Rules** (`firestore.rules`). Users can only read, update, or delete data within their own authenticated account path (`request.auth.uid == userId`). No user can access or tamper with another user's financial portfolio data.

3. **Environment Variable Overrides**:
   - Anyone cloning this repository can easily connect their own Firebase project or Gemini API key by populating `.env` (using `.env.example` as a template).

## License

MIT
