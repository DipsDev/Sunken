import type { CodePath, Entry, Grid } from "../types";
import CopyButton from "../components/CopyButton";
import GridTable from "../components/GridTable";
import { downloadGrid } from "../lib/grid";

interface DoneProps {
  entry: Entry;
  shareTexts: string[] | null;
  codePath: CodePath | null;
  gridData: Grid | null;
  onDone: () => void;
}

export default function Done({
  entry,
  shareTexts,
  gridData,
  codePath,
  onDone,
}: DoneProps) {
  const sharesBlock = shareTexts && (
    <>
      <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>Keys</h3>
      <div className="warn-box">
        Below are {entry.totalShares} keys. You need any{" "}
        <strong>{entry.threshold}</strong> of them to rebuild the code — never
        all {entry.totalShares} in one place. Put them somewhere genuinely
        separate: a note to yourself, a password manager, a trusted person, a
        locked drawer. This is the only time they'll be shown.
      </div>
      {shareTexts.map((t, i) => (
        <div className="share-box" key={i}>
          <span className="txt">{t}</span>
          <CopyButton text={t} />
        </div>
      ))}
    </>
  );

  const gridBlock = gridData && (
    <>
      <h3 style={{ fontSize: "15px", margin: "20px 0 8px" }}>Grid</h3>
      <p className="subtext">
        Your code is hidden in this Sudoku. You need to solve it. The code is
        spirled throw the top left going in an inverted G shape.
      </p>
      <div className="grid-scroll">
        <GridTable grid={gridData} codePath={codePath ?? []} />
      </div>
      <div className="btn-row">
        <button
          className="btn secondary"
          onClick={() => downloadGrid(gridData, entry.label, codePath ?? [])}
        >
          Download as image
        </button>
      </div>
    </>
  );

  return (
    <div className="card">
      <h2>{entry.label} is set</h2>
      <p className="subtext">
        Your password is safely secured, but you don't know it. Use the methods
        below to recover it if you truly need it back.
      </p>

      {entry.method === "shares" && sharesBlock}
      {entry.method === "grid" && gridBlock}
      {entry.method === "both" && (
        <>
          {sharesBlock}
          <div className="hr"></div>
          {gridBlock}
        </>
      )}

      <div className="hr"></div>
      <button className="btn" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
