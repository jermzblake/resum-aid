import { html } from 'hono/html'

export const ToolComponent = (name: string, description: string, href: string, icon: string) => html`
  <a
    href="${href}"
    class="block rounded-lg shadow-sm bg-white hover:bg-gray-50 p-4 border border-gray-200 transition-colors"
  >
    <h3 class="text-lg font-medium text-gray-900"><span>${icon}</span> ${name}</h3>
    <p class="mt-2 text-sm text-gray-600">${description}</p>
  </a>
`
