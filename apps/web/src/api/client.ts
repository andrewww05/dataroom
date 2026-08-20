import {
  API_PREFIX,
  type DocumentSummary,
  type HealthResponse,
  type ListResponse,
} from '@dataroom/shared';

const BASE_URL = `/${API_PREFIX}`;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>('/health');
}

export function fetchDocuments(): Promise<ListResponse<DocumentSummary>> {
  return getJson<ListResponse<DocumentSummary>>('/documents');
}
