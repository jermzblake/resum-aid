import { html } from 'hono/html'
import type { ParsedResume, ResumeGap } from '@/types'

interface ResumeGapsViewProps {
  resume: ParsedResume
  gaps: ResumeGap[]
  extractionNotes: string
}

export const ResumeGapsView = ({ resume, gaps, extractionNotes }: ResumeGapsViewProps) => html`
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-gray-900">Review & Fill Gaps</h2>
        <p class="text-gray-600 mt-2">Step 2 of 3: Review your resume and fill in missing information</p>
        <div class="mt-4 flex gap-2">
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
          <div class="flex-1 h-1 bg-blue-600 rounded"></div>
          <div class="flex-1 h-1 bg-gray-300 rounded"></div>
        </div>
      </div>

      <!-- Extraction Notes -->
      ${extractionNotes
        ? html`
            <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p class="text-sm text-amber-900"><strong>📝 Notes:</strong> ${extractionNotes}</p>
            </div>
          `
        : ''}

      <!-- Gaps Alert -->
      ${gaps.length > 0
        ? html`
            <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-900">
                <strong>🔍 Found ${gaps.length} gap${gaps.length !== 1 ? 's' : ''}:</strong><br />
                ${gaps.map(
                  (g) => html`<div class="mt-1">• <strong>${g.field}</strong> in ${g.section} - ${g.message}</div>`,
                )}
              </p>
            </div>
          `
        : html`
            <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-900">
                <strong>✅ Great!</strong> No major gaps detected. Feel free to add more details.
              </p>
            </div>
          `}

      <!-- Edit Form -->
      <form id="gaps-form" hx-put="/api/resume/update" hx-target="#gaps-result" hx-swap="innerHTML" class="space-y-8">
        <!-- Personal Info Section -->
        <fieldset class="border border-gray-200 rounded-lg p-6">
          <legend class="text-lg font-semibold text-gray-900 px-2">Personal Information</legend>
          <div class="space-y-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="personalInfo.name"
                value="${resume.personalInfo.name}"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="personalInfo.email"
                  value="${resume.personalInfo.email || ''}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="personalInfo.phone"
                  value="${resume.personalInfo.phone || ''}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="personalInfo.location"
                  value="${resume.personalInfo.location || ''}"
                  placeholder="City, State"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  name="personalInfo.linkedin"
                  value="${resume.personalInfo.linkedin || ''}"
                  placeholder="https://linkedin.com/in/yourprofile"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Professional Summary -->
        <fieldset class="border border-gray-200 rounded-lg p-6">
          <legend class="text-lg font-semibold text-gray-900 px-2">Professional Summary</legend>
          <textarea
            name="summary"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-4"
            placeholder="A brief professional summary or headline (2-3 sentences)"
          >
${resume.summary || ''}</textarea
          >
        </fieldset>

        <!-- Work Experience -->
        ${resume.workExperience.length > 0
          ? html`
              <fieldset class="border border-gray-200 rounded-lg p-6">
                <legend class="text-lg font-semibold text-gray-900 px-2">Work Experience</legend>
                <div class="space-y-6 mt-4">
                  ${resume.workExperience.map(
                    (job, idx) => html`
                      <div class="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            name="workExperience[${idx}].company"
                            value="${job.company}"
                            placeholder="Company"
                            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <input
                            type="text"
                            name="workExperience[${idx}].title"
                            value="${job.title}"
                            placeholder="Job Title"
                            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            name="workExperience[${idx}].startDate"
                            value="${job.startDate}"
                            placeholder="Start Date (e.g., 2020-01)"
                            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <input
                            type="text"
                            name="workExperience[${idx}].endDate"
                            value="${job.endDate || ''}"
                            placeholder="End Date (leave empty if current)"
                            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                          <input
                            type="number"
                            name="workExperience[${idx}].teamSize"
                            value="${job.teamSize || ''}"
                            placeholder="Team Size (optional)"
                            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <textarea
                          name="workExperience[${idx}].achievements"
                          rows="3"
                          placeholder="Add achievements (one per line)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
${job.achievements.join('\n')}</textarea
                        >
                      </div>
                    `,
                  )}
                </div>
              </fieldset>
            `
          : ''}

        <!-- Skills -->
        ${resume.skills.length > 0
          ? html`
              <fieldset class="border border-gray-200 rounded-lg p-6">
                <legend class="text-lg font-semibold text-gray-900 px-2">Skills</legend>
                <textarea
                  name="skills"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mt-4 text-sm"
                  placeholder="Skills separated by commas"
                >
${resume.skills.join(', ')}</textarea
                >
              </fieldset>
            `
          : ''}

        <div class="flex gap-4">
          <button
            type="button"
            hx-get="/tools/resume-builder"
            hx-target="#tool-content"
            hx-swap="innerHTML"
            class="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
          <button
            type="button"
            hx-get="/api/resume/preview"
            hx-target="#tool-content"
            hx-swap="innerHTML"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Preview →
          </button>
        </div>
      </form>

      <div id="gaps-result"></div>
    </div>
  </div>

  <script>
    // Auto-save changes to server on blur
    document.addEventListener(
      'blur',
      (e) => {
        if (e.target.matches('input, textarea')) {
          const form = e.target.closest('form')
          if (form && form.id === 'gaps-form') {
            const formData = new FormData(form)
            const updates = Object.fromEntries(formData)

            // Debounce save with localStorage
            localStorage.setItem('resumeDraft', JSON.stringify(updates))
            localStorage.setItem('resumeStep', '2')
          }
        }
      },
      true,
    )
  </script>
`
