import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey() {
  const raw = process.env.APP_ENCRYPTION_KEY || '';
  if (!raw) {
    throw new Error('Missing APP_ENCRYPTION_KEY');
  }

  let key = Buffer.alloc(0);
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else {
    key = Buffer.from(raw, 'base64');
  }

  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be 32 bytes (base64 or hex)');
  }

  return key;
}

export function encryptString(plaintext: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join('.');
}

export function decryptString(payload: string) {
  const parts = payload.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload');
  }

  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}
