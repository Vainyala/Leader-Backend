const crypto = require('crypto');

const SECRET_KEY = process.env.CRYPTO_SECRET || 'default_secret_key';
const IV = Buffer.alloc(16, 0); // 16 null bytes

module.exports = {
  /**
   * 🔐 AES Encrypt (reversible)
   */
  encrypt(text) {
    if (!text || typeof text !== 'string') return '';
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest(); // 32-byte key
    const cipher = crypto.createCipheriv('aes-256-cbc', key, IV);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  },

  /**
   * 🔓 AES Decrypt
   */
  decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string') return '';
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, IV);
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.warn('⚠️ Decryption failed:', err.message);
      return '';
    }
  },

  /**
   * 🧮 SHA256 Hash
   */
  hash(text) {
    if (!text || typeof text !== 'string') return '';
    return crypto.createHash('sha256').update(text).digest('hex');
  }
};
