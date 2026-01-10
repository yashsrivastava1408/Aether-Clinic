import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Key must be 32 bytes (64 hex characters)
// IV length is always 16 bytes for AES
const IV_LENGTH = 16;

export const encrypt = (text) => {
    if (!text) return text;

    // Ensure key exists
    if (!process.env.ENCRYPTION_KEY) {
        console.warn("ENCRYPTION_KEY is missing! Saving in plain text.");
        return text;
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Return as iv:encrypted_data
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Encryption failed:", error);
        return text; // Fallback to plain text on error to avoid data loss
    }
};

export const decrypt = (text) => {
    if (!text) return text;

    // Check if text is in format iv:encrypted
    const textParts = text.split(':');
    if (textParts.length !== 2) {
        // Assume it's legacy plain text (not encrypted)
        return text;
    }

    if (!process.env.ENCRYPTION_KEY) {
        console.warn("ENCRYPTION_KEY is missing! Cannot decrypt.");
        return text;
    }

    try {
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        // If decryption fails (e.g., wrong key or corrupted), return original
        // This prevents crash on reading valid plain text that happens to have a colon
        // console.warn("Decryption failed (returning original):", error.message);
        return text;
    }
};
