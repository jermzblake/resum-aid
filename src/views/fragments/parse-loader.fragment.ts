import { html } from 'hono/html'

export const ParseLoaderFragment = (streamPath = '/api/resume/parse-stream') => html`
  <div
    id="parse-loader"
    hx-ext="sse"
    sse-connect="${streamPath}"
    class="p-4 border rounded-lg border-[#15803D] bg-[#E6F4F1]"
  >
    <div class="flex items-center gap-2 mb-4">
      <div class="w-2 h-2 bg-[#15803D] rounded-full animate-pulse"></div>
      <span class="uppercase tracking-widest text-xs font-bold">Parsing Resume...</span>
    </div>
    <div sse-swap="progress" hx-swap="beforeend" class="font-mono text-sm text-gray-700 whitespace-pre-wrap"></div>
    <div sse-swap="error" hx-swap="outerHTML" class="hidden"></div>
    <div
      sse-swap="complete"
      hx-swap="outerHTML"
      hx-on::before-swap="this.closest('#parse-loader')?.sseEventSource?.close(); htmx.ajax('GET','/api/resume/gaps',{ target: '#tool-content', swap: 'innerHTML', push: false })"
      class="hidden"
    ></div>
  </div>
`
