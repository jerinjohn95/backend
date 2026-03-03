const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM

function getKey() {
  const key = process.env.ENCRYPTION_KEY || '';
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set to 32+ character secret');
  }
  return Buffer.from(key, 'utf8').slice(0, 32);
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(payload) {
  const b = Buffer.from(payload, 'base64');
  const iv = b.slice(0, IV_LENGTH);
  const tag = b.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = b.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
