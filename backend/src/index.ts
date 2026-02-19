import express, { Application } from 'express';
import { Server } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import healthRoutes from './routes/health.js';
import { connectWithRetry as connectDb, closePool } from './db/index.js';
import { connectRedis, closeRedis } from './db/redis.js';

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

  app.use(requestIdMiddleware);

  app.use('/health', healthRoutes);
  app.use('/ready', healthRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const gracefulShutdown = (server: Server): void => {
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ message: `${signal} received. Starting graceful shutdown...` });

    server.close(async () => {
      try {
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

startServer();

export { createApp };
