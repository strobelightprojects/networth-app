import { describe, it, expect } from 'vitest';
import { 
  compressHistoryData, 
  isAccountInactiveOneYear, 
  calculateStorageEstimate 
} from '../lib/firebase';
import { PortfolioData } from '../types';

describe('Firebase Utility & Storage Optimization Tests', () => {
  it('correctly calculates storage footprint estimate for portfolios', () => {
    const mockPortfolios: PortfolioData[] = [
      {
        id: 'p1',
        name: 'Test Portfolio',
        currency: 'USD',
        items: [
          {
            id: 'item1',
            name: 'Brokerage Stock',
            category: 'Stocks & ETFs',
            type: 'asset',
            value: 5000,
            lastUpdated: '2026-08-01'
          }
        ],
        history: [
          { date: '2026-01-01', totalAssets: 5000, totalLiabilities: 0, netWorth: 5000 },
          { date: '2026-02-01', totalAssets: 5200, totalLiabilities: 0, netWorth: 5200 }
        ],
        milestones: []
      }
    ];

    const estimate = calculateStorageEstimate(mockPortfolios);
    expect(estimate.itemCount).toBe(1);
    expect(estimate.historyCount).toBe(2);
    expect(estimate.estimatedBytes).toBeGreaterThan(100);
  });

  it('detects account inactivity older than 1 year (365 days)', () => {
    const now = new Date();
    
    // Recent activity (e.g. 10 days ago) -> Not inactive
    const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAccountInactiveOneYear(recentDate)).toBe(false);

    // Old activity (e.g. 400 days ago) -> Inactive for > 1 year
    const oldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000).toISOString();
    expect(isAccountInactiveOneYear(oldDate)).toBe(true);

    // Empty date -> returns false
    expect(isAccountInactiveOneYear(undefined)).toBe(false);
  });

  it('compresses historical datapoints older than 180 days to reduce storage space', () => {
    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    // Generate 15 daily snapshots older than 200 days
    const mockHistory = Array.from({ length: 15 }, (_, i) => ({
      date: new Date(now.getTime() - (200 + i) * ONE_DAY_MS).toISOString(),
      totalAssets: 1000 + i * 10,
      totalLiabilities: 0,
      netWorth: 1000 + i * 10
    }));

    const compressed = compressHistoryData(mockHistory);
    // 15 daily points across ~2+ weeks should compress into ~3 weekly bucket points
    expect(compressed.length).toBeLessThan(mockHistory.length);
  });
});
