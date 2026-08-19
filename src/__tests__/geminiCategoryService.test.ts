import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suggestCategoriesWithGemini } from '../utils/geminiCategoryService';

// Mock firebase auth
vi.mock('../lib/firebase', () => {
  return {
    auth: {
      currentUser: null,
    },
  };
});

import { auth } from '../lib/firebase';

describe('geminiCategoryService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (auth as any).currentUser = null;
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

  it('uses Firebase ID token if user is authenticated', async () => {
    (auth as any).currentUser = {
      isAnonymous: false,
      getIdToken: vi.fn().mockResolvedValue('fake-firebase-token'),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    } as any);

    await suggestCategoriesWithGemini([{ name: 'Test Account' }]);
    
    expect(auth.currentUser?.getIdToken).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/suggest-categories',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-firebase-token',
        }),
      })
    );
  });

  it('handles auth token fetch failure gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (auth as any).currentUser = {
      isAnonymous: false,
      getIdToken: vi.fn().mockRejectedValue(new Error('Token fetch failed')),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    } as any);

    await suggestCategoriesWithGemini([{ name: 'Test Account' }]);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('Could not retrieve Firebase ID token for AI request:', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  it('handles non-ok response and parses error correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request' }),
    } as any);

    const res = await suggestCategoriesWithGemini([{ name: 'Test Account' }]);
    expect(res).toHaveLength(1);
    // Should fallback
    expect(res[0].suggestedCategory).toBe('Stocks & ETFs');
  });

  it('handles non-ok response with invalid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); },
    } as any);

    const res = await suggestCategoriesWithGemini([{ name: 'Test Account' }]);
    expect(res).toHaveLength(1);
  });

  it('falls back to default category if heuristics do not match', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const res = await suggestCategoriesWithGemini([{ name: 'Unknown XYZ 123', type: 'liability' }]);
    
    expect(res).toHaveLength(1);
    expect(res[0].suggestedType).toBe('liability');
    expect(res[0].suggestedCategory).toBe('Stocks & ETFs');
    expect(res[0].confidence).toBe('low');
    expect(res[0].reasoning).toBe('Default fallback category');
  });
});
