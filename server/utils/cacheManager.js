import crypto from 'crypto';
import Cache from '../models/Cache.js';
import mongoose from 'mongoose';

const memoryCache = new Map();

class CacheManager {
  /**
   * Generates a stable hash for any serializable object.
   * Useful for hashing prompts + options/images.
   */
  static generateKey(input) {
    const data = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Retrieves a cached value if it exists and hasn't expired.
   */
  static async get(input, type) {
    const key = this.generateKey(input);
    
    // Check in-memory cache first (or if MongoDB is not connected)
    if (memoryCache.has(key)) {
      const cached = memoryCache.get(key);
      if (cached.expiresAt > Date.now()) {
        console.log(`🎯 Cache HIT (Memory) [${type}]: ${key.substring(0, 8)}`);
        return cached.value;
      }
      memoryCache.delete(key);
    }

    // Try MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const cached = await Cache.findOne({ key, type });
        if (cached) {
          console.log(`🎯 Cache HIT (MongoDB) [${type}]: ${key.substring(0, 8)}`);
          // Sync to memory for faster next access
          memoryCache.set(key, { value: cached.value, expiresAt: cached.expiresAt });
          return cached.value;
        }
      } catch (error) {
        console.error('❌ Cache MongoDB Get Error:', error.message);
      }
    }
    return null;
  }

  /**
   * Stores a value in the cache with a TTL.
   */
  static async set(input, value, provider, type, ttlSeconds = 3600 * 24) {
    const key = this.generateKey(input);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Always set in memory
    memoryCache.set(key, { value, expiresAt });
    console.log(`💾 Cache SET (Memory) [${type}]: ${key.substring(0, 8)}`);

    // Try MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Cache.findOneAndUpdate(
          { key, type },
          { value, provider, expiresAt, type },
          { upsert: true, new: true }
        );
        console.log(`💾 Cache SET (MongoDB) [${type}]: ${key.substring(0, 8)}`);
      } catch (error) {
        console.error('❌ Cache MongoDB Set Error:', error.message);
      }
    }
  }
}

export default CacheManager;
