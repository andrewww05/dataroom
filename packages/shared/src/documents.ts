/** Lifecycle states a document moves through inside a data room. */
export const DOCUMENT_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** The shape both the API and the web client agree on for a listed document. */
export interface DocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return typeof value === 'string' && (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

/** Human-readable file size, shared so the API and UI never disagree on rounding. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
