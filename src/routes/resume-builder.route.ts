import { Hono } from 'hono'
import { ResumeBuilderView } from '@/views/pages/resume-builder.view'
import { MainLayout } from '@/views/layouts/main.layout'

export const registerResumeBuilderRoute = (app: Hono) => {
  app.get('/tools/resume-builder', async (c) => {
    const resumeBuilderHtml = await ResumeBuilderView()
    // If it's an HTMX request, return just the content
    if (c.req.header('HX-Request')) {
      c.header('HX-Trigger', JSON.stringify({ setActiveTab: 'builder' }))
      return c.html(resumeBuilderHtml)
    }

    // Otherwise return the full layout (for direct navigation)
    return c.html(MainLayout(resumeBuilderHtml, 'builder'))
  })
}
