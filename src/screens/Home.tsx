import { useState } from 'react';
import type { Entry } from '../types';
import { loadIndexSync, loadEntrySync, deleteEntry } from '../lib/storage';

function loadEntries(): Entry[] {
  return loadIndexSync()
    .map(loadEntrySync)
    .filter((e): e is Entry => e !== null);
}

interface HomeProps {
  onNew: () => void;
  onRecover: (label: string) => void;
}

export default function Home({ onNew, onRecover }: HomeProps) {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);

  async function handleDelete(label: string) {
    if (!window.confirm(`Delete "${label}"? This can't be undone, and there is no recovery once it's gone.`)) return;
    await deleteEntry(label);
    setEntries(loadEntries());
  }

  return (
    <div className="card">
      <h2>Your codes</h2>
      <p className="subtext">
        Each one was generated so you never saw it whole and never had to remember it.
        Nothing here shows you the code itself — only whether a recovery attempt matches.
      </p>

      {entries.length === 0 ? (
        <div className="empty-state">No codes saved yet. Make your first one below.</div>
      ) : (
        entries.map(e => (
          <div className="saved-item" key={e.label}>
            <div>
              <div className="name">{e.label}</div>
              <div className="meta">
                {e.length}-character {e.type === 'numeric' ? 'PIN' : 'code'} · recovery: {
                  e.method === 'shares' ? `${e.k} of ${e.n} keys` :
                  e.method === 'grid' ? 'grid search' :
                  `${e.k} of ${e.n} keys or grid search`
                } · made {new Date(e.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="actions">
              <button className="btn secondary" onClick={() => onRecover(e.label)}>Recover</button>
              <button className="copy-btn" onClick={() => handleDelete(e.label)}>Delete</button>
            </div>
          </div>
        ))
      )}

      <div className="hr"></div>
      <button className="btn" onClick={onNew}>Make a new code</button>
    </div>
  );
}
