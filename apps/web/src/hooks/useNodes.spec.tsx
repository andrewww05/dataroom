import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateFolder, useRenameNode } from './useNodes';
import { fetchClient } from '../api/client';
import { toast } from 'sonner';

vi.mock('../api/client', () => ({
  fetchClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('useNodes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useCreateFolder fires a toast when returned name differs from submitted name', async () => {
    vi.mocked(fetchClient).mockResolvedValue({
      id: 'folder-1',
      name: 'Test Folder (2)', // Different from submitted
    });

    const { result } = renderHook(() => useCreateFolder(), { wrapper });

    result.current.mutate({ parentId: 'root', name: 'Test Folder' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast).toHaveBeenCalledWith('Saved as Test Folder (2).');
  });

  it('useCreateFolder does NOT fire a toast when returned name matches', async () => {
    vi.mocked(fetchClient).mockResolvedValue({
      id: 'folder-1',
      name: 'Test Folder', // Matches submitted
    });

    const { result } = renderHook(() => useCreateFolder(), { wrapper });

    result.current.mutate({ parentId: 'root', name: 'Test Folder' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast).not.toHaveBeenCalled();
  });

  it('useRenameNode fires a toast when returned name differs', async () => {
    vi.mocked(fetchClient).mockResolvedValue({
      id: 'folder-1',
      name: 'Conflict (2)', // Different from submitted
    });

    const { result } = renderHook(() => useRenameNode(), { wrapper });

    result.current.mutate({ id: 'folder-1', parentId: 'root', name: 'Conflict' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast).toHaveBeenCalledWith('Saved as Conflict (2).');
  });
});
