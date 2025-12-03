import { html } from 'hono/html'

export const LoadingComponent = (id: string, message: string) => html`
  <div id="${id}" class="htmx-indicator text-center py-4">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <p class="text-gray-600 mt-2">${message}</p>
  </div>
`
