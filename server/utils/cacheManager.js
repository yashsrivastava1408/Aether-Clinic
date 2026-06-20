import crypto from 'crypto';
import Cache from '../models/Cache.js';
import mongoose from 'mongoose';
import { createClient } from 'redis';

const memoryCache = new Map();

// Initialize Redis Client if URL is provided
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err.message));
    redisClient.connect().then(() => {
      console.log('✅ Connected to Redis successfully (L2 Cache active)');
    }).catch(err => {
      console.warn('⚠️ Redis connection failed. Caching will use in-memory and MongoDB fallback:', err.message);
      redisClient = null;
    });
  } catch (e) {
    console.error('❌ Redis client initialization failed:', e.message);
  }
}

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
    const now = Date.now();
    
    // 1. Check in-memory L1 cache first (ultra-fast, local to pod)
    if (memoryCache.has(key)) {
      const cached = memoryCache.get(key);
      if (cached.expiresAt > now) {
        console.log(`🎯 Cache HIT (Memory L1) [${type}]: ${key.substring(0, 8)}`);
        return cached.value;
      }
      memoryCache.delete(key);
    }

    // 2. Check Redis L2 cache if connected (shared across pods)
    if (redisClient && redisClient.isOpen) {
      try {
        const cachedValue = await redisClient.get(key);
        if (cachedValue) {
          console.log(`🎯 Cache HIT (Redis L2) [${type}]: ${key.substring(0, 8)}`);
          const parsed = JSON.parse(cachedValue);
          // Sync back to memory L1 for fast future lookups on this node
          memoryCache.set(key, { value: parsed.value, expiresAt: parsed.expiresAt });
          return parsed.value;
        }
      } catch (error) {
        console.error('❌ Redis Get Error:', error.message);
      }
    }

    // 3. Fallback to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const cached = await Cache.findOne({ key, type });
        if (cached) {
          console.log(`🎯 Cache HIT (MongoDB) [${type}]: ${key.substring(0, 8)}`);
          const expiresAtTime = cached.expiresAt.getTime();
          // Sync to memory L1
          memoryCache.set(key, { value: cached.value, expiresAt: expiresAtTime });
          // Sync to Redis L2
          if (redisClient && redisClient.isOpen) {
            const ttlSeconds = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
            if (ttlSeconds > 0) {
              await redisClient.set(key, JSON.stringify({ value: cached.value, expiresAt: expiresAtTime }), {
                EX: ttlSeconds
              });
            }
          }
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
    const now = Date.now();
    const expiresAtTime = now + (ttlSeconds * 1000);
    const expiresAtDate = new Date(expiresAtTime);

    // 1. Store in memory L1 (local to this node/pod)
    memoryCache.set(key, { value, expiresAt: expiresAtTime });
    console.log(`💾 Cache SET (Memory L1) [${type}]: ${key.substring(0, 8)}`);

    // 2. Store in Redis L2 (Shared distributed cache)
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.set(
          key,
          JSON.stringify({ value, expiresAt: expiresAtTime }),
          { EX: ttlSeconds }
        );
        console.log(`💾 Cache SET (Redis L2) [${type}]: ${key.substring(0, 8)}`);
      } catch (error) {
        console.error('❌ Redis Set Error:', error.message);
      }
    }

    // 3. Store in MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        await Cache.findOneAndUpdate(
          { key, type },
          { value, provider, expiresAt: expiresAtDate, type },
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
