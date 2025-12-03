import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { registerLandingRoute } from './routes/landing.route'

export const createApp = () => {
  const app = new Hono()

  app.use('/*', serveStatic({ root: './public' }))

  registerLandingRoute(app)

  return app
}
