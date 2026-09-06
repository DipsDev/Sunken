import { useEffect, useMemo, useState } from "react";
import type { CodePath, Draft, Entry, Grid } from "../types";
import { genPassword, sharesToHexStrings } from "../lib/crypto";
import { split } from "shamir-secret-sharing";
import { generateGShapeSecretSudoku } from "../lib/sudoku";

interface TrainerProps {
  draft: Draft;
  onFinish: (
    entry: Entry,
    shareTexts: string[] | null,
    gridData: Grid | null,
    codePath: CodePath | null,
  ) => void;
}

interface GeneratedSetup {
  password: string;
  gridData: Grid | null;
  codePath: CodePath | null;
}

async function generateSetup(
  draft: Draft,
  maxRetries = 3,
): Promise<GeneratedSetup> {
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    // Yield to the main thread briefly so UI renders the loading state smoothly
    await new Promise((resolve) => setTimeout(resolve, 0));

    const pwd = genPassword(draft.type, draft.length);

    if (draft.method === "grid" || draft.method === "both") {
      try {
        const grid = generateGShapeSecretSudoku(pwd, "expert");
        return {
          password: pwd,
          gridData: grid.puzzle,
          codePath: grid.codePath as CodePath,
        };
      } catch {
        continue;
      }
    } else {
      return { password: pwd, gridData: null, codePath: null };
    }
  }

  throw new Error(
    `Failed to generate a valid Sudoku grid after ${maxRetries} attempts.`,
  );
}

export default function Trainer({ draft, onFinish }: TrainerProps) {
  const [setup, setSetup] = useState<GeneratedSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [round, setRound] = useState<1 | 2>(1);
  const [pos, setPos] = useState(0);
  const [finishing, setFinishing] = useState(false);

  // Generate valid password & grid asynchronously on component mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    generateSetup(draft, 5)
      .then((data) => {
        if (isMounted) {
          setSetup(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to initialize trainer session.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draft]);

  const bloatedPassword = useMemo(() => {
    if (!setup?.password) return [];

    return setup.password.split("").flatMap((letter, i) => {
      if (i + 1 === setup.password.length) {
        return [letter];
      }

      const bloatedActions: string[] = [];
      while (Math.random() < 0.45) {
        const randomChar = genPassword(draft.type, 1)[0];
        const mid = Math.floor(bloatedActions.length / 2);
        bloatedActions.splice(mid, 0, randomChar, "Delete");
      }

      return [...bloatedActions, letter];
    });
  }, [setup?.password, draft.type, round]);

  const total = bloatedPassword.length;
  const target = bloatedPassword[pos];

  function advance() {
    const nextPos = pos + 1;
    if (nextPos >= total) {
      if (round === 1) {
        setRound(2);
        setPos(0);
      } else {
        finish();
      }
    } else {
      setPos(nextPos);
    }
  }

  async function finish() {
    if (!setup) return;
    setFinishing(true);

    let shareTexts: string[] | null = null;

    if (draft.method === "shares" || draft.method === "both") {
      const encodedPassword = new TextEncoder().encode(setup.password);
      const shares = await split(
        encodedPassword,
        draft.totalShares,
        draft.threshold,
      );
      shareTexts = sharesToHexStrings(shares);
    }

    const entry: Entry = {
      label: draft.label,
      type: draft.type,
      length: draft.length,
      method: draft.method,
      hash: "",
      createdAt: new Date().toISOString(),
    };

    if (draft.method === "shares" || draft.method === "both") {
      entry.totalShares = draft.totalShares;
      entry.threshold = draft.threshold;
    }

    onFinish(entry, shareTexts, setup.gridData, setup.codePath);
  }

  // Initial setup loading screen
  if (loading) {
    return (
      <div className="card">
        <h2>Preparing Trainer&hellip;</h2>
        <p className="subtext">Generating puzzle and verifying secret path.</p>
      </div>
    );
  }

  // Failure fallback if grid cannot be created after max retries
  if (error || !setup) {
    return (
      <div className="card">
        <h2>Generation Failed</h2>
        <p className="subtext">
          {error || "Could not generate a valid configuration."}
        </p>
        <button className="btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Finishing screen
  if (finishing) {
    return (
      <div className="card">
        <h2>Setting things up&hellip;</h2>
        <p className="subtext">Preparing your recovery method.</p>
      </div>
    );
  }

  const dots = Array.from({ length: total - 1 }, (_, i) => (
    <div key={i} className={`dot ${i < pos ? "filled" : ""}`}></div>
  ));

  return (
    <div className="card">
      <div className="round-label">
        {round === 1 ? "FIRST PASS — SET IT" : "SECOND PASS — CONFIRM IT"}
      </div>
      <h2>
        {round === 1 ? "Type each character, then press next" : "Once more"}
      </h2>
      <p className="subtext">
        {round === 1
          ? `A character will appear. Type it into ${draft.label}'s password field. If the character tells you to delete it, then do as it says.`
          : `Same code, different way. Just to make sure you followed the instructions correctly.`}
      </p>

      <div className="trainer-window">
        <div className="trainer-char">{target}</div>
        <div className="trainer-instructions">
          character {pos + 1} of {total}
        </div>
      </div>
      <div className="dots">{dots}</div>

      <div className="trainer-input-row">
        <button className="btn" onClick={advance}>
          {pos + 1 === total ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
