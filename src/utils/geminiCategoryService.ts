import { auth } from '../lib/firebase';
import { AssetCategory, LiabilityCategory, InsuranceCategory, ItemType } from '../types';
import { suggestCategoryFromAccountName } from './aiCategorySuggester';

export interface GeminiCategorySuggestion {
  index: number;
  name: string;
  suggestedType: ItemType;
  suggestedCategory: AssetCategory | LiabilityCategory | InsuranceCategory;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

export interface ItemForSuggestion {
  name: string;
  type?: ItemType;
  category?: string;
  value?: number;
}

/**
 * Calls the server-side Gemini API endpoint to suggest high-accuracy categories based on item names.
 * Falls back gracefully to heuristic matching if offline or API key unavailable.
 */
export async function suggestCategoriesWithGemini(
  items: ItemForSuggestion[],
  customApiKey?: string
): Promise<GeminiCategorySuggestion[]> {
  if (!items || items.length === 0) {
    return [];
  }

  const provider = localStorage.getItem('aiProvider') || 'gemini';
  const apiKey = customApiKey || localStorage.getItem('aiApiKey') || localStorage.getItem('geminiApiKey') || '';
  const baseUrl = localStorage.getItem('aiBaseUrl') || '';
  const model = localStorage.getItem('aiModel') || '';
  let idToken = '';
  let isAnonymous = true;

  if (auth?.currentUser) {
    try {
      idToken = await auth.currentUser.getIdToken();
      isAnonymous = auth.currentUser.isAnonymous;
    } catch (err) {
      console.warn('Could not retrieve Firebase ID token for AI request:', err);
    }
  }

  try {
    const response = await fetch('/api/suggest-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        items: items.map((it, idx) => ({
          index: idx,
          name: it.name,
          currentType: it.type,
          currentCategory: it.category,
          value: it.value,
        })),
        apiKey,
        provider,
        baseUrl,
        model,
        idToken,
        isAnonymous,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      return data.suggestions.map((s: any, idx: number) => ({
        index: typeof s.index === 'number' ? s.index : idx,
        name: s.name || items[idx]?.name || '',
        suggestedType: (s.suggestedType === 'insurance' ? 'insurance' : s.suggestedType === 'liability' ? 'liability' : 'asset') as ItemType,
        suggestedCategory: s.suggestedCategory || 'Stocks & ETFs',
        confidence: s.confidence || 'medium',
        reasoning: s.reasoning || 'Categorized by Gemini AI',
      }));
    }
  } catch (err) {
    console.warn('Gemini API category suggestion endpoint failed, using local heuristic fallback:', err);
  }

  // Heuristic Fallback
  return items.map((it, idx) => {
    const heuristic = suggestCategoryFromAccountName(it.name);
    if (heuristic) {
      return {
        index: idx,
        name: it.name,
        suggestedType: heuristic.suggestedType,
        suggestedCategory: heuristic.suggestedCategory,
        confidence: heuristic.confidence,
        reasoning: `Rule matched: ${heuristic.matchedKeyword}`,
      };
    }
    return {
      index: idx,
      name: it.name,
      suggestedType: it.type || 'asset',
      suggestedCategory: (it.category as any) || 'Stocks & ETFs',
      confidence: 'low',
      reasoning: 'Default fallback category',
    };
  });
}
