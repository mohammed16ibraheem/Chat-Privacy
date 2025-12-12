/**
 * End-to-End Encryption Utilities
 * Uses libsodium (NaCl) for secure encryption
 * All encryption/decryption happens client-side
 */

import _sodium from 'libsodium-wrappers';

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
  publicKey: string;
}

let sodium: any;

// Initialize libsodium
export async function initSodium(): Promise<void> {
  if (!sodium) {
    await _sodium.ready;
    sodium = _sodium;
  }
}

/**
 * Generate a new key pair for a user
 * Keys are generated client-side and never sent to server
 */
export async function generateKeyPair(): Promise<KeyPair> {
  await initSodium();
  const keypair = sodium.crypto_box_keypair();
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey,
  };
}

/**
 * Convert key to base64 string for storage
 */
export function keyToString(key: Uint8Array): string {
  return sodium.to_base64(key, sodium.base64_variants.ORIGINAL);
}

/**
 * Convert base64 string back to key
 */
export function stringToKey(keyString: string): Uint8Array {
  return sodium.from_base64(keyString, sodium.base64_variants.ORIGINAL);
}

/**
 * Encrypt a message for a recipient
 * Uses recipient's public key for encryption
 * Note: senderPublicKey is included so recipient can verify sender
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array
): Promise<EncryptedMessage> {
  await initSodium();
  
  const messageBytes = sodium.from_string(message);
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  // Encrypt using crypto_box (authenticated encryption)
  const ciphertext = sodium.crypto_box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderPrivateKey
  );
  
  return {
    ciphertext: keyToString(ciphertext),
    nonce: keyToString(nonce),
    publicKey: keyToString(senderPublicKey), // Sender's public key for verification
  };
}

/**
 * Decrypt a message from a sender
 * Uses sender's public key and recipient's private key
 */
export async function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: Uint8Array,
  recipientPrivateKey: Uint8Array
): Promise<string> {
  await initSodium();
  
  const ciphertext = stringToKey(encrypted.ciphertext);
  const nonce = stringToKey(encrypted.nonce);
  
  try {
    const decrypted = sodium.crypto_box_open(
      ciphertext,
      nonce,
      senderPublicKey,
      recipientPrivateKey
    );
    
    return sodium.to_string(decrypted);
  } catch (error) {
    throw new Error('Failed to decrypt message. The message may be corrupted or keys may be incorrect.');
  }
}

/**
 * Generate a secure random username (optional, for anonymous users)
 */
export async function generateSecureId(): Promise<string> {
  await initSodium();
  const randomBytes = sodium.randombytes_buf(16);
  return keyToString(randomBytes).substring(0, 16).replace(/[+/=]/g, '');
}

