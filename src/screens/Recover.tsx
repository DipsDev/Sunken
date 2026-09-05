import { useState } from "react";
import type { ChangeEvent } from "react";
import { combine } from "shamir-secret-sharing";
import type { RecoverResult } from "../types";
import CopyButton from "../components/CopyButton";
import { hexStringsToShares, uint8ArrayToString } from "../lib/crypto";

function ResultBanner({ result }: { result: RecoverResult | null }) {
  if (!result) return null;
  if (result.ok) {
    return (
      <>
        <div className="result-banner ok">{result.message}</div>
        <div className="share-box">
          <span
            className="txt"
            style={{ fontSize: "18px", letterSpacing: "2px" }}
          >
            {result.candidate}
          </span>
          <CopyButton text={result.candidate!} />
        </div>
      </>
    );
  }
  return <div className="result-banner bad">{result.message}</div>;
}

interface RecoverProps {
  onBack: () => void;
}

export default function Recover({ onBack }: RecoverProps) {
  const [shareInputs, setShareInputs] = useState<string[]>(["", ""]);
  const [result, setResult] = useState<RecoverResult | null>(null);

  function updateShareInput(i: number, value: string) {
    setShareInputs((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  function addShareInput() {
    setShareInputs((prev) => [...prev, ""]);
  }

  function removeShareInput(index: number) {
    if (shareInputs.length <= 2) return;
    setShareInputs((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function attemptShareRecovery() {
    const inputs = shareInputs.map((v) => v.trim()).filter(Boolean);

    try {
      const sharesToCombine = hexStringsToShares(inputs);

      const reconstructedBytes = await combine(sharesToCombine);
      const candidate = uint8ArrayToString(reconstructedBytes);

      setResult({
        ok: true,
        message: "Secret reconstructed successfully:",
        candidate,
      });
    } catch (err) {
      setResult({
        ok: false,
        message:
          "Couldn't reconstruct the secret. Double-check that all pasted keys belong to the same split set and are unedited.",
      });
    }
  }

  return (
    <>
      <button className="back-link" onClick={onBack}>
        &larr; back
      </button>
      <div className="card">
        <h2>Recover Secret</h2>

        <p className="subtext">
          Paste your secret shares below to reconstruct the original message.
        </p>

        <div>
          {shareInputs.map((v, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: "10px", marginBottom: "8px" }}
            >
              <input
                type="text"
                className="share-input"
                placeholder={`Key ${i + 1}`}
                value={v}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateShareInput(i, e.target.value)
                }
                style={{ flex: 1, marginBottom: "0px" }}
              />
              {shareInputs.length > 2 && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => removeShareInput(i)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: "12px" }}>
          <button className="btn" onClick={attemptShareRecovery}>
            Reconstruct secret
          </button>
          <button className="btn secondary" onClick={addShareInput}>
            Add key slot
          </button>
        </div>

        <ResultBanner result={result} />
      </div>
    </>
  );
}
