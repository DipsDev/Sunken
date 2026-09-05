export function downloadGrid(
  grid: number[][],
  label: string,
  codePath?: [number, number][],
): void {
  const cell = 44; // Cell dimension
  const pad = 20; // Outer border padding
  const rows = 9;
  const cols = 9;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Build lookup map for O(1) step index retrieval: "r,c" -> 1-based step index
  const pathMap = new Map<string, number>();
  if (codePath) {
    codePath.forEach(([r, c], idx) => {
      pathMap.set(`${r},${c}`, idx + 1);
    });
  }

  // Background
  ctx.fillStyle = "#12161f";
  ctx.fillRect(0, 0, w, h);

  // Render Grid Cells, Highlights, Badges, and Values
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;
      const stepNumber = pathMap.get(`${r},${c}`);

      // Highlight cell if present in code path
      if (stepNumber !== undefined) {
        ctx.fillStyle = "rgba(201, 162, 75, 0.2)";
        ctx.fillRect(x, y, cell, cell);
      }

      // Inner cell border
      ctx.strokeStyle = "#2c3448";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cell, cell);

      // Render path step badge (top-right corner)
      if (stepNumber !== undefined) {
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#c9a24b"; // Brass color
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText(String(stepNumber), x + cell - 3, y + 3);
      }

      // Render cell value
      const val = grid[r]?.[c] ?? 0;
      if (val !== 0) {
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = "#ece8de";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(val), x + cell / 2, y + cell / 2);
      }
    }
  }

  // Heavy 3x3 Subgrid Borders
  ctx.strokeStyle = "#ece8de";
  ctx.lineWidth = 3;

  for (let i = 0; i <= 3; i++) {
    // Vertical 3x3 block lines
    ctx.beginPath();
    ctx.moveTo(pad + i * 3 * cell, pad);
    ctx.lineTo(pad + i * 3 * cell, pad + rows * cell);
    ctx.stroke();

    // Horizontal 3x3 block lines
    ctx.beginPath();
    ctx.moveTo(pad, pad + i * 3 * cell);
    ctx.lineTo(pad + cols * cell, pad + i * 3 * cell);
    ctx.stroke();
  }

  // Trigger PNG download
  const link = document.createElement("a");
  link.download = `sunken-sudoku-${label.replace(/\W+/g, "-").toLowerCase()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
