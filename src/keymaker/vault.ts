/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keeping the private key on a phone without leaving it lying open.
 *
 * WebCrypto can hold a key in IndexedDB marked non-extractable, which stops
 * the key being *read* — but it does not stop it being *used*. Anyone holding
 * the unlocked phone could open the Key Maker and mint technician keys, which
 * makes "protected by a password" untrue in the way that matters.
 *
 * So the key is encrypted at rest instead. Only ciphertext is stored; the
 * password derives the wrapping key through PBKDF2, and unlocking decrypts it
 * and imports it non-extractable for that session alone. Forget the password
 * and the stored copy is lost — which is why the key file itself gets backed
 * up somewhere else, and why the Key Maker says so on screen.
 */

const STORE_KEY = "coreos.keymaker.vault.v1";

/* Deliberately slow. The only thing standing between a stolen phone and a
   technician key is how long each password guess costs. */
const ROUNDS = 310_000;

interface Vault {
  salt: string;
  iv: string;
  data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (character) => character.charCodeAt(0));
}

async function wrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ROUNDS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function hasVault(): boolean {
  try {
    return localStorage.getItem(STORE_KEY) !== null;
  } catch {
    return false;
  }
}

export function forgetVault() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Encrypts the private key under a password and stores only the result. */
export async function lockAway(jwk: JsonWebKey, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await wrappingKey(password, salt);
  const data = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(JSON.stringify(jwk)),
    ),
  );
  const vault: Vault = {
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(data),
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(vault));
}

/**
 * Opens the stored key for this session.
 *
 * Imported non-extractable, so that even with the password the running page
 * cannot hand the private key to anything else — it can sign, and that is
 * all. Returns null when the password is wrong: AES-GCM fails to
 * authenticate, which is indistinguishable from any other wrong key, and
 * that is the correct amount to tell anybody.
 */
export async function openVault(password: string): Promise<CryptoKey | null> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const vault = JSON.parse(raw) as Vault;
    const key = await wrappingKey(password, fromBase64(vault.salt));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(vault.iv) },
      key,
      fromBase64(vault.data),
    );
    const jwk = JSON.parse(new TextDecoder().decode(plain)) as JsonWebKey;
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );
  } catch {
    return null;
  }
}
