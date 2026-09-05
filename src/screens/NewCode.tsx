import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { CodeType, Draft, RecoveryMethod } from '../types';
import { loadIndexSync } from '../lib/storage';

interface NewCodeProps {
  onBack: () => void;
  onBegin: (draft: Draft) => void;
}

export default function NewCode({ onBack, onBegin }: NewCodeProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CodeType>('numeric');
  const [length, setLength] = useState<number | ''>(6);
  const [method, setMethod] = useState<RecoveryMethod>('shares');
  const [k, setK] = useState(2);
  const n = 5;

  function handleSetType(t: CodeType) {
    setType(t);
    setLength(prev => (prev === '' ? prev : (t === 'numeric' ? Math.min(prev, 10) : Math.min(prev, 12))));
  }

  function handleLengthChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLength(v === '' ? '' : parseInt(v, 10));
  }

  function handleBegin() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) { alert('Give this code a name first.'); return; }
    const existing = loadIndexSync();
    if (existing.includes(trimmedLabel)) {
      alert('You already have a code with that name. Pick another name, or delete the old one first.');
      return;
    }
    if (!length || length < 4 || length > 12) { alert('Length should be between 4 and 12.'); return; }

    onBegin({
      label: trimmedLabel,
      length,
      type,
      method,
      ...(method === 'shares' || method === 'both' ? { k, n } : {}),
    });
  }

  return (
    <>
      <button className="back-link" onClick={onBack}>&larr; back</button>
      <div className="card">
        <h2>Set up a new code</h2>
        <p className="subtext">
          Give it a name, choose its shape, and pick how you'll get it back if you're ever truly stuck.
          You will not see the finished code written out anywhere on this screen.
        </p>

        <label htmlFor="label-input">What's this code for?</label>
        <input
          type="text"
          id="label-input"
          placeholder="e.g. Screen Time, router admin"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />

        <label>Type of code</label>
        <div className="choice-group">
          <button type="button" className={`choice ${type === 'numeric' ? 'selected' : ''}`} onClick={() => handleSetType('numeric')}>
            <strong>Numeric PIN</strong><span>digits only, like a device passcode</span>
          </button>
          <button type="button" className={`choice ${type === 'alnum' ? 'selected' : ''}`} onClick={() => handleSetType('alnum')}>
            <strong>Letters &amp; numbers</strong><span>stronger, for logins</span>
          </button>
        </div>

        <label htmlFor="length-input">Length</label>
        <input
          type="number"
          id="length-input"
          min="4"
          max={type === 'numeric' ? 10 : 12}
          value={length}
          onChange={handleLengthChange}
        />

        <label>How you'll recover it if you're stuck</label>
        <div className="choice-group">
          <button type="button" className={`choice ${method === 'shares' ? 'selected' : ''}`} onClick={() => setMethod('shares')}>
            <strong>Split into keys</strong><span>hide 5 pieces in different places, any 2 rebuild it</span>
          </button>
          <button type="button" className={`choice ${method === 'grid' ? 'selected' : ''}`} onClick={() => setMethod('grid')}>
            <strong>Hidden in a grid</strong><span>print a page of characters and search it by hand</span>
          </button>
          <button type="button" className={`choice ${method === 'both' ? 'selected' : ''}`} onClick={() => setMethod('both')}>
            <strong>Both</strong><span>keys and a grid, backing up the same code</span>
          </button>
        </div>

        {(method === 'shares' || method === 'both') && (
          <div id="threshold-row">
            <label htmlFor="k-input">How many keys should be required to rebuild it? (out of 5)</label>
            <select id="k-input" value={k} onChange={e => setK(parseInt(e.target.value, 10))}>
              <option value={2}>2 of 5</option>
              <option value={3}>3 of 5</option>
              <option value={4}>4 of 5</option>
            </select>
          </div>
        )}

        <div className="hr"></div>
        <button className="btn" onClick={handleBegin}>Generate &amp; start entry practice</button>
      </div>
    </>
  );
}
