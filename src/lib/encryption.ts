import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:v1:";
const SALT = "brief-platform-pd-salt";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    (process.env.NODE_ENV === "development"
      ? "dev-only-key-change-in-production-32chars!"
      : "");

  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set and at least 32 characters (152-FZ requirement)"
    );
  }

  return scryptSync(secret, SALT, 32);
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return "";

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, tag, encrypted]);

  return PREFIX + combined.toString("base64");
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return "";
  if (!ciphertext.startsWith(PREFIX)) return ciphertext;

  const key = getEncryptionKey();
  const data = Buffer.from(ciphertext.slice(PREFIX.length), "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = data.subarray(IV_LENGTH + 16);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function encryptRecord(
  record: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = value ? encrypt(value) : "";
  }
  return result;
}

export function decryptRecord(
  record: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = value ? decrypt(value) : "";
  }
  return result;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
