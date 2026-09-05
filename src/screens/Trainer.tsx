import { useEffect, useRef, useState } from 'react';
import type { Draft, Entry, Grid } from '../types';
import { genPassword, sha256Hex, passwordToBigInt } from '../lib/crypto';
import { splitSecret } from '../lib/shamir';
import { buildGrid } from '../lib/grid';

interface TrainerProps {
  draft: Draft;
  onFinish: (entry: Entry, shareTexts: string[] | null, gridData: Grid | null) => void;
}

export default function Trainer({ draft, onFinish }: TrainerProps) {
  const [password] = useState(() => genPassword(draft.type, draft.length));
  const [round, setRound] = useState<1 | 2>(1);
  const [pos, setPos] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [msg, setMsg] = useState('');
  const [msgClass, setMsgClass] = useState('');
  const [charVisible, setCharVisible] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = draft.length;
  const target = password[pos];

  useEffect(() => {
    if (!finishing) inputRef.current?.focus();
  }, [pos, round, finishing]);

  function advance() {
    const nextPos = pos + 1;
    if (nextPos >= total) {
      if (round === 1) {
        setRound(2);
        setPos(0);
      } else {
        finish();
        return;
      }
    } else {
      setPos(nextPos);
    }
    setCharVisible(true);
    setDisabled(false);
    setInputValue('');
    setMsg('');
  }

  function submit() {
    const val = inputValue.trim().toUpperCase();
    if (val === target) {
      setMsg('Good — clearing it now.');
      setMsgClass('ok');
      setCharVisible(false);
      setDisabled(true);
      setTimeout(advance, 550);
    } else {
      setMsg("That's not what was shown — try again.");
      setMsgClass('error');
      setInputValue('');
    }
  }

  async function finish() {
    setFinishing(true);
    const hash = await sha256Hex(password);
    const entry: Entry = {
      label: draft.label,
      type: draft.type,
      length: draft.length,
      method: draft.method,
      hash,
      createdAt: Date.now(),
    };

    let shareTexts: string[] | null = null;
    let gridData: Grid | null = null;

    if (draft.method === 'shares' || draft.method === 'both') {
      const k = draft.k!;
      const n = draft.n!;
      entry.k = k;
      entry.n = n;
      const secretBig = passwordToBigInt(password, draft.type);
      const shares = splitSecret(secretBig, k, n);
      shareTexts = shares.map(s => `${draft.label}|k=${k}|n=${n}|x=${s.x}|y=${s.y.toString(36)}`);
    }
    if (draft.method === 'grid' || draft.method === 'both') {
      const grid = buildGrid(password, draft.type);
      entry.grid = grid;
      gridData = grid;
    }

    onFinish(entry, shareTexts, gridData);
  }

  if (finishing) {
    return (
      <div className="card">
        <h2>Setting things up&hellip;</h2>
        <p className="subtext">Preparing your recovery method.</p>
      </div>
    );
  }

  const dots = Array.from({ length: total }, (_, i) => (
    <div key={i} className={`dot ${i < pos ? 'filled' : ''}`}></div>
  ));

  return (
    <div className="card">
      <div className="round-label">{round === 1 ? 'FIRST PASS — SET IT' : 'SECOND PASS — CONFIRM IT'}</div>
      <h2>{round === 1 ? 'Type each character, then let it go' : 'Once more, to make sure it stuck'}</h2>
      <p className="subtext">
        {round === 1
          ? `A character will appear. Type it into the field below (or into ${draft.label}'s own password field, if you have it open) — then it disappears before the next one shows up. You'll never see the whole code at once.`
          : `Same rhythm, same order — one more time, so your fingers have it even if your memory doesn't.`}
      </p>

      <div className="trainer-window">
        <div className="trainer-char" style={{ opacity: charVisible ? 1 : 0 }}>{target}</div>
        <div className="trainer-instructions">character {pos + 1} of {total}</div>
      </div>
      <div className="dots">{dots}</div>

      <div className="trainer-input-row">
        <input
          ref={inputRef}
          type="text"
          maxLength={1}
          autoComplete="off"
          autoCapitalize="characters"
          value={inputValue}
          disabled={disabled}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn" disabled={disabled} onClick={submit}>Enter</button>
      </div>
      <div className={`trainer-msg ${msgClass}`}>{msg}</div>
    </div>
  );
}
