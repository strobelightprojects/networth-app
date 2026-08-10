import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GoogleSheetsGuideModal } from '../components/modals/GoogleSheetsGuideModal';

describe('GoogleSheetsGuideModal', () => {
  it('renders GoogleSheetsGuideModal correctly', () => {
    render(
      <GoogleSheetsGuideModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Google Sheets Integration Guide')).toBeDefined();
  });
});
