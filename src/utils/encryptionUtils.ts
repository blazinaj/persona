import CryptoJS from 'crypto-js';

// Storage key for encryption settings
export const ENCRYPTION_SETTINGS_KEY = 'persona_encryption_settings';

// Prefix for encrypted messages to ensure reliable detection
export const ENCRYPTION_PREFIX = 'ENC:';

// Interface for encryption settings
export interface EncryptionSettings {
  enabled: boolean;
  keyHash?: string; // We store a hash of the key, not the key itself
}

/**
 * Store encryption settings in local storage
 */
export function saveEncryptionSettings(settings: EncryptionSettings): void {
  localStorage.setItem(ENCRYPTION_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Retrieve encryption settings from local storage
 */
export function getEncryptionSettings(): EncryptionSettings {
  const settings = localStorage.getItem(ENCRYPTION_SETTINGS_KEY);
  if (!settings) {
    return { enabled: false };
  }
  
  try {
    return JSON.parse(settings) as EncryptionSettings;
  } catch (e) {
    console.error('Failed to parse encryption settings:', e);
    return { enabled: false };
  }
}

/**
 * Generate a hash of the encryption key for verification
 */
export function hashEncryptionKey(key: string): string {
  return CryptoJS.SHA256(key).toString();
}

/**
 * Verify that a provided key matches the stored hash
 */
export function verifyEncryptionKey(key: string): boolean {
  const settings = getEncryptionSettings();
  if (!settings.enabled || !settings.keyHash) {
    return false;
  }
  
  return hashEncryptionKey(key) === settings.keyHash;
}

/**
 * Set up encryption with a new key
 */
export function setupEncryption(key: string): void {
  const keyHash = hashEncryptionKey(key);
  saveEncryptionSettings({
    enabled: true,
    keyHash
  });
}

/**
 * Disable encryption
 */
export function disableEncryption(): void {
  saveEncryptionSettings({ enabled: false });
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  const settings = getEncryptionSettings();
  return settings.enabled;
}

/**
 * Encrypt a string with the provided key
 * Adds a prefix to mark the message as encrypted
 */
export function encryptMessage(message: string, key: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    // Add prefix to mark as encrypted
    return `${ENCRYPTION_PREFIX}${encrypted}`;
  } catch (e) {
    console.error('Encryption failed:', e);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a string with the provided key
 * Checks for encryption prefix before attempting decryption
 */
export function decryptMessage(encryptedMessage: string, key: string): string {
  try {
    // Check if the message has the encryption prefix
    if (!isEncryptedMessage(encryptedMessage)) {
      // If not encrypted, return as is
      return encryptedMessage;
    }
    
    // Remove prefix before decryption
    const messageWithoutPrefix = encryptedMessage.substring(ENCRYPTION_PREFIX.length);
    
    const bytes = CryptoJS.AES.decrypt(messageWithoutPrefix, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error('Decryption failed:', e);
    throw new Error('Decryption failed - incorrect key or corrupted message');
  }
}

/**
 * Test if a message is encrypted by checking for the encryption prefix
 */
export function isEncryptedMessage(message: string): boolean {
  return message && typeof message === 'string' && message.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Get the encryption key from session storage
 * We use sessionStorage to ensure the key is removed when the browser is closed
 */
export function getEncryptionKey(): string | null {
  return sessionStorage.getItem('persona_encryption_key');
}

/**
 * Set the encryption key in session storage
 */
export function setEncryptionKey(key: string): void {
  sessionStorage.setItem('persona_encryption_key', key);
}

/**
 * Clear the encryption key from session storage
 */
export function clearEncryptionKey(): void {
  sessionStorage.removeItem('persona_encryption_key');
}

/**
 * Check if user has the encryption key in current session
 */
export function hasEncryptionKey(): boolean {
  return getEncryptionKey() !== null;
}