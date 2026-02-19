import { createClient, RedisClientType } from 'redis';
import { getRedisConfig } from '../config/env.js';
import logger from '../utils/logger.js';

let client: RedisClientType | null = null;

export const connectRedis = async (
  maxRetries: number = 5,
  baseDelayMs: number = 1000,
): Promise<RedisClientType> => {
  if (client?.isOpen) {
    return client;
  }

  client = createClient({
    ...getRedisConfig(),
    socket: {
      ...(getRedisConfig().socket || {}),
      reconnectStrategy: (retries) => {
        if (retries > maxRetries) {
          logger.error({
            message: 'Max reconnection attempts reached for Redis',
            retries,
          });
          return new Error('Max reconnection attempts reached');
        }
        const delay = Math.min(baseDelayMs * Math.pow(2, retries), 30000);
        logger.warn({
          message: `Redis reconnecting in ${delay}ms`,
          attempt: retries,
        });
        return delay;
      },
    },
  });

  client.on('error', (err) => {
    logger.error({
      message: 'Redis client error',
      error: err.message,
    });
  });

  client.on('connect', () => {
    logger.info({ message: 'Redis client connected' });
  });

  client.on('reconnecting', () => {
    logger.warn({ message: 'Redis client reconnecting' });
  });

  await client.connect();
  return client;
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    if (!client?.isOpen) {
      return false;
    }
    await client.ping();
    return true;
  } catch (error) {
    logger.error({
      message: 'Redis health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

export const closeRedis = async (): Promise<void> => {
  if (client?.isOpen) {
    logger.info({ message: 'Closing Redis connection' });
    await client.quit();
    client = null;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return client;
};

export const setWithExpiry = async (
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> => {
  const redis = getRedisClient();
  await redis.setEx(key, ttlSeconds, value);
};

export const getJSON = async <T>(key: string): Promise<T | null> => {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const setJSON = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> => {
  const redis = getRedisClient();
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setEx(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
};

export const incrementCounter = async (
  key: string,
  ttlSeconds?: number,
): Promise<number> => {
  const redis = getRedisClient();
  const newValue = await redis.incr(key);
  if (ttlSeconds && newValue === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return newValue;
};

export const deleteKey = async (key: string): Promise<void> => {
  const redis = getRedisClient();
  await redis.del(key);
};

/**
 * Sliding window rate limiter using Redis
 * Uses a Lua script for atomic operations to ensure accuracy
 */

// Lua script for sliding window increment
// KEYS[1]: rate limit key
// ARGV[1]: window size in seconds
// ARGV[2]: current timestamp
// Returns: current count within the window
const slidingWindowScript = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local now = tonumber(ARGV[2])

-- Remove entries outside the window
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

-- Add current request
redis.call('ZADD', key, now, now)

-- Set expiry to window size
redis.call('EXPIRE', key, window)

-- Return current count
return redis.call('ZCARD', key)
`;

// Script SHA for caching
let slidingWindowScriptSha: string | null = null;

/**
 * Load the sliding window script and return its SHA
 */
async function loadSlidingWindowScript(): Promise<string> {
  if (slidingWindowScriptSha) {
    return slidingWindowScriptSha;
  }

  const redis = getRedisClient();
  slidingWindowScriptSha = await redis.scriptLoad(slidingWindowScript);
  return slidingWindowScriptSha;
}

/**
 * Increment counter using sliding window algorithm
 * Returns the current count within the window
 */
export const slidingWindowIncrement = async (
  key: string,
  windowSeconds: number
): Promise<number> => {
  const redis = getRedisClient();

  try {
    // Try to use cached SHA first
    if (slidingWindowScriptSha) {
      const result = await redis.evalSha(
        slidingWindowScriptSha,
        {
          keys: [key],
          arguments: [windowSeconds.toString(), Date.now().toString()],
        }
      );
      return result as number;
    }

    // Load script and execute
    const sha = await loadSlidingWindowScript();
    const result = await redis.evalSha(sha, {
      keys: [key],
      arguments: [windowSeconds.toString(), Date.now().toString()],
    });
    return result as number;
  } catch (error) {
    // If script not found, fallback to direct EVAL
    const result = await redis.eval(slidingWindowScript, {
      keys: [key],
      arguments: [windowSeconds.toString(), Date.now().toString()],
    });
    return result as number;
  }
};

/**
 * Get current count within the sliding window
 */
export const getSlidingWindowCount = async (key: string): Promise<number> => {
  const redis = getRedisClient();
  const count = await redis.zCard(key);
  return count;
};

/**
 * Check if rate limit is exceeded
 * Returns { exceeded: boolean, count: number, resetAt: number }
 */
export const checkRateLimit = async (
  key: string,
  windowSeconds: number,
  limit: number
): Promise<{ exceeded: boolean; count: number; resetAt: number }> => {
  const now = Date.now();
  const count = await slidingWindowIncrement(key, windowSeconds);
  const resetAt = now + windowSeconds * 1000;

  return {
    exceeded: count > limit,
    count,
    resetAt,
  };
};

export { client as redisClient };
