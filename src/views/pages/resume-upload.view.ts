import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const ResumeUploadView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">Resume Builder</h2>
        <p class="text-gray-600 mt-2">Step 1 of 3: Upload or paste your resume</p>
        <div class="mt-4 flex gap-2">
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
          <div class="flex-1 h-1 bg-gray-300 rounded"></div>
          <div class="flex-1 h-1 bg-gray-300 rounded"></div>
        </div>
      </div>

      <!-- Tab toggle for upload vs paste -->
      <div class="mb-6 flex border-b border-gray-200">
        <button
          type="button"
          class="px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600 focus:outline-none"
          onclick="document.getElementById('upload-section').classList.remove('hidden'); document.getElementById('paste-section').classList.add('hidden'); this.classList.add('border-b-2', 'border-blue-600', 'text-blue-600'); document.querySelector('[data-paste-tab]').classList.remove('border-b-2', 'border-blue-600', 'text-blue-600'); document.querySelector('[data-paste-tab]').classList.add('text-gray-600');"
        >
          📤 Upload File
        </button>
        <button
          type="button"
          data-paste-tab
          class="px-4 py-2 font-medium text-gray-600 focus:outline-none"
          onclick="document.getElementById('paste-section').classList.remove('hidden'); document.getElementById('upload-section').classList.add('hidden'); this.classList.add('border-b-2', 'border-blue-600', 'text-blue-600'); document.querySelector(':not([data-paste-tab])').classList.remove('border-b-2', 'border-blue-600'); document.querySelector(':not([data-paste-tab])').classList.add('text-gray-600');"
        >
          📝 Paste Text
        </button>
      </div>

      <!-- Upload Section -->
      <form
        id="upload-section"
        hx-post="/api/resume/init-parse"
        hx-target="#parse-result"
        hx-swap="innerHTML"
        hx-encoding="multipart/form-data"
        class="space-y-6"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Resume File</label>
          <input
            type="file"
            name="resume"
            accept=".pdf,.docx"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX</p>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Parse Resume
        </button>

        ${LoadingComponent('upload-loading', 'Parsing your resume...')}
      </form>

      <!-- Paste Section -->
      <form
        id="paste-section"
        class="hidden space-y-6"
        hx-post="/api/resume/init-parse"
        hx-target="#parse-result"
        hx-swap="innerHTML"
        hx-encode="json"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Paste Your Resume</label>
          <textarea
            name="text"
            rows="12"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Paste your resume text here. Include your name, experience, education, and skills..."
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">Copy and paste from your resume, LinkedIn, or any text format</p>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Parse Resume
        </button>

        ${LoadingComponent('paste-loading', 'Parsing your resume...')}
      </form>

      <!-- Parse Result / Progress -->
      <div id="parse-result" class="mt-8"></div>
    </div>
  </div>

  <script>
    // No global SSE handlers; loader fragment wires SSE declaratively via sse-swap blocks
  </script>
`
