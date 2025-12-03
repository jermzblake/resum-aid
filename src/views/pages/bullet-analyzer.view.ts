import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const BulletAnalyzerView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Bullet Point Analyzer</h2>
      <p class="text-gray-600 mb-6">Paste your resume bullet points to get AI-powered feedback on quality and impact</p>

      <form
        hx-post="/api/analyze-bullets"
        hx-target="#analysis-result"
        hx-indicator="#loading-analysis"
        hx-swap="innerHTML"
        class="space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bullet Points</label>
          <textarea
            name="bullets"
            rows="10"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="• Managed team projects
- Increased sales by 20%
- Developed new features"
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">Enter one bullet point per line</p>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyze Quality
        </button>

        ${LoadingComponent('loading-analysis', 'Analyzing your bullet points...')}
      </form>

      <div id="analysis-result" class="mt-8"></div>
    </div>
  </div>
`
