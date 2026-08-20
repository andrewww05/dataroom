import type { DocumentSummary, ListResponse } from '@dataroom/shared';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import App from './App';

const payload: ListResponse<DocumentSummary> = {
  items: [
    {
      id: 'doc_1',
      name: 'Term Sheet.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 284_512,
      status: 'published',
      updatedAt: '2026-08-14T09:12:00.000Z',
    },
  ],
  total: 1,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it('renders documents returned by the API', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload }),
  );

  render(<App />);

  expect(await screen.findByText('Term Sheet.pdf')).toBeInTheDocument();
  // Size comes from the shared formatBytes helper, not a local copy.
  expect(screen.getByText('277.8 KB')).toBeInTheDocument();
});

it('surfaces API failures', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

  render(<App />);

  expect(await screen.findByText(/failed with 500/)).toBeInTheDocument();
});
