import pg, { QueryResultRow } from 'pg';
import { getDatabaseConfig } from '../config/env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  ...getDatabaseConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({
    message: 'Unexpected error on idle client',
    error: err.message,
  });
});

export const connectWithRetry = async (
  maxRetries: number = 5,
  baseDelayMs: number = 1000,
): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      logger.info({
        message: 'Database connected successfully',
        timestamp: result.rows[0].now,
      });
      return;
    } catch (error) {
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);

      logger.warn({
        message: `Database connection attempt ${attempt} failed, retrying in ${delayMs}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        attempt,
        maxRetries,
      });

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to connect to database after ${maxRetries} attempts: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export const checkConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.error({
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

export const closePool = async (): Promise<void> => {
  logger.info({ message: 'Closing database pool' });
  await pool.end();
};

export const query = async <T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> => {
  return pool.query<T>(sql, params);
};

export const getClient = async (): Promise<pg.PoolClient> => {
  return pool.connect();
};

export const transaction = async <T>(
  callback: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export { pool };
