import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const ResumeBuilderView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Resume Builder</h2>
      <p class="text-gray-600 mb-6">Let's create your professional resume step by step</p>

      <form
        hx-post="/api/resume/generate"
        hx-target="#result"
        hx-swap="innerHTML"
        hx-indicator="#loading-result"
        class="space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
          <textarea
            name="experience"
            rows="6"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your work experience..."
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate Resume
        </button>

        ${LoadingComponent('loading-result', 'Generating your resume...')}
      </form>

      <div id="result" class="mt-8"></div>
    </div>
  </div>
`
