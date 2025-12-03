import { Hono } from 'hono'
import { MainLayout } from '@/views/layouts/main.layout'
import { LandingView } from '@/views/pages/landing.view'

export const registerLandingRoute = (app: Hono) => {
  app.get('/', async (c) => {
    const landingHtml = await LandingView()
    const html = MainLayout(landingHtml, 'home')
    return c.html(html)
  })
}
