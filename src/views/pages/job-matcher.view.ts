import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const JobMatcherView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Job Matcher</h2>
      <p class="text-gray-600 mb-6">Upload your resume and paste a job description to see how well they match</p>

      <form
        hx-post="/api/match"
        hx-target="#match-result"
        hx-swap="innerHTML"
        hx-indicator="#loading-match"
        hx-encoding="multipart/form-data"
        class="space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Upload Resume</label>
          <input
            type="file"
            name="resume"
            accept=".pdf,.docx"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
          <textarea
            name="job_description"
            rows="8"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Paste the job description here..."
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyze Match
        </button>

        ${LoadingComponent('loading-match', 'Analyzing match score...')}
      </form>

      <div id="match-result" class="mt-8"></div>
    </div>
  </div>
`
