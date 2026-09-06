import { Dispatch } from "react";
import type { Entry } from "../types";

interface HomeProps {
  onNew: () => void;
  onRecover: (label: string) => void;

  entries: Entry[];
  setEntries: Dispatch<React.SetStateAction<Entry[]>>;
}

export default function Home({
  onNew,
  onRecover,
  entries,
  setEntries,
}: HomeProps) {
  async function handleDelete(label: string) {
    if (
      !window.confirm(
        `Delete "${label}"? This can't be undone, and there is no recovery once it's gone.`,
      )
    )
      return;
    setEntries((prev) => prev.filter((v) => v.label !== label));
  }

  return (
    <div className="card">
      <h2>Your codes</h2>
      <p className="subtext">
        Each one was generated so you never saw it whole and never had to
        remember it. Nothing here shows you the code itself — only whether a
        recovery attempt matches.
      </p>

      {entries.length === 0 ? (
        <div className="empty-state">
          No codes saved yet. Make your first one below.
        </div>
      ) : (
        entries.map((e) => (
          <div className="saved-item" key={e.label}>
            <div>
              <div className="name">{e.label}</div>
              <div className="meta">
                {e.length}-character {e.type === "numeric" ? "PIN" : "code"} ·
                recovery:{" "}
                {e.method === "shares"
                  ? `${e.threshold} of ${e.totalShares} keys`
                  : e.method === "grid"
                    ? "grid search"
                    : `${e.threshold} of ${e.totalShares} keys or grid search`}{" "}
                · made {new Date(e.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="actions">
              <button
                className="btn secondary"
                onClick={() => onRecover(e.label)}
              >
                Recover
              </button>
              <button
                className="copy-btn"
                onClick={() => handleDelete(e.label)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      <div className="hr"></div>
      <div className="home-btns-row">
        <button className="btn" onClick={onNew}>
          Make a new code
        </button>
        <button onClick={() => onRecover("test")} className="btn secondary">
          Recover outside code
        </button>
      </div>
    </div>
  );
}
