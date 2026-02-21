import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { WebhookDispatcher } from '../../src/services/webhookDispatcher.js';

vi.mock('../../src/db/tenantClient.js', () => ({
  tenantDb: {
    query: vi.fn(),
  },
  getTenantSchema: (tenantId: string) => `tenant_${tenantId.replace(/-/g, '')}`,
}));

vi.mock('../../src/db/redis.js', () => ({
  getRedisClient: () => ({
    rPush: vi.fn().mockResolvedValue(1),
    lPop: vi.fn().mockResolvedValue(null),
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

import { tenantDb } from '../../src/db/tenantClient.js';
import { getRedisClient } from '../../src/db/redis.js';

describe('WebhookDispatcher', () => {
  const tenantSchema = 'tenant_abc123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signPayload', () => {
    it('should sign payload with HMAC-SHA256', () => {
      const secret = 'test-secret';
      const payload = {
        id: 'evt_123',
        type: 'user.created',
        created_at: '2026-02-21T00:00:00Z',
        data: { userId: '456' },
      };

      const signature = WebhookDispatcher.signPayload(secret, payload);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(signature).toHaveLength(64);

      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(signature).toBe(expected);
    });

    it('should produce different signatures for different secrets', () => {
      const payload = {
        id: 'evt_123',
        type: 'user.created',
        created_at: '2026-02-21T00:00:00Z',
        data: {},
      };

      const sig1 = WebhookDispatcher.signPayload('secret-a', payload);
      const sig2 = WebhookDispatcher.signPayload('secret-b', payload);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const secret = 'shared-secret';
      const payload1 = { id: 'evt_1', type: 'a', created_at: '2026-01-01T00:00:00Z', data: {} };
      const payload2 = { id: 'evt_2', type: 'b', created_at: '2026-01-01T00:00:00Z', data: {} };

      const sig1 = WebhookDispatcher.signPayload(secret, payload1);
      const sig2 = WebhookDispatcher.signPayload(secret, payload2);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('dispatchWebhookEvent', () => {
    it('should skip when no active webhooks subscribe to the event', async () => {
      vi.mocked(tenantDb.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await WebhookDispatcher.dispatchWebhookEvent(tenantSchema, 'user.created', {
        userId: '123',
      });

      const redis = getRedisClient();
      expect(redis.rPush).not.toHaveBeenCalled();
    });

    it('should create delivery records and enqueue jobs for matching webhooks', async () => {
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secret: 'secret123',
        events: ['user.created'],
        is_active: true,
      };
      const mockDelivery = {
        id: 'del-1',
        webhook_id: 'wh-1',
        event_type: 'user.created',
        payload: {},
        status: 'pending',
        attempt_count: 0,
      };

      vi.mocked(tenantDb.query)
        .mockResolvedValueOnce({ rows: [mockWebhook], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockDelivery], rowCount: 1 } as any);

      await WebhookDispatcher.dispatchWebhookEvent(tenantSchema, 'user.created', {
        userId: '123',
      });

      const redis = getRedisClient();
      expect(redis.rPush).toHaveBeenCalledOnce();

      const callArgs = vi.mocked(redis.rPush).mock.calls[0];
      expect(callArgs[0]).toBe('queue:webhooks');

      const job = JSON.parse(callArgs[1] as string);
      expect(job.deliveryId).toBe('del-1');
      expect(job.webhookId).toBe('wh-1');
      expect(job.tenantSchema).toBe(tenantSchema);
    });

    it('should create a properly structured event envelope', async () => {
      const mockWebhook = {
        id: 'wh-1',
        url: 'https://example.com/webhook',
        secret: 'secret123',
        events: ['invoice.paid'],
        is_active: true,
      };
      const mockDelivery = {
        id: 'del-2',
        webhook_id: 'wh-1',
        event_type: 'invoice.paid',
        payload: {},
        status: 'pending',
        attempt_count: 0,
      };

      vi.mocked(tenantDb.query)
        .mockResolvedValueOnce({ rows: [mockWebhook], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockDelivery], rowCount: 1 } as any);

      const eventData = { invoiceId: 'inv-123', amount: 5000 };
      await WebhookDispatcher.dispatchWebhookEvent(tenantSchema, 'invoice.paid', eventData);

      const insertCall = vi.mocked(tenantDb.query).mock.calls[1];
      const payloadArg = insertCall[2]![2] as string;
      const envelope = JSON.parse(payloadArg);

      expect(envelope.type).toBe('invoice.paid');
      expect(envelope.id).toMatch(/^evt_/);
      expect(envelope.created_at).toBeTruthy();
      expect(envelope.data).toEqual(eventData);
    });

    it('should enqueue one job per matching webhook', async () => {
      const mockWebhooks = [
        { id: 'wh-1', url: 'https://a.com', secret: 'sec1', events: ['user.created'] },
        { id: 'wh-2', url: 'https://b.com', secret: 'sec2', events: ['user.created'] },
      ];
      const mockDelivery1 = { id: 'del-1', webhook_id: 'wh-1', status: 'pending', attempt_count: 0 };
      const mockDelivery2 = { id: 'del-2', webhook_id: 'wh-2', status: 'pending', attempt_count: 0 };

      vi.mocked(tenantDb.query)
        .mockResolvedValueOnce({ rows: mockWebhooks, rowCount: 2 } as any)
        .mockResolvedValueOnce({ rows: [mockDelivery1], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [mockDelivery2], rowCount: 1 } as any);

      await WebhookDispatcher.dispatchWebhookEvent(tenantSchema, 'user.created', {});

      const redis = getRedisClient();
      expect(redis.rPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('requeueDeadDelivery', () => {
    it('should return null when delivery is not dead', async () => {
      vi.mocked(tenantDb.query).mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const result = await WebhookDispatcher.requeueDeadDelivery(tenantSchema, 'del-999');

      expect(result).toBeNull();
    });

    it('should reset attempt_count and enqueue delivery when dead', async () => {
      const mockDelivery = {
        id: 'del-1',
        webhook_id: 'wh-1',
        status: 'pending',
        attempt_count: 0,
        next_retry_at: null,
        last_error: null,
      };

      vi.mocked(tenantDb.query).mockResolvedValueOnce({ rows: [mockDelivery], rowCount: 1 } as any);

      const result = await WebhookDispatcher.requeueDeadDelivery(tenantSchema, 'del-1');

      expect(result).toEqual(mockDelivery);

      const redis = getRedisClient();
      expect(redis.rPush).toHaveBeenCalledOnce();
    });
  });
});
