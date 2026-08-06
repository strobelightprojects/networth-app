import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImportModal } from '../components';
import '@testing-library/jest-dom';

describe('ImportModal', () => {
  it('renders correctly when open', () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    expect(screen.getByText('Import Financial Data')).toBeInTheDocument();
    expect(screen.getByText('Excel / CSV File')).toBeInTheDocument();
    expect(screen.getByText('Google Sheets Link')).toBeInTheDocument();
    expect(screen.getByText('Copy-Paste Text')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();

    const { container } = render(
      <ImportModal
        isOpen={false}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('switches tabs correctly', () => {
    const handleClose = vi.fn();
    const handleImportItems = vi.fn();
    const handleOpenColumnMapper = vi.fn();

    render(
      <ImportModal
        isOpen={true}
        onClose={handleClose}
        onImportItems={handleImportItems}
        onOpenColumnMapper={handleOpenColumnMapper}
      />
    );

    const pasteTab = screen.getByText('Copy-Paste Text');
    fireEvent.click(pasteTab);

    expect(screen.getByPlaceholderText(/Account Name/)).toBeInTheDocument();
  });
});
