import { html } from 'hono/html'

const NavLink = (href: string, label: string, icon: string, active: boolean) => {
  const activeClasses = active
    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'

  return html`
    <a
      href="${href}"
      hx-get="${href}"
      hx-target="#tool-content"
      hx-push-url="true"
      class="px-4 py-3 text-sm font-medium transition-colors ${activeClasses}"
    >
      ${icon} ${label}
    </a>
  `
}

export const NavigationComponent = (activeTab: string) => html`
  <nav class="px-6 flex gap-1 border-t border-gray-100">
    ${NavLink('/tools/job-matcher', 'Job Matcher', '🎯', activeTab === 'matcher')}
    ${NavLink('/tools/bullet-analyzer', 'Bullet Analyzer', '✨', activeTab === 'analyzer')}
    ${NavLink('/tools/resume-builder', 'Resume Builder', '📝', activeTab === 'builder')}
  </nav>
`
