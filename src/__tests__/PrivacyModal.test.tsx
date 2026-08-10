import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyModal } from '../components/modals/PrivacyModal';

describe('PrivacyModal', () => {
  it('renders PrivacyModal correctly', () => {
    render(
      <PrivacyModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Privacy Policy & Terms of Service')).toBeDefined();
    expect(screen.getByText('1. What Data We Collect & Store')).toBeDefined();
  });
});
