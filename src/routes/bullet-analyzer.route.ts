import { Hono } from 'hono'
import { BulletAnalyzerView } from '@/views/pages/bullet-analyzer.view'
import { MainLayout } from '@/views/layouts/main.layout'

export const registerBulletAnalyzerRoute = (app: Hono) => {
  app.get('/tools/bullet-analyzer', async (c) => {
    const bulletAnalyzerHtml = await BulletAnalyzerView()
    // If it's an HTMX request, return just the content
    if (c.req.header('HX-Request')) {
      c.header('HX-Trigger', JSON.stringify({ setActiveTab: 'analyzer' }))
      return c.html(bulletAnalyzerHtml)
    }

    // Otherwise return the full layout (for direct navigation)
    return c.html(MainLayout(bulletAnalyzerHtml, 'analyzer'))
  })
}
