import { Hono } from 'hono'
import { JobMatcherView } from '@/views/pages/job-matcher.view'
import { MainLayout } from '@/views/layouts/main.layout'
import type { JobMatcherController } from '@/controllers/job-matcher.controller'

export const registerJobMatchRoute = (app: Hono, controller: JobMatcherController) => {
  app.get('/tools/job-matcher', async (c) => {
    const jobMatcherHtml = await JobMatcherView()
    // If it's an HTMX request, return just the content
    if (c.req.header('HX-Request')) {
      c.header('HX-Trigger', JSON.stringify({ setActiveTab: 'matcher' }))
      return c.html(jobMatcherHtml)
    }

    // Otherwise return the full layout (for direct navigation)
    return c.html(MainLayout(jobMatcherHtml, 'matcher'))
  })
}
