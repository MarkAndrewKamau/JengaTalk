import { apiClient } from './client'
import type { SMSLog } from '../types'
import type { BackendSmsStats } from './analytics'

// The backend does not expose a paginated SMS inbox endpoint.
// Inbound SMS is handled by the Africa's Talking webhook at POST /api/sms/inbound.
// We surface aggregate SMS stats from the analytics route.
// For the SMS center inbox we use /api/analytics/sms for stats
// and a health/debug endpoint as a placeholder until a dedicated inbox route is added.

export const smsApi = {
  // Aggregate SMS stats (inbound, outbound, by type)
  stats: () =>
    apiClient.get<{ sms: BackendSmsStats }>('/analytics/sms'),

  // Placeholder — backend will add GET /api/sms/logs in a future iteration
  inbox: (_params?: { page?: number; type?: string }) =>
    Promise.resolve({ data: { logs: [] as SMSLog[] } }),

  // Direct send via Africa's Talking (supplier→contractor)
  // Routed through order status updates which auto-trigger SMS — no standalone endpoint yet.
  // These are no-ops until the backend adds dedicated send/broadcast routes.
  send: (_to: string, _message: string) =>
    Promise.resolve({ data: { ok: true } }),

  broadcast: (_message: string, _scheduled_at?: string) =>
    Promise.resolve({ data: { sent: 0 } }),
}
