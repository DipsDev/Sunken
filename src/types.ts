export type CodeType = "numeric" | "alnum";
export type RecoveryMethod = "shares" | "grid" | "both";

/** A character grid used for the "hidden in a grid" recovery puzzle. */
export type Grid = number[][];
export type CodePath = [number, number][];

/** A saved code, as persisted to localStorage (never contains the code itself). */
export interface Entry {
  label: string;
  type: CodeType;
  length: number;
  method: RecoveryMethod;
  hash: string;
  createdAt: string;
  /** Present when method is 'shares' or 'both'. */
  totalShares?: number;
  threshold?: number;
  /** Present when method is 'grid' or 'both'. */
  grid?: Grid;
  codePath?: CodePath;
}

interface BaseDraft {
  label: string;
  length: number;
  type: CodeType;
}

/** In-progress setup, collected on the "new code" screen and consumed by the trainer. */
export interface GridDraft extends BaseDraft {
  method: "grid";
}

export interface SharesDraft extends BaseDraft {
  method: "shares";

  totalShares: number;
  threshold: number;
}

export interface MultiMethodDraft extends BaseDraft {
  method: "both";

  totalShares: number;
  threshold: number;
}

export type Draft = MultiMethodDraft | GridDraft | SharesDraft;

/** Outcome of a recovery attempt (share reconstruction or grid guess). */
export interface RecoverResult {
  ok: boolean;
  message: string;
  candidate?: string;
}
