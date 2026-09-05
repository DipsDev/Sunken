import type { CodeType } from '../types';

export const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 36 chars, used for alnum mode & grid noise
export const DIGITS = "0123456789";
export const PRIME = (1n << 127n) - 1n; // Mersenne prime, plenty large for our secrets

export function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}
export function randomIndex(max: number): number { // uniform-ish random int in [0, max)
  const a = randomBytes(4);
  const v = (a[0] << 24 | a[1] << 16 | a[2] << 8 | a[3]) >>> 0;
  return v % max;
}
export function randomBigIntBelow(maxExclusive: bigint): bigint {
  const bits = maxExclusive.toString(2).length;
  const bytes = Math.ceil(bits / 8) + 2;
  let val = 0n;
  const arr = randomBytes(bytes);
  for (const b of arr) { val = (val << 8n) | BigInt(b); }
  return val % maxExclusive;
}
export async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function genPassword(type: CodeType, length: number): string {
  const set = type === 'numeric' ? DIGITS : CHARSET;
  let out = '';
  for (let i = 0; i < length; i++) { out += set[randomIndex(set.length)]; }
  return out;
}

/* password <-> bigint, preserving leading zeros via a leading marker digit */
export function passwordToBigInt(pw: string, type: CodeType): bigint {
  if (type === 'numeric') {
    return BigInt('1' + pw);
  } else {
    let digits = '1';
    for (const ch of pw) { digits += CHARSET.indexOf(ch).toString().padStart(2, '0'); }
    return BigInt(digits);
  }
}
export function bigIntToPassword(big: bigint, type: CodeType, length: number): string {
  let s = big.toString().slice(1); // drop marker
  if (type === 'numeric') {
    return s.padStart(length, '0');
  } else {
    s = s.padStart(length * 2, '0');
    let out = '';
    for (let i = 0; i < length; i++) {
      const idx = parseInt(s.slice(i * 2, i * 2 + 2), 10);
      out += CHARSET[idx];
    }
    return out;
  }
}
export function parseBase36BigInt(str: string): bigint {
  let result = 0n;
  const base = 36n;
  for (const ch of str.toLowerCase()) {
    const digit = BigInt(parseInt(ch, 36));
    result = result * base + digit;
  }
  return result;
}
