/**
 * Webhook event types configuration
 * These are the events that can trigger webhooks
 */

export const WEBHOOK_EVENTS = [
  'account.created',
  'account.updated',
  'account.deleted',
  'user.created',
  'user.updated',
  'user.deleted',
  'api_key.created',
  'api_key.updated',
  'api_key.deleted',
  'api_key.revoked',
  'api_key.rate_limited',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'subscription.renewed',
  'invoice.created',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.overdue',
  'usage_record.created',
  'usage_threshold.reached',
  'webhook.created',
  'webhook.updated',
  'webhook.deleted',
  'webhook.delivery.success',
  'webhook.delivery.failed',
  'webhook.delivery.dead',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

/**
 * Webhook event categories for grouping in UI
 */
export const WEBHOOK_EVENT_CATEGORIES = {
  account: ['account.created', 'account.updated', 'account.deleted'],
  user: ['user.created', 'user.updated', 'user.deleted'],
  api_key: [
    'api_key.created',
    'api_key.updated',
    'api_key.deleted',
    'api_key.revoked',
    'api_key.rate_limited',
  ],
  subscription: [
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'subscription.renewed',
  ],
  billing: [
    'invoice.created',
    'invoice.paid',
    'invoice.payment_failed',
    'invoice.overdue',
  ],
  usage: ['usage_record.created', 'usage_threshold.reached'],
  webhook: [
    'webhook.created',
    'webhook.updated',
    'webhook.deleted',
    'webhook.delivery.success',
    'webhook.delivery.failed',
    'webhook.delivery.dead',
  ],
} as const;

export type WebhookEventCategory = keyof typeof WEBHOOK_EVENT_CATEGORIES;

/**
 * Get events by category
 */
export function getEventsByCategory(
  category: WebhookEventCategory
): WebhookEventType[] {
  return WEBHOOK_EVENT_CATEGORIES[category] as unknown as WebhookEventType[];
}

/**
 * Get category for an event
 */
export function getEventCategory(
  event: WebhookEventType
): WebhookEventCategory | null {
  for (const [category, events] of Object.entries(WEBHOOK_EVENT_CATEGORIES)) {
    const typedEvents = events as unknown as WebhookEventType[];
    if (typedEvents.includes(event)) {
      return category as WebhookEventCategory;
    }
  }
  return null;
}
