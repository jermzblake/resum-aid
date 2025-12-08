import { html } from 'hono/html'
import type { ParsedResume } from '@/types'

function Section({ title, children }: { title: string; children: any }) {
  return html`
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-gray-900 mb-2">${title}</h3>
      <div class="bg-white border border-gray-200 rounded-lg p-4">${children}</div>
    </div>
  `
}

export const ResumePreviewDataView = (resume: ParsedResume) => {
  const personal = resume.personalInfo || ({} as ParsedResume['personalInfo'])

  const personalBlock = html`
    <div>
      <div class="text-2xl font-bold">${personal.name || ''}</div>
      <div class="mt-1 text-gray-700 flex flex-wrap gap-3">
        ${personal.email ? html`<span>📧 ${personal.email}</span>` : ''}
        ${personal.phone ? html`<span>📞 ${personal.phone}</span>` : ''}
        ${personal.location ? html`<span>📍 ${personal.location}</span>` : ''}
        ${personal.linkedin
          ? html`<a class="text-blue-600 underline" href="${personal.linkedin}" target="_blank">LinkedIn</a>`
          : ''}
        ${personal.website
          ? html`<a class="text-blue-600 underline" href="${personal.website}" target="_blank">Website</a>`
          : ''}
      </div>
    </div>
  `

  const summaryBlock = html`
    ${resume.summary
      ? html`<p class="text-gray-800 leading-relaxed">${resume.summary}</p>`
      : html`<p class="text-gray-500">No summary provided.</p>`}
  `

  const workBlock = html`
    ${resume.workExperience && resume.workExperience.length
      ? resume.workExperience.map(
          (w) => html`
            <div class="mb-4">
              <div class="font-medium text-gray-900">
                ${w.title || ''} ${w.company ? html`· <span class="text-gray-700">${w.company}</span>` : ''}
              </div>
              <div class="text-sm text-gray-600">${[w.startDate, w.endDate].filter(Boolean).join(' — ')}</div>
              ${typeof w.teamSize === 'number'
                ? html`<div class="text-sm text-gray-600">Team size: ${w.teamSize}</div>`
                : ''}
              ${w.achievements && w.achievements.length
                ? html`<ul class="list-disc list-inside mt-2 text-gray-800">
                    ${w.achievements.map((b) => html`<li>${b}</li>`)}
                  </ul>`
                : ''}
              ${w.technologies && w.technologies.length
                ? html`<div class="mt-2 text-sm text-gray-700">
                    <span class="font-medium">Tech:</span> ${w.technologies.join(', ')}
                  </div>`
                : ''}
            </div>
          `,
        )
      : html`<p class="text-gray-500">No work experience listed.</p>`}
  `

  const educationBlock = html`
    ${resume.education && resume.education.length
      ? resume.education.map(
          (e) => html`
            <div class="mb-3">
              <div class="font-medium text-gray-900">
                ${e.degree || ''} ${e.institution ? html`· <span class="text-gray-700">${e.institution}</span>` : ''}
              </div>
              <div class="text-sm text-gray-600">${[e.graduationDate].filter(Boolean).join('')}</div>
              ${e.field ? html`<div class="text-sm text-gray-600">Field: ${e.field}</div>` : ''}
              ${e.gpa ? html`<div class="text-sm text-gray-600">GPA: ${e.gpa}</div>` : ''}
            </div>
          `,
        )
      : html`<p class="text-gray-500">No education listed.</p>`}
  `

  const skillsBlock = html`
    ${resume.skills && resume.skills.length
      ? html`<ul class="flex flex-wrap gap-2">
          ${resume.skills.map((s) => html`<li class="px-2 py-1 bg-gray-100 border border-gray-200 rounded">${s}</li>`)}
        </ul>`
      : html`<p class="text-gray-500">No skills listed.</p>`}
  `

  const certsBlock = html`
    ${resume.certifications && resume.certifications.length
      ? html`<ul class="list-disc list-inside">
          ${resume.certifications.map((c) => html`<li>${c}</li>`)}
        </ul>`
      : html`<p class="text-gray-500">No certifications listed.</p>`}
  `

  return html`
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

        <div class="mb-6 sticky top-0 bg-white z-10 py-4">
          <div class="text-sm text-gray-600 mb-2" role="note">
            After download, edit and re-download are disabled for this session.
          </div>
          <div class="flex gap-4 items-center">
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
              onclick="handleDownload(event)"
              class="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              📥 Download PDF
            </button>
            <button
              id="restart-btn"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onclick="htmx.ajax('GET','/tools/resume-builder',{ target: '#tool-content', swap: 'innerHTML' })"
            >
              Restart Builder
            </button>
          </div>
        </div>

        <div id="resume-preview" class="bg-gray-50 p-6 rounded-lg border border-gray-200 overflow-auto max-h-[80vh]">
          ${Section({ title: 'Personal Information', children: personalBlock })}
          ${Section({ title: 'Summary', children: summaryBlock })}
          ${Section({ title: 'Work Experience', children: workBlock })}
          ${Section({ title: 'Education', children: educationBlock })}
          ${Section({ title: 'Skills', children: skillsBlock })}
          ${Section({ title: 'Certifications', children: certsBlock })}
        </div>

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

        fetch('/api/resume/download', { method: 'POST' })
          .then((response) => {
            if (!response.ok) throw new Error('Download failed')
            return response.blob()
          })
          .then((blob) => {
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'resume.pdf'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            localStorage.removeItem('resumeDraft')
            localStorage.removeItem('resumeStep')

            // Post-download state: disable actions and show banner
            btn.textContent = '✅ Downloaded'
            const editBtn = document.querySelector('button[hx-get="/api/resume/state"]')
            if (editBtn) {
              editBtn.disabled = true
              editBtn.classList.add('opacity-50', 'cursor-not-allowed')
              editBtn.setAttribute('aria-disabled', 'true')
            }
            btn.classList.add('opacity-50', 'cursor-not-allowed')
            const banner = document.createElement('div')
            banner.className = 'mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded'
            banner.setAttribute('role', 'status')
            banner.textContent = 'Downloaded successfully. To make changes or download again, restart the builder.'
            const container = document.querySelector('.bg-white.rounded-lg.shadow-sm.border.border-gray-200.p-8')
            container?.appendChild(banner)
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

      localStorage.setItem('resumeStep', '3')
    </script>
  `
}
