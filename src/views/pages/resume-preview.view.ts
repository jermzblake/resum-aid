import { html } from 'hono/html'

export const ResumePreviewView = (previewHtml: string) => html`
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">Preview & Download</h2>
        <p class="text-gray-600 mt-2">Step 3 of 3: Review your resume and download as PDF</p>
        <div class="mt-4 flex gap-2">
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="mb-6 flex gap-4 sticky top-0 bg-white z-10 py-4">
        <button
          type="button"
          hx-get="/api/resume/state"
          hx-target="#tool-content"
          hx-swap="innerHTML"
          class="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Edit
        </button>
        <button
          id="download-btn"
          hx-post="/api/resume/download"
          hx-swap="none"
          onclick="handleDownload(event)"
          class="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          📥 Download PDF
        </button>
      </div>

      <!-- Resume Preview -->
      <div id="resume-preview" class="bg-gray-50 p-6 rounded-lg border border-gray-200 overflow-auto max-h-[80vh]">
        ${html`${previewHtml}`}
      </div>

      <!-- Tips -->
      <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-900">
          <strong>💡 Tip:</strong> Your resume has been optimized for ATS (Applicant Tracking Systems). Make sure all
          information is accurate before downloading!
        </p>
      </div>
    </div>
  </div>

  <script>
    function handleDownload(event) {
      event.preventDefault()

      const btn = document.getElementById('download-btn')
      const originalText = btn.textContent
      btn.textContent = '⏳ Generating PDF...'
      btn.disabled = true

      // Use fetch to handle binary PDF response
      fetch('/api/resume/download', {
        method: 'POST',
      })
        .then((response) => {
          if (!response.ok) throw new Error('Download failed')
          return response.blob()
        })
        .then((blob) => {
          // Create download link
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'resume.pdf'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          // Clear localStorage after successful download
          localStorage.removeItem('resumeDraft')
          localStorage.removeItem('resumeStep')

          btn.textContent = '✅ Downloaded!'
          setTimeout(() => {
            btn.textContent = originalText
            btn.disabled = false
            // Redirect to home
            htmx.ajax('GET', '/', { target: '#tool-content', swap: 'innerHTML' })
          }, 2000)
        })
        .catch((error) => {
          console.error('Download error:', error)
          btn.textContent = '❌ Error'
          setTimeout(() => {
            btn.textContent = originalText
            btn.disabled = false
          }, 2000)
        })
    }

    // Track step in localStorage
    localStorage.setItem('resumeStep', '3')
  </script>
`
