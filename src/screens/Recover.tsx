import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Entry, RecoverResult } from '../types';
import { loadEntrySync } from '../lib/storage';
import { sha256Hex, parseBase36BigInt, bigIntToPassword } from '../lib/crypto';
import { reconstructSecret } from '../lib/shamir';
import { downloadGrid } from '../lib/grid';
import GridTable from '../components/GridTable';
import CopyButton from '../components/CopyButton';

function parseShareText(text: string): Record<string, string> {
  const parts: Record<string, string> = {};
  text.trim().split('|').forEach(p => {
    const [k, v] = p.split('=');
    if (v === undefined) parts.label = k;
    else parts[k] = v;
  });
  return parts;
}

function ResultBanner({ result }: { result: RecoverResult | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <>
        <div className="result-banner ok">{result.message}</div>
        <div className="share-box">
          <span className="txt" style={{ fontSize: '18px', letterSpacing: '2px' }}>{result.candidate}</span>
          <CopyButton text={result.candidate!} />
        </div>
      </>
    );
  }
  return <div className="result-banner bad">{result.message}</div>;
}

interface RecoverProps {
  label: string;
  onBack: () => void;
}

export default function Recover({ label, onBack }: RecoverProps) {
  const [entry] = useState<Entry | null>(() => loadEntrySync(label));
  const [activeTab, setActiveTab] = useState<'shares' | 'grid'>(() => (entry && entry.method === 'grid' ? 'grid' : 'shares'));
  const [shareInputs, setShareInputs] = useState<string[]>(['']);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<RecoverResult | null>(null);

  useEffect(() => {
    if (!entry) {
      alert('Could not find that code.');
      onBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entry) return null;

  function switchTab(tab: 'shares' | 'grid') {
    setActiveTab(tab);
    setShareInputs(['']);
    setGuess('');
    setResult(null);
  }

  function updateShareInput(i: number, value: string) {
    setShareInputs(prev => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function addShareInput() {
    setShareInputs(prev => [...prev, '']);
  }

  async function attemptShareRecovery() {
    const inputs = shareInputs.map(v => v.trim()).filter(Boolean);
    if (inputs.length < entry!.k!) {
      setResult({ ok: false, message: `You need at least ${entry!.k} keys — only ${inputs.length} entered.` });
      return;
    }
    try {
      const parsed = inputs.map(t => {
        const p = parseShareText(t);
        return { x: parseInt(p.x, 10), y: parseBase36BigInt(p.y) };
      });
      const secret = reconstructSecret(parsed.slice(0, Math.max(entry!.k!, parsed.length)));
      const candidate = bigIntToPassword(secret, entry!.type, entry!.length);
      const hash = await sha256Hex(candidate);
      if (hash === entry!.hash) {
        setResult({ ok: true, message: 'Rebuilt successfully. Your code is:', candidate });
      } else {
        setResult({
          ok: false,
          message: "Those keys didn't reconstruct a valid code. Double-check you copied them exactly, including the label and x= / y= parts.",
        });
      }
    } catch (err) {
      setResult({ ok: false, message: "Couldn't read one of those keys. Make sure each is pasted in full and unedited." });
    }
  }

  async function attemptGridRecovery() {
    const g = guess.trim().toUpperCase();
    const hash = await sha256Hex(g);
    if (hash === entry!.hash) {
      setResult({ ok: true, message: "That's it. Your code is:", candidate: g });
    } else {
      setResult({ ok: false, message: 'Not a match — keep looking. Remember, several decoys are hidden too.' });
    }
  }

  const showTabs = entry.method === 'both';
  const currentMode = entry.method === 'both' ? activeTab : entry.method;

  return (
    <>
      <button className="back-link" onClick={onBack}>&larr; back</button>
      <div className="card">
        <h2>Recover "{entry.label}"</h2>

        {showTabs && (
          <div className="choice-group">
            <button className={`choice ${activeTab === 'shares' ? 'selected' : ''}`} onClick={() => switchTab('shares')}>
              <strong>Use keys</strong>
            </button>
            <button className={`choice ${activeTab === 'grid' ? 'selected' : ''}`} onClick={() => switchTab('grid')}>
              <strong>Use grid</strong>
            </button>
          </div>
        )}

        {currentMode === 'shares' ? (
          <>
            <p className="subtext">
              Paste at least <strong>{entry.k}</strong> of the {entry.n} keys you saved for this code, one per box.
            </p>
            <div>
              {shareInputs.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  className="share-input"
                  placeholder={`key ${i + 1}`}
                  value={v}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateShareInput(i, e.target.value)}
                />
              ))}
            </div>
            <div className="btn-row">
              <button className="btn secondary" onClick={addShareInput}>Add another key</button>
              <button className="btn" onClick={attemptShareRecovery}>Rebuild code</button>
            </div>
            <ResultBanner result={result} />
          </>
        ) : (
          <>
            <p className="subtext">
              Search the grid below for a run of {entry.length} characters that isn't just noise — it may take
              a while, and several decoys are mixed in on purpose. When you think you've found it, enter it here to check.
            </p>
            <div className="grid-scroll"><GridTable grid={entry.grid!} /></div>
            <label htmlFor="guess-input">Your guess</label>
            <input
              type="text"
              id="guess-input"
              maxLength={entry.length}
              autoCapitalize="characters"
              value={guess}
              onChange={e => setGuess(e.target.value)}
            />
            <button className="btn" onClick={attemptGridRecovery}>Check</button>
            <ResultBanner result={result} />
            <div className="btn-row" style={{ marginTop: '16px' }}>
              <button className="btn secondary" onClick={() => downloadGrid(entry.grid!, entry.label)}>Download grid again</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
