export interface SudokuPuzzleResult {
  /** The embedded secret code */
  secretCode: string;
  /** Playable 9x9 board with 0 for blanks */
  puzzle: number[][];
  /** Complete solved 9x9 grid */
  solution: number[][];
  /** Coordinates [row, col] showing the exact path order of the secret code */
  codePath: [number, number][];
}

export type SudokuDifficulty = "medium" | "hard" | "expert";

const DIFFICULTY_CLUE_LIMITS: Record<SudokuDifficulty, number> = {
  medium: 32,
  hard: 26,
  expert: 23,
};

function getGPathForBlock(
  blockRow: number,
  blockCol: number,
): [number, number][] {
  const startR = blockRow * 3;
  const startC = blockCol * 3;

  const localGPath: [number, number][] = [
    [0, 0],
    [0, 1],
    [0, 2], // Top edge
    [1, 2],
    [2, 2], // Right edge down
    [2, 1],
    [2, 0], // Bottom edge left
    [1, 0], // Left edge up
    [1, 1], // Center cell
  ];

  return localGPath.map(([r, c]) => [startR + r, startC + c]);
}

function getFullGPath(): [number, number][] {
  const fullPath: [number, number][] = [];
  for (let bR = 0; bR < 3; bR++) {
    for (let bC = 0; bC < 3; bC++) {
      fullPath.push(...getGPathForBlock(bR, bC));
    }
  }
  return fullPath;
}

/**
 * Backtracking algorithm to GUARANTEE embedding 100% of the code digits.
 */
function placeCodeDigitsWithBacktracking(
  board: number[][],
  codeDigits: number[],
  digitIdx: number,
  pathIdx: number,
  fullPath: [number, number][],
  placedPath: [number, number][],
): boolean {
  // Base Case: All digits have been successfully placed!
  if (digitIdx >= codeDigits.length) {
    return true;
  }

  // If remaining cells on path are fewer than remaining digits, abort branch
  if (fullPath.length - pathIdx < codeDigits.length - digitIdx) {
    return false;
  }

  const targetDigit = codeDigits[digitIdx];

  // Try placing the current digit at every available upcoming position on the path
  for (
    let i = pathIdx;
    i <= fullPath.length - (codeDigits.length - digitIdx);
    i++
  ) {
    const [r, c] = fullPath[i];

    if (isValidPlacement(board, r, c, targetDigit)) {
      board[r][c] = targetDigit;
      placedPath.push([r, c]);

      // Recursively try to place the remaining digits
      if (
        placeCodeDigitsWithBacktracking(
          board,
          codeDigits,
          digitIdx + 1,
          i + 1,
          fullPath,
          placedPath,
        )
      ) {
        return true;
      }

      // Backtrack if placing this digit here caused a downstream conflict
      board[r][c] = 0;
      placedPath.pop();
    }
  }

  return false;
}

export function generateGShapeSecretSudoku(
  secretCode: string | number[],
  difficulty: SudokuDifficulty = "hard",
): SudokuPuzzleResult {
  const codeDigits: number[] = Array.isArray(secretCode)
    ? secretCode.map(Number)
    : String(secretCode)
        .replace(/[^1-9]/g, "")
        .split("")
        .map(Number);

  if (codeDigits.length > 81) {
    throw new Error("Secret code cannot exceed 81 digits.");
  }

  if (codeDigits.some((d) => d < 1 || d > 9 || isNaN(d))) {
    throw new Error("All code digits must be valid numbers between 1 and 9.");
  }

  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  const fullPath = getFullGPath();
  const placedPath: [number, number][] = [];

  // 1. Guaranteed Backtracking Code Placement
  const success = placeCodeDigitsWithBacktracking(
    board,
    codeDigits,
    0,
    0,
    fullPath,
    placedPath,
  );

  if (!success) {
    throw new Error(
      "Could not place this exact combination of digits without violating Sudoku rules. Try a slightly different or shorter code.",
    );
  }

  // Verify 100% of digits were embedded
  if (placedPath.length !== codeDigits.length) {
    throw new Error("Failed to embed all secret code digits.");
  }

  // 2. Solve the full board around the embedded code
  if (!solveSudoku(board)) {
    throw new Error(
      "Could not construct a valid Sudoku board around this code.",
    );
  }

  const solution: number[][] = board.map((row) => [...row]);
  const targetClues = DIFFICULTY_CLUE_LIMITS[difficulty];
  const puzzle = createHardPuzzle(solution, targetClues);

  return {
    secretCode: codeDigits.join(""),
    puzzle,
    solution,
    codePath: placedPath,
  };
}

function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  num: number,
): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;

    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
}

function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
          () => Math.random() - 0.5,
        );

        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid: number[][], count = { value: 0 }): number {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(grid, r, c, num)) {
            grid[r][c] = num;
            countSolutions(grid, count);
            grid[r][c] = 0;

            if (count.value >= 2) return count.value;
          }
        }
        return count.value;
      }
    }
  }
  count.value += 1;
  return count.value;
}

function hasUniqueSolution(grid: number[][]): boolean {
  const gridCopy = grid.map((row) => [...row]);
  return countSolutions(gridCopy) === 1;
}

function scoreCellRemoval(grid: number[][], row: number, col: number): number {
  let openCandidates = 0;
  const num = grid[row][col];

  grid[row][col] = 0;
  for (let n = 1; n <= 9; n++) {
    if (isValidPlacement(grid, row, col, n)) openCandidates++;
  }
  grid[row][col] = num;

  return openCandidates;
}

function createHardPuzzle(
  solutionGrid: number[][],
  targetClues: number,
): number[][] {
  const puzzle: number[][] = solutionGrid.map((row) => [...row]);
  let currentClues = 81;

  let positions: { pos: [number, number]; score: number }[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const score = scoreCellRemoval(puzzle, r, c);
      positions.push({ pos: [r, c], score });
    }
  }

  positions.sort((a, b) => b.score - a.score + (Math.random() - 0.5));

  for (const {
    pos: [r, c],
  } of positions) {
    if (currentClues <= targetClues) break;

    const originalVal = puzzle[r][c];
    puzzle[r][c] = 0;

    if (!hasUniqueSolution(puzzle)) {
      puzzle[r][c] = originalVal;
    } else {
      currentClues--;
    }
  }

  return puzzle;
}
