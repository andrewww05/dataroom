import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from './useAuth';
import * as client from '../api/client';

vi.mock('../api/client', () => ({
  fetchClient: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ user: null, dataRoom: null, isInitializing: true });
    vi.clearAllMocks();
  });

  it('initializes with no token', async () => {
    await useAuth.getState().initialize();
    
    expect(useAuth.getState().isInitializing).toBe(false);
    expect(useAuth.getState().user).toBeNull();
    expect(client.fetchClient).not.toHaveBeenCalled();
  });

  it('initializes and fetches user with token', async () => {
    localStorage.setItem('jwt_token', 'fake-token');
    
    const mockData = {
      id: 'u-1',
      email: 'test@example.com',
      dataRoom: { id: 'd-1', name: 'My Room', rootId: 'n-1' }
    };
    
    vi.mocked(client.fetchClient).mockResolvedValueOnce(mockData);

    await useAuth.getState().initialize();

    expect(client.fetchClient).toHaveBeenCalledWith('/auth/me');
    expect(useAuth.getState().isInitializing).toBe(false);
    expect(useAuth.getState().user?.email).toBe('test@example.com');
    expect(useAuth.getState().dataRoom?.name).toBe('My Room');
  });

  it('clears session on fetch error', async () => {
    localStorage.setItem('jwt_token', 'bad-token');
    vi.mocked(client.fetchClient).mockRejectedValueOnce(new Error('Unauthorized'));

    await useAuth.getState().initialize();

    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(useAuth.getState().user).toBeNull();
    expect(useAuth.getState().isInitializing).toBe(false);
  });

  it('sets session and stores token', () => {
    const user = { id: 'u-1', email: 'test@example.com' };
    const room = { id: 'd-1', name: 'My Room', rootId: 'n-1' };
    
    useAuth.getState().setSession(user, room, 'new-token');

    expect(localStorage.getItem('jwt_token')).toBe('new-token');
    expect(useAuth.getState().user).toEqual(user);
    expect(useAuth.getState().dataRoom).toEqual(room);
  });

  it('clears session', () => {
    localStorage.setItem('jwt_token', 'existing');
    useAuth.setState({ user: { id: '1', email: 'e' }, dataRoom: { id: '1', name: 'n', rootId: '1' } });
    
    useAuth.getState().clearSession();

    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(useAuth.getState().user).toBeNull();
    expect(useAuth.getState().dataRoom).toBeNull();
  });
});
