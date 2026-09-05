import { CodePath, Grid } from "../types";

interface GridTableProps {
  /** 9x9 matrix representing the Sudoku grid */
  grid: Grid;
  /** Optional secret code path coordinates [[row, col], ...] */
  codePath?: CodePath;
}

export default function GridTable({ grid, codePath = [] }: GridTableProps) {
  // Create a map/lookup for quick O(1) checks for path index by coordinate
  const pathMap = new Map<string, number>();
  codePath.forEach(([r, c], index) => {
    pathMap.set(`${r},${c}`, index + 1);
  });

  return (
    <div className="grid-scroll">
      <table className="puzzle sudoku">
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((val, c) => {
                const stepNumber = pathMap.get(`${r},${c}`);
                const isInPath = stepNumber !== undefined;

                return (
                  <td key={c} className={isInPath ? "in-code-path" : ""}>
                    {isInPath && (
                      <span className="path-badge">{stepNumber}</span>
                    )}
                    {val === 0 ? "" : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
