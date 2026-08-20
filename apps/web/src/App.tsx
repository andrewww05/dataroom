import { formatBytes, type DocumentSummary } from '@dataroom/shared';
import { useEffect, useState } from 'react';

import { fetchDocuments } from './api/client';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; documents: DocumentSummary[] };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchDocuments()
      .then(({ items }) => {
        if (!cancelled) setState({ status: 'ready', documents: items });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Dataroom</h1>
        <p>Vite + NestJS on Turborepo, sharing one set of types.</p>
      </header>

      {state.status === 'loading' && <p className="app__note">Loading documents…</p>}

      {state.status === 'error' && (
        <p className="app__note app__note--error">
          {state.message} — is the API running on port 3000?
        </p>
      )}

      {state.status === 'ready' && (
        <table className="documents">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Size</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {state.documents.map((document) => (
              <tr key={document.id}>
                <td>{document.name}</td>
                <td>
                  <span className={`badge badge--${document.status}`}>
                    {document.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{formatBytes(document.sizeBytes)}</td>
                <td>{new Date(document.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
