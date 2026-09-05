import type { CodeType, Grid } from '../types';
import { DIGITS, CHARSET, randomIndex } from './crypto';

export function buildGrid(password: string, type: CodeType): Grid {
  const size = Math.max(16, password.length + 6);
  const rows = size, cols = size;
  const set = type === 'numeric' ? DIGITS : CHARSET;
  const grid: Grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => set[randomIndex(set.length)]));

  function place(str: string) {
    const row = randomIndex(rows);
    const col = randomIndex(cols - str.length + 1);
    for (let i = 0; i < str.length; i++) grid[row][col + i] = str[i];
  }
  // real code
  place(password);
  // decoys of the same length so the real one doesn't stand out
  const decoyCount = 6;
  for (let i = 0; i < decoyCount; i++) {
    let decoy = '';
    for (let j = 0; j < password.length; j++) decoy += set[randomIndex(set.length)];
    place(decoy);
  }
  return grid;
}

export function downloadGrid(grid: Grid, label: string): void {
  const cell = 28;
  const pad = 40;
  const w = grid[0].length * cell + pad * 2;
  const h = grid.length * cell + pad * 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#12161f';
  ctx.fillRect(0, 0, w, h);
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#2c3448';
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // column labels
  ctx.fillStyle = '#8a713a';
  grid[0].forEach((_, c) => ctx.fillText(String(c + 1), pad + c * cell + cell / 2, pad / 2));
  grid.forEach((row, r) => {
    ctx.fillStyle = '#8a713a';
    ctx.fillText(rowLabels[r] || String(r), pad / 2, pad + r * cell + cell / 2);
    row.forEach((ch, c) => {
      const x = pad + c * cell, y = pad + r * cell;
      ctx.strokeRect(x, y, cell, cell);
      ctx.fillStyle = '#ece8de';
      ctx.fillText(ch, x + cell / 2, y + cell / 2);
    });
  });
  const link = document.createElement('a');
  link.download = `blindfold-${label.replace(/\W+/g, '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
