import type { Grid } from '../types';

const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface GridTableProps {
  grid: Grid;
}

export default function GridTable({ grid }: GridTableProps) {
  return (
    <table className="puzzle">
      <tbody>
        <tr>
          <td className="axis"></td>
          {grid[0].map((_, c) => <td className="axis" key={c}>{c + 1}</td>)}
        </tr>
        {grid.map((row, r) => (
          <tr key={r}>
            <td className="axis">{ROW_LABELS[r] || r}</td>
            {row.map((ch, c) => <td key={c}>{ch}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
