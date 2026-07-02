import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export type EncryptedCredentialPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
};

const INTEGRATIONS_KEY_ENV =
  process.env.INTEGRATIONS_ENCRYPTION_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "";

function deriveKey(): Buffer {
  if (!INTEGRATIONS_KEY_ENV) {
    throw new Error("Integrations encryption key is not configured");
  }
  return createHash("sha256").update(INTEGRATIONS_KEY_ENV).digest();
}

export function encryptCredentials(credentials: Record<string, unknown>): EncryptedCredentialPayload {
  const serialized = JSON.stringify(credentials ?? {});
  const iv = randomBytes(12);
  const key = deriveKey();

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(serialized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptCredentials(payload: EncryptedCredentialPayload): Record<string, unknown> {
  const key = deriveKey();
  const iv = Buffer.from(payload.iv, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const tag = Buffer.from(payload.tag, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(plain) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return parsed as Record<string, unknown>;
}

export function hasCredentialShape(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
