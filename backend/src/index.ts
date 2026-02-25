import express, { Application } from 'express';
import { Server } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { tenantContextMiddleware } from './middleware/tenantContext.js';
import { apiRateLimiter } from './middleware/rateLimiting.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import apiKeysRoutes from './routes/apiKeys.routes.js';
import billingRoutes from './routes/billing.js';
import webhookRoutes from './routes/webhooks.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { connectWithRetry as connectDb, closePool } from './db/index.js';
import { connectRedis, closeRedis } from './db/redis.js';
import { initializePaymentProvider } from './services/payment/paymentProvider.js';
import { startScheduler } from './jobs/scheduler.js';
import { startWebhookWorker, stopWebhookWorker } from './workers/webhookWorker.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const createApp = (): Application => {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
    }),
  );

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    const morganStream = {
      write: (message: string): void => {
        logger.info({ message: message.trim() });
      },
    };
    app.use(morgan('combined', { stream: morganStream }));
  }

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  app.use(requestIdMiddleware);

  // Tenant context middleware (optional for health endpoints)
  app.use('/api', tenantContextMiddleware());

  // Apply rate limiting to API routes
  app.use('/api', apiRateLimiter);

  // Health endpoints (no tenant context required)
  app.use('/health', healthRoutes);
  app.use('/ready', healthRoutes);

  // Auth routes
  app.use('/api/auth', authRoutes);

  // API Keys management routes
  app.use('/api/api-keys', apiKeysRoutes);

  // Billing routes
  app.use('/api/billing', billingRoutes);

  // Webhook routes
  app.use('/api/webhooks', webhookRoutes);

  // Analytics routes
  app.use('/api/analytics', analyticsRoutes);

  // API Documentation (Swagger)
  if (env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
    // Raw JSON spec
    app.get('/api/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const gracefulShutdown = (server: Server): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ message: `${signal} received. Starting graceful shutdown...` });

    server.close(async () => {
      try {
        stopWebhookWorker();
        await closePool();
        await closeRedis();
        logger.info({ message: 'Graceful shutdown complete' });
        process.exit(0);
      } catch (error) {
        logger.error({
          message: 'Error during shutdown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error({ message: 'Forced shutdown due to timeout' });
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

const startServer = async (): Promise<void> => {
  try {
    await connectDb();
    await connectRedis();

    // Initialize payment provider
    initializePaymentProvider(env.NODE_ENV === 'test' ? 'mock' : 'stripe');

    // Start billing scheduler
    startScheduler();

    // Start webhook delivery worker
    startWebhookWorker();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info({
        message: 'Server started',
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    gracefulShutdown(server);
  } catch (error) {
    logger.error({
      message: 'Failed to start server',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { createApp, startServer };
