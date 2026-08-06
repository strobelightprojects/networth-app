import { PortfolioData } from '../types';

export const DEFAULT_PORTFOLIO: PortfolioData = {
  id: 'main-portfolio',
  name: 'My Net Worth Portfolio',
  currency: 'USD',
  items: [],
  history: [
    {
      date: new Date().toISOString().slice(0, 7),
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
    },
  ],
};

export const SAMPLE_PORTFOLIOS: PortfolioData[] = [DEFAULT_PORTFOLIO];

