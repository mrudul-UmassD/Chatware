import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor() {
    this.initialized = false;
    this.keyPair = null;
    this.publicKeys = {}; // Store public keys of other users
  }

  // Initialize encryption service
  async initialize(userId) {
    try {
      // Check if we already have keys for this user
      const existingKeys = localStorage.getItem(`encryption_keys_${userId}`);
      
      if (existingKeys) {
        this.keyPair = JSON.parse(existingKeys);
      } else {
        // Generate new keypair for this user
        this.keyPair = this.generateKeyPair();
        
        // Store keys securely in local storage
        localStorage.setItem(
          `encryption_keys_${userId}`,
          JSON.stringify(this.keyPair)
        );
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      return false;
    }
  }

  // Generate a new cryptographic key pair
  generateKeyPair() {
    // In a real implementation, we would use RSA or similar asymmetric encryption
    // For this demo, we'll use a simplified approach with AES for demonstration
    const privateKey = CryptoJS.lib.WordArray.random(32).toString();
    const publicKey = CryptoJS.lib.WordArray.random(32).toString();
    
    return { privateKey, publicKey };
  }

  // Store public key of another user
  savePublicKey(userId, publicKey) {
    this.publicKeys[userId] = publicKey;
  }

  // Encrypt a message for a specific recipient
  encryptMessage(message, recipientId) {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }
    
    if (!message) {
      return message;
    }
    
    // In a real E2E implementation, we would use the recipient's public key
    // For demo purposes, we'll create a shared secret using a combination of keys
    const recipientKey = this.publicKeys[recipientId] || 'default-key';
    const sharedSecret = this.keyPair.privateKey + recipientKey;
    
    // Create a hash of the shared secret to use as encryption key
    const encryptionKey = CryptoJS.SHA256(sharedSecret).toString();
    
    // Encrypt the message
    return CryptoJS.AES.encrypt(message, encryptionKey).toString();
  }

  // Decrypt a message from a specific sender
  decryptMessage(encryptedMessage, senderId) {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }
    
    if (!encryptedMessage) {
      return encryptedMessage;
    }
    
    try {
      // Get sender's public key
      const senderKey = this.publicKeys[senderId] || 'default-key';
      
      // Recreate the shared secret
      const sharedSecret = this.keyPair.privateKey + senderKey;
      
      // Create hash of shared secret for decryption key
      const decryptionKey = CryptoJS.SHA256(sharedSecret).toString();
      
      // Decrypt the message
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, decryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return '[Encrypted Message]';
    }
  }

  // Encrypt file content (for image or document sharing)
  encryptFile(fileData, recipientId) {
    // Same principle as message encryption but for file data
    return this.encryptMessage(fileData, recipientId);
  }

  // Decrypt file content
  decryptFile(encryptedFileData, senderId) {
    return this.decryptMessage(encryptedFileData, senderId);
  }

  // Get current user's public key to share with others
  getPublicKey() {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }
    
    return this.keyPair.publicKey;
  }
}

export const encryptionService = new EncryptionService(); 