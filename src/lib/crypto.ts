import type { CodeType } from "../types";

export const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 36 chars, used for alnum mode & grid noise
export const DIGITS = "0123456789";

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return a;
}

export function randomIndex(max: number): number {
  // uniform-ish random int in [0, max)
  const a = randomBytes(4);
  const v = ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0;
  return v % max;
}

export function genPassword(type: CodeType, length: number): string {
  const set = type === "numeric" ? DIGITS : CHARSET;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += set[randomIndex(set.length)];
  }
  return out;
}

export function sharesToHexStrings(shares: Uint8Array[]): string[] {
  return shares.map((share) =>
    Array.from(share)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
  );
}

export function hexStringsToShares(hexStrings: string[]): Uint8Array[] {
  return hexStrings.map((hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  });
}

export function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

export async function sha256Hex(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
