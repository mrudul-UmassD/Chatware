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
      if (!userId) {
        throw new Error('User ID is required for encryption initialization');
      }

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
      this.userId = userId; // Store the current user's ID
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
    if (!userId || !publicKey) {
      throw new Error('User ID and public key are required');
    }
    this.publicKeys[userId] = publicKey;
    
    // Also persist to local storage for future sessions
    try {
      const storedKeys = localStorage.getItem('encryption_public_keys') || '{}';
      const publicKeysMap = JSON.parse(storedKeys);
      publicKeysMap[userId] = publicKey;
      localStorage.setItem('encryption_public_keys', JSON.stringify(publicKeysMap));
    } catch (err) {
      console.error('Failed to store public key:', err);
    }
  }

  // Load saved public keys from localStorage
  loadPublicKeys() {
    try {
      const storedKeys = localStorage.getItem('encryption_public_keys');
      if (storedKeys) {
        this.publicKeys = JSON.parse(storedKeys);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load public keys:', err);
      return false;
    }
  }

  // Encrypt a message for a specific recipient
  encryptMessage(message, recipientId) {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }
    
    if (!message) {
      return message;
    }
    
    if (!recipientId) {
      throw new Error('Recipient ID is required for encryption');
    }
    
    // In a real E2E implementation, we would use the recipient's public key
    // For demo purposes, we'll create a shared secret using a combination of keys
    const recipientKey = this.publicKeys[recipientId];
    
    if (!recipientKey) {
      throw new Error(`Public key not found for recipient: ${recipientId}`);
    }
    
    const sharedSecret = this.keyPair.privateKey + recipientKey;
    
    // Create a hash of the shared secret to use as encryption key
    const encryptionKey = CryptoJS.SHA256(sharedSecret).toString();
    
    // Generate random IV for better security
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Encrypt the message with IV
    const encrypted = CryptoJS.AES.encrypt(message, encryptionKey, {
      iv: iv
    });
    
    // Return both the IV and ciphertext
    return {
      iv: iv.toString(),
      ciphertext: encrypted.toString()
    };
  }

  // Decrypt a message from a specific sender
  decryptMessage(encryptedData, senderId) {
    if (!this.initialized) {
      throw new Error('Encryption service not initialized');
    }
    
    if (!encryptedData) {
      return encryptedData;
    }
    
    if (!senderId) {
      throw new Error('Sender ID is required for decryption');
    }
    
    try {
      // Extract IV and ciphertext
      const { iv, ciphertext } = encryptedData;
      
      if (!iv || !ciphertext) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Get sender's public key
      const senderKey = this.publicKeys[senderId];
      
      if (!senderKey) {
        throw new Error(`Public key not found for sender: ${senderId}`);
      }
      
      // Recreate the shared secret
      const sharedSecret = this.keyPair.privateKey + senderKey;
      
      // Create hash of shared secret for decryption key
      const decryptionKey = CryptoJS.SHA256(sharedSecret).toString();
      
      // Decrypt the message with IV
      const bytes = CryptoJS.AES.decrypt(ciphertext, decryptionKey, {
        iv: CryptoJS.enc.Hex.parse(iv)
      });
      
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return '[Encrypted Message]';
    }
  }

  // Encrypt file content (for image or document sharing)
  encryptFile(fileData, recipientId) {
    if (!fileData || !recipientId) {
      throw new Error('File data and recipient ID are required');
    }
    
    // For files, we'll convert to base64 first if it's not already a string
    const dataToEncrypt = typeof fileData === 'string' 
      ? fileData 
      : this._arrayBufferToBase64(fileData);
    
    return this.encryptMessage(dataToEncrypt, recipientId);
  }

  // Helper to convert ArrayBuffer to Base64 string
  _arrayBufferToBase64(buffer) {
    try {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      return window.btoa(binary);
    } catch (err) {
      console.error('Failed to convert buffer to base64:', err);
      throw err;
    }
  }

  // Decrypt file content
  decryptFile(encryptedFileData, senderId) {
    if (!encryptedFileData || !senderId) {
      throw new Error('Encrypted file data and sender ID are required');
    }
    
    // Decrypt the file data
    const decryptedBase64 = this.decryptMessage(encryptedFileData, senderId);
    
    // Return as base64 string that can be used in src attributes or converted back to blob
    return decryptedBase64;
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