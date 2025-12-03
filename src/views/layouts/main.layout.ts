import { html } from 'hono/html'
import { NavigationComponent } from '../components/navigation.component'

export const MainLayout = (content: string, activeTab: string = 'home') => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Resume Helper</title>
      <link href="/style.css" rel="stylesheet" />
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    </head>
    <body class="bg-gray-50 min-h-screen">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="px-6 py-4">
            <h1 class="text-2xl font-bold text-gray-900">Resume Helper</h1>
          </div>

          <!-- Navigation Tabs -->
          ${NavigationComponent(activeTab)}
        </header>

        <!-- Main Content Area -->
        <main id="tool-content" class="p-6">${content}</main>
      </div>
    </body>
  </html>
`
