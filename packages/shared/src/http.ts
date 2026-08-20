/** Mounted by the API as a global prefix and proxied under the same path by Vite. */
export const API_PREFIX = 'api';

export interface HealthResponse {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
