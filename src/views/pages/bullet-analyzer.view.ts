import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const BulletAnalyzerView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Bullet Point Analyzer</h2>
      <p class="text-gray-600 mb-6">
        Paste your resume bullet point to get AI-powered feedback on clarity, impact, and quality
      </p>

      <form
        hx-post="/api/init-bullet-stream"
        hx-target="#analysis-result"
        hx-indicator="#loading-analysis"
        hx-swap="innerHTML"
        class="space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bullet Point</label>
          <textarea
            name="bullet"
            rows="3"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="• Led a team of 5 engineers to develop a new feature that increased user engagement by 15% within the first quarter."
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyze Bullet
        </button>

        ${LoadingComponent('loading-analysis', 'Analyzing your bullet point...')}
      </form>

      <div id="analysis-result" class="mt-8">
        <p class="text-sm text-gray-500 mt-4">Analysis will appear here after submission.</p>
      </div>
    </div>
  </div>
`
