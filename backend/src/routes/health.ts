import { Router, type RequestHandler } from 'express';
import { checkConnection as checkDbConnection } from '../db/index.js';
import { checkConnection as checkRedisConnection } from '../db/redis.js';

const router = Router();

const healthHandler: RequestHandler = (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};

const readyHandler: RequestHandler = async (_req, res) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDbConnection(),
    checkRedisConnection(),
  ]);

  const isHealthy = dbHealthy && redisHealthy;
  const status = isHealthy ? 'ok' : 'degraded';

  res.status(isHealthy ? 200 : 503).json({
    status,
    db: dbHealthy,
    redis: redisHealthy,
    timestamp: new Date().toISOString(),
  });
};

router.get('/health', healthHandler);
router.get('/ready', readyHandler);

export default router;
