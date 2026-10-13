// Provably fair randomness for casino rounds.
// floats = bytesToFloats(HMAC_SHA256(key = serverSeed, msg = `${clientSeed}:${cursor}`)) for cursor = 0, 1, ...
import { bytesToFloats } from './engines/casino.ts';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return toHex(new Uint8Array(digest));
}

export async function generateFloats(
  serverSeed: string,
  clientSeed: string,
  count: number,
): Promise<number[]> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(serverSeed),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const floats: number[] = [];
  for (let cursor = 0; floats.length < count; cursor++) {
    const sig = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${clientSeed}:${cursor}`),
    );
    floats.push(...bytesToFloats(new Uint8Array(sig)));
  }
  return floats.slice(0, count);
}

export async function newSeedPair(clientSeed: string | undefined) {
  const serverSeed = randomHex(32);
  return {
    serverSeed,
    serverSeedHash: await sha256Hex(serverSeed),
    clientSeed: clientSeed && /^[A-Za-z0-9_-]{1,64}$/.test(clientSeed) ? clientSeed : randomHex(8),
  };
}
