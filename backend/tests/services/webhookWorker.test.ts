import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startWebhookWorker, stopWebhookWorker } from '../../src/workers/webhookWorker.js';

vi.mock('../../src/db/tenantClient.js', () => ({
  tenantDb: {
    query: vi.fn(),
  },
}));

vi.mock('../../src/services/webhookDispatcher.js', () => ({
  WebhookDispatcher: {
    getWebhookById: vi.fn(),
    signPayload: vi.fn().mockReturnValue('abc123signature'),
  },
}));

vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: () => ({
    lPop: vi.fn().mockResolvedValue(null),
    rPush: vi.fn().mockResolvedValue(1),
    set: vi.fn(),
  }),
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('webhookWorker', () => {
  afterEach(() => {
    stopWebhookWorker();
    vi.clearAllMocks();
  });

  it('should start without throwing', () => {
    expect(() => startWebhookWorker()).not.toThrow();
  });

  it('should not start twice', async () => {
    const logger = (await import('../../src/utils/logger.js')).default;
    startWebhookWorker();
    startWebhookWorker();
    expect(logger.warn).toHaveBeenCalledWith({ message: 'Webhook worker already running' });
  });

  it('should stop without throwing', () => {
    startWebhookWorker();
    expect(() => stopWebhookWorker()).not.toThrow();
  });
});
