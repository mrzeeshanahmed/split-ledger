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

export { client as redisClient };
