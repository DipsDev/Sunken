import type { Share } from '../types';
import { PRIME, randomBigIntBelow } from './crypto';

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = egcd(b, a % b);
  return [g, y, x - (a / b) * y];
}
function modInverse(a: bigint, p: bigint): bigint {
  a = ((a % p) + p) % p;
  const [, x] = egcd(a, p);
  return ((x % p) + p) % p;
}
function evalPoly(coeffs: bigint[], x: bigint): bigint {
  let result = 0n, xPow = 1n;
  for (const c of coeffs) { result = (result + c * xPow) % PRIME; xPow = (xPow * x) % PRIME; }
  return result;
}
export function splitSecret(secretBig: bigint, k: number, n: number): Share[] {
  const coeffs = [secretBig % PRIME];
  for (let i = 1; i < k; i++) coeffs.push(randomBigIntBelow(PRIME));
  const shares: Share[] = [];
  for (let x = 1; x <= n; x++) shares.push({ x, y: evalPoly(coeffs, BigInt(x)) });
  return shares;
}
export function reconstructSecret(shares: Share[]): bigint {
  let secret = 0n;
  for (let i = 0; i < shares.length; i++) {
    let num = 1n, den = 1n;
    const xi = BigInt(shares[i].x), yi = shares[i].y;
    for (let j = 0; j < shares.length; j++) {
      if (j === i) continue;
      const xj = BigInt(shares[j].x);
      num = (num * (0n - xj)) % PRIME;
      den = (den * (xi - xj)) % PRIME;
    }
    const li = (((num * modInverse(den, PRIME)) % PRIME) + PRIME) % PRIME;
    secret = (secret + yi * li) % PRIME;
  }
  return ((secret % PRIME) + PRIME) % PRIME;
}
