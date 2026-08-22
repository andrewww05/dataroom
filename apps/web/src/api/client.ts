import { API_PREFIX, type ApiError } from '@dataroom/shared';

// Use VITE_API_URL in production, otherwise rely on Vite's proxy by using empty string
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const PREFIXED_URL = `${BASE_URL}/${API_PREFIX}`;

export class ApiException extends Error {
  public code: string;
  public details?: Record<string, string[]>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.details = error.details;
  }
}

export async function fetchClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jwt_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    !headers.has('Content-Type') &&
    options.body &&
    typeof options.body === 'string'
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${PREFIXED_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    try {
      const errorBody = (await response.json()) as ApiError;
      throw new ApiException(errorBody);
    } catch (e) {
      if (e instanceof ApiException) throw e;
      throw new Error(`Request failed with status ${response.status}`, { cause: e });
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
