export type CodeType = 'numeric' | 'alnum';
export type RecoveryMethod = 'shares' | 'grid' | 'both';

/** A character grid used for the "hidden in a grid" recovery puzzle. */
export type Grid = string[][];

/** A single Shamir secret-sharing share. */
export interface Share {
  x: number;
  y: bigint;
}

/** A saved code, as persisted to localStorage (never contains the code itself). */
export interface Entry {
  label: string;
  type: CodeType;
  length: number;
  method: RecoveryMethod;
  hash: string;
  createdAt: number;
  /** Present when method is 'shares' or 'both'. */
  k?: number;
  n?: number;
  /** Present when method is 'grid' or 'both'. */
  grid?: Grid;
}

/** In-progress setup, collected on the "new code" screen and consumed by the trainer. */
export interface Draft {
  label: string;
  length: number;
  type: CodeType;
  method: RecoveryMethod;
  k?: number;
  n?: number;
}

/** Outcome of a recovery attempt (share reconstruction or grid guess). */
export interface RecoverResult {
  ok: boolean;
  message: string;
  candidate?: string;
}
