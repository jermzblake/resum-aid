import { html } from 'hono/html'
import type { JobMatchResult } from '@/types'

interface JobMatchResultsViewProps {
  results: JobMatchResult
}

export const JobMatchResultsView = ({ results }: JobMatchResultsViewProps) => {
  const renderScore = (score: number) => {
    if (score >= 80) {
      return html`<span class="text-green-600 font-bold">${score}%</span>`
    } else if (score >= 50) {
      return html`<span class="text-amber-600 font-bold">${score}%</span>`
    } else {
      return html`<span class="text-red-600 font-bold">${score}%</span>`
    }
  }
  return html`
    <div class="prose">
      <h2 class="text-2xl font-bold mb-4">Job Match Results</h2>
      <p class="text-xl font-semibold"><strong>Match Score:</strong> ${renderScore(results.score)}</p>
      <h3 class="mt-4 mb-2 text-lg font-semibold">Strengths 💪🏾</h3>
      <ul>
        ${results.strengths.map((strength) => html`<li>${strength}</li>`)}
      </ul>
      <h3 class="mt-4 mb-2 text-lg font-semibold">Gaps 👀</h3>
      <ul>
        ${results.gaps.map((gap) => html`<li>${gap}</li>`)}
      </ul>
      <h3 class="mt-4 mb-2 text-lg font-semibold">Recommendations 🚀</h3>
      <ul>
        ${results.recommendations.map((recommendation) => html`<li>${recommendation}</li>`)}
      </ul>
    </div>
  `
}
