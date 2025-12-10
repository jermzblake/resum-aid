import { html } from 'hono/html'
import { LoadingComponent } from '../components/loading.component'

export const ResumeUploadView = () => html`
  <div class="max-w-3xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">Resume Builder</h2>
        <p class="text-gray-600 mt-2">Step 1 of 3: Upload or paste your resume</p>
        <div class="mt-4 flex gap-2">
          <div class="flex-1 h-1 bg-[#15803D] rounded"></div>
          <div class="flex-1 h-1 bg-gray-300 rounded"></div>
          <div class="flex-1 h-1 bg-gray-300 rounded"></div>
        </div>
      </div>

      <!-- Tab toggle for upload vs paste (radio-driven) -->
      <div class="mb-6 border-b border-gray-200">
        <div class="sr-only" id="resume-tab-controls">Choose input method</div>
        <div class="flex" role="tablist" aria-labelledby="resume-tab-controls">
          <input id="tab-upload" type="radio" name="resume-tab" class="sr-only" checked />
          <label
            for="tab-upload"
            role="tab"
            aria-controls="upload-section"
            aria-selected="true"
            class="px-4 py-2 font-medium cursor-pointer text-[#15803D] border-b-2 border-[#15803D]"
          >
            📤 Upload File
          </label>

          <input id="tab-paste" type="radio" name="resume-tab" class="sr-only" />
          <label
            for="tab-paste"
            role="tab"
            aria-controls="paste-section"
            aria-selected="false"
            class="px-4 py-2 font-medium cursor-pointer text-gray-600"
          >
            📝 Paste Text
          </label>
        </div>
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
          <label for="resume-file" class="block text-sm font-medium text-gray-700 mb-2">Select Resume File</label>
          <input
            id="resume-file"
            type="file"
            name="resume"
            accept=".pdf,.docx"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus-visible:outline-none focus:ring-[#15803D] focus:border-[#15803D]"
          />
          <p class="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX</p>
        </div>

        <button
          type="submit"
          class="w-full bg-[#15803D] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#166534] transition-colors"
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
          <label for="resume-text" class="block text-sm font-medium text-gray-700 mb-2">Paste Your Resume</label>
          <textarea
            id="resume-text"
            name="text"
            rows="12"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus-visible:outline-none focus:ring-[#15803D] focus:border-[#15803D] font-mono text-sm"
            placeholder="Paste your resume text here. Include your name, experience, education, and skills..."
          ></textarea>
          <p class="text-sm text-gray-500 mt-1">Copy and paste from your resume, LinkedIn, or any text format</p>
        </div>

        <button
          type="submit"
          class="w-full bg-[#15803D] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#166534] transition-colors"
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
    ;(function () {
      const uploadTab = document.getElementById('tab-upload')
      const pasteTab = document.getElementById('tab-paste')
      const uploadSection = document.getElementById('upload-section')
      const pasteSection = document.getElementById('paste-section')
      const labels = Array.from(document.querySelectorAll('[role="tab"]'))

      function setActive(isUpload) {
        if (isUpload) {
          uploadSection.classList.remove('hidden')
          pasteSection.classList.add('hidden')
        } else {
          pasteSection.classList.remove('hidden')
          uploadSection.classList.add('hidden')
        }
        labels.forEach((label) => {
          const controls = label.getAttribute('aria-controls')
          const active = (isUpload && controls === 'upload-section') || (!isUpload && controls === 'paste-section')
          label.setAttribute('aria-selected', String(active))
          label.classList.toggle('text-[#15803D]', active)
          label.classList.toggle('border-b-2', active)
          label.classList.toggle('border-[#15803D]', active)
          label.classList.toggle('text-gray-600', !active)
        })
      }

      uploadTab?.addEventListener('change', () => setActive(true))
      pasteTab?.addEventListener('change', () => setActive(false))

      // Initialize state on load
      setActive(uploadTab?.checked ?? true)
    })()

    // No global SSE handlers; loader fragment wires SSE declaratively via sse-swap blocks
  </script>
`
