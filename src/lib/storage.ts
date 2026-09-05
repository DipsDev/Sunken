import type { Entry } from '../types';

// Everything lives in this browser's localStorage — no network, no account, no server.
// That also means it's per-browser: the same device/browser you set a code up in is
// where you'll come back to recover it (or use the downloaded grid image / copied keys,
// which work anywhere).
//
// The underlying operation is always synchronous (localStorage), so the Sync
// variants exist for components that want to read it during initial render
// without a loading flash. The plain names are kept async for readability /
// future-proofing, mirroring the original app's shape.

export function loadIndexSync(): string[] {
  try { return JSON.parse(localStorage.getItem('blindfold:code-index') ?? '[]') || []; } catch (e) { return []; }
}
export function loadEntrySync(label: string): Entry | null {
  try {
    const raw = localStorage.getItem('blindfold:code:' + label);
    return raw ? (JSON.parse(raw) as Entry) : null;
  } catch (e) { return null; }
}

export async function saveEntry(label: string, data: Entry): Promise<void> {
  localStorage.setItem('blindfold:code:' + label, JSON.stringify(data));
  const idx = loadIndexSync();
  if (!idx.includes(label)) idx.push(label);
  localStorage.setItem('blindfold:code-index', JSON.stringify(idx));
}
export async function loadIndex(): Promise<string[]> { return loadIndexSync(); }
export async function loadEntry(label: string): Promise<Entry | null> { return loadEntrySync(label); }
export async function deleteEntry(label: string): Promise<void> {
  localStorage.removeItem('blindfold:code:' + label);
  const idx = loadIndexSync().filter(l => l !== label);
  localStorage.setItem('blindfold:code-index', JSON.stringify(idx));
}
