import { vi } from 'bun:test'

export type SSEEvent = { event: string; data: string }
let events: SSEEvent[] = []

export function resetSSE() {
  events = []
}
export function getSSEEvents() {
  return events
}

// Call once in tests to mock hono/streaming
export function mockStreamSSE() {
  vi.mock('hono/streaming', () => ({
    streamSSE: async (_ctx: any, cb: (stream: any) => Promise<void>) => {
      const stream = {
        writeSSE: async ({ event, data }: { event: string; data: string }) => {
          events.push({ event, data })
        },
      }
      await cb(stream)
      return { type: 'sse' }
    },
  }))
}
