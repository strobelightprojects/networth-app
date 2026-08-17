import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestCategoriesWithGemini } from '../utils/geminiCategoryService';

describe('geminiCategoryService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty array when items array is empty', async () => {
    const res = await suggestCategoriesWithGemini([]);
    expect(res).toEqual([]);
  });

  it('uses API suggestions when endpoint responds successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            index: 0,
            name: 'Vanguard 500 Index Fund',
            suggestedType: 'asset',
            suggestedCategory: 'Stocks & ETFs',
            confidence: 'high',
            reasoning: 'Matches equity index fund',
          },
        ],
      }),
    } as any);

    const res = await suggestCategoriesWithGemini([{ name: 'Vanguard 500 Index Fund' }]);
    expect(res).toHaveLength(1);
    expect(res[0].suggestedCategory).toBe('Stocks & ETFs');
    expect(res[0].confidence).toBe('high');
  });

  it('falls back to local heuristic matching if API fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const res = await suggestCategoriesWithGemini([{ name: 'Chase Checking Account' }]);
    expect(res).toHaveLength(1);
    expect(res[0].suggestedType).toBe('asset');
    expect(res[0].suggestedCategory).toBe('Cash & Equivalents');
    expect(res[0].reasoning).toContain('Rule matched');
  });
});
