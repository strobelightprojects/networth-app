import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrivacyModal } from '../components/modals/PrivacyModal';

describe('PrivacyModal', () => {
  it('renders PrivacyModal correctly when open', () => {
    render(
      <PrivacyModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Privacy Policy & Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('1. What Data We Collect & Store')).toBeInTheDocument();
    expect(screen.getByText('2. Data Security & Encryption Standards')).toBeInTheDocument();
    expect(screen.getByText('3. Data Compression & 1-Year Inactivity Cleanup Policy')).toBeInTheDocument();
    expect(screen.getByText('4. Financial & Legal Disclaimer')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PrivacyModal
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText('Privacy Policy & Terms of Service')).toBeNull();
  });

  it('triggers onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <PrivacyModal
        isOpen={true}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByText('Close Privacy & Terms');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('allows navigating to Manage Data & Account Purge via AuthModal callback', () => {
    const onClose = vi.fn();
    const onOpenAuthModal = vi.fn();

    render(
      <PrivacyModal
        isOpen={true}
        onClose={onClose}
        onOpenAuthModal={onOpenAuthModal}
      />
    );

    const purgeBtn = screen.getByText('Manage Data & Account Purge');
    fireEvent.click(purgeBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onOpenAuthModal).toHaveBeenCalled();
  });
});

