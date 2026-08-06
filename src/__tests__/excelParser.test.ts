import { describe, it, expect } from 'vitest';
import { parseGoogleSheetUrl } from '../utils/excelParser';

describe('excelParser', () => {
  describe('parseGoogleSheetUrl', () => {
    it('returns null for empty url', () => {
      expect(parseGoogleSheetUrl('')).toBeNull();
    });

    it('extracts published csv urls', () => {
      const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ/pub?output=csv';
      const result = parseGoogleSheetUrl(url);
      expect(result).not.toBeNull();
      expect(result?.spreadsheetId).toBe('published');
      expect(result?.csvUrl).toBe(url);
    });

    it('extracts standard google sheet urls', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0X/edit#gid=0';
      const result = parseGoogleSheetUrl(url);
      expect(result).not.toBeNull();
      expect(result?.spreadsheetId).toBe('1BxiMVs0X');
      expect(result?.csvUrl).toBe('https://docs.google.com/spreadsheets/d/1BxiMVs0X/export?format=csv&gid=0');
    });

    it('extracts standard google sheet urls with specific gid', () => {
      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0X/edit#gid=123456';
      const result = parseGoogleSheetUrl(url);
      expect(result).not.toBeNull();
      expect(result?.spreadsheetId).toBe('1BxiMVs0X');
      expect(result?.csvUrl).toBe('https://docs.google.com/spreadsheets/d/1BxiMVs0X/export?format=csv&gid=123456');
    });
  });
});
