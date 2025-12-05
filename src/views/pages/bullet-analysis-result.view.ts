import { html } from 'hono/html'
import type { BulletAnalysis } from '@/services/llm/llm.interface'

export const BulletAnalysisResultView = (analysis: BulletAnalysis) => {
  return html`
    <div
      class="p-4 border rounded-lg ${analysis.score >= 7
        ? 'border-green-400 bg-green-50'
        : analysis.score >= 4
          ? 'border-amber-400 bg-amber-50'
          : 'border-red-400 bg-red-50'}"
    >
      <h3 class="text-xl font-semibold mb-2">Bullet Analysis Result</h3>
      <p>
        <strong>Score:</strong>
        <span
          class="${analysis.score >= 7
            ? 'text-green-600 font-bold'
            : analysis.score >= 4
              ? 'text-amber-600 font-bold'
              : 'text-red-600 font-bold'}"
          >${analysis.score}/10</span
        >
      </p>
      <p><strong>Feedback:</strong> ${analysis.feedback}</p>
      <p><strong>Improved:</strong> ${analysis.improved}</p>
    </div>
  `
}

export const BulletAnalysisLoadingBox = (bullet: string) => {
  return html`
    <div
      id="stream-loader"
      hx-ext="sse"
      sse-connect="/api/stream-bullet-analysis?bullet=${encodeURIComponent(bullet)}"
      class="p-4 border rounded-lg border-blue-500 bg-gray-50"
    >
      <div class="flex items-center gap-2 mb-4 border-b pb-2">
        <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span class="uppercase tracking-widest text-xs font-bold">AI Analyzing Bullet....</span>
      </div>

      <div
        sse-swap="token"
        hx-swap="beforeend"
        class="font-mono text-xs text-gray-600 whitespace-pre-wrap break-words max-h-48 overflow-y-auto"
      ></div>

      <div
        sse-swap="result"
        hx-swap="outerHTML"
        hx-target="#stream-loader"
        hx-on::before-swap="
          const sseElement = document.getElementById('stream-loader');
          if (sseElement && sseElement.sseEventSource) {
            sseElement.sseEventSource.close();
          }
        "
        class="hidden"
      ></div>
    </div>
  `
}
