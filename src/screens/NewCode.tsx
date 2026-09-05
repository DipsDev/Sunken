import { useState } from "react";
import type { ChangeEvent } from "react";
import { type CodeType, type Draft, type RecoveryMethod } from "../types";

interface NewCodeProps {
  onBack: () => void;
  onBegin: (draft: Draft) => void;
}

export default function NewCode({ onBack, onBegin }: NewCodeProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CodeType>("numeric");
  const [length, setLength] = useState<number | "">(6);
  const [method, setMethod] = useState<RecoveryMethod>("shares");
  const [totalShares, setTotalShares] = useState(5);
  const [threshold, setThreshold] = useState(3);

  function handleSetType(t: CodeType) {
    setType(t);
    setLength((prev) =>
      prev === ""
        ? prev
        : t === "numeric"
          ? Math.min(prev, 10)
          : Math.min(prev, 12),
    );
  }

  function handleLengthChange(e: ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setLength(v === "" ? "" : parseInt(v, 10));
  }

  function handleBegin() {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      alert("Give this code a name first.");
      return;
    }

    if (!length || length < 4 || length > 12) {
      alert("Length should be between 4 and 12.");
      return;
    }

    if (method === "shares" || method === "both") {
      const draft: Draft = {
        label: trimmedLabel,
        length,
        type,
        method,
        totalShares,
        threshold,
      };

      onBegin(draft);
      return;
    }

    onBegin({
      label: trimmedLabel,
      length,
      type,
      method,
    });
  }

  return (
    <>
      <button className="back-link" onClick={onBack}>
        &larr; back
      </button>
      <div className="card">
        <h2>Set up a new code</h2>
        <p className="subtext">
          Give it a name, choose its shape, and pick how you'll get it back if
          you're ever truly stuck. You will not see the finished code written
          out anywhere on this screen.
        </p>

        <label htmlFor="label-input">What's this code for?</label>
        <input
          type="text"
          id="label-input"
          placeholder="e.g. Screen Time, router admin"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <label>Type of code</label>
        <div className="choice-group">
          <button
            type="button"
            className={`choice ${type === "numeric" ? "selected" : ""}`}
            onClick={() => handleSetType("numeric")}
          >
            <strong>Numeric PIN</strong>
            <span>digits only, like a device passcode</span>
          </button>
          <button
            type="button"
            className={`choice ${type === "alnum" ? "selected" : ""}`}
            onClick={() => handleSetType("alnum")}
          >
            <strong>Letters &amp; numbers</strong>
            <span>stronger, for logins</span>
          </button>
        </div>

        <label htmlFor="length-input">Length</label>
        <input
          type="number"
          id="length-input"
          min="4"
          max={type === "numeric" ? 10 : 12}
          value={length}
          onChange={handleLengthChange}
        />

        <label>How you'll recover it if you're stuck</label>
        <div className="choice-group">
          <button
            type="button"
            className={`choice ${method === "shares" ? "selected" : ""}`}
            onClick={() => setMethod("shares")}
          >
            <strong>Split into keys</strong>
            <span>
              hide n keys in different places, use k of them to rebuild the
              password
            </span>
          </button>
          <button
            type="button"
            className={`choice ${method === "grid" ? "selected" : ""}`}
            onClick={() => setMethod("grid")}
            disabled={type !== "numeric"}
          >
            <strong>Hidden in a Sudoku</strong>
            <span>solve the sudoku and get your password back.</span>
          </button>
          <button
            type="button"
            className={`choice ${method === "both" ? "selected" : ""}`}
            onClick={() => setMethod("both")}
            disabled={type !== "numeric"}
          >
            <strong>Both</strong>
            <span>keys and a sudoku, backing up the same code</span>
          </button>
        </div>

        {(method === "shares" || method === "both") && (
          <div id="threshold-row">
            <label htmlFor="k-input">
              How many keys should be required to rebuild it?
            </label>
            <select
              id="k-input"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
            <label htmlFor="n-input">
              How many keys should be generated in total?
            </label>
            <select
              id="n-input"
              value={totalShares}
              onChange={(e) => setTotalShares(parseInt(e.target.value, 10))}
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
            </select>
          </div>
        )}

        <div className="hr"></div>
        <button className="btn" onClick={handleBegin}>
          Generate
        </button>
      </div>
    </>
  );
}
