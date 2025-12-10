import { html } from 'hono/html'
import { NavigationComponent } from '../components/navigation.component'

export const MainLayout = (content: string, activeTab: string = 'home') => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Resume Tools - Resum-Aid</title>
      <link href="/style.css" rel="stylesheet" />
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/sse.js"></script>
    </head>
    <body class="bg-[#F0FDF4] min-h-screen">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-bold text-gray-900"><a href="/">Resum-Aid</a></h1>
          </div>

          <!-- Navigation Tabs -->
          ${NavigationComponent(activeTab)}
        </header>

        <!-- Main Content Area -->
        <main id="tool-content" class="p-6">${content}</main>
      </div>
    </body>

    <script>
      <!-- HTMX: Update active tab on navigation -->
      document.addEventListener('htmx:afterOnLoad', (e) => {
        const trigger = e.detail.xhr.getResponseHeader('HX-Trigger')
        if (!trigger) return
        let info
        try {
          info = JSON.parse(trigger)
        } catch {
          return
        }
        const tab = info.setActiveTab
        if (!tab) return
        const nav = document.querySelector('header nav')
        if (!nav) return

        const links = nav.querySelectorAll('a[href]')
        links.forEach((a) => {
          const isActive =
            (tab === 'matcher' && a.href.endsWith('/tools/job-matcher')) ||
            (tab === 'builder' && a.href.endsWith('/tools/resume-builder')) ||
            (tab === 'analyzer' && a.href.endsWith('/tools/bullet-analyzer'))

          a.classList.remove('text-[#15803D]', 'border-b-2', 'border-[#15803D]', 'bg-[#E6F4F1]')
          a.classList.remove('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50')

          if (isActive) {
            a.classList.add('text-[#15803D]', 'border-b-2', 'border-[#15803D]', 'bg-[#E6F4F1]')
          } else {
            a.classList.add('text-gray-600', 'hover:text-gray-900', 'hover:bg-gray-50')
          }
        })
      })

      <!-- Configure HTMX to swap error responses into targets -->
      document.addEventListener('DOMContentLoaded', () => {
        document.body.addEventListener('htmx:beforeSwap', (e) => {
          // Allow swapping for error status codes (4xx, 5xx)
          if (e.detail.xhr.status >= 400) {
            e.detail.shouldSwap = true
            e.detail.isError = false
          }
        })
      })
    </script>
  </html>
`
