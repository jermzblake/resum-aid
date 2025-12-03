import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { registerLandingRoute } from './routes/landing.route'
import { registerJobMatchRoute } from './routes/job-matcher.route'
import { registerBulletAnalyzerRoute } from './routes/bullet-analyzer.route'
import { registerResumeBuilderRoute } from './routes/resume-builder.route'

export const createApp = () => {
  const app = new Hono()

  app.use('/*', serveStatic({ root: './public' }))

  registerLandingRoute(app)
  registerJobMatchRoute(app)
  registerBulletAnalyzerRoute(app)
  registerResumeBuilderRoute(app)

  return app
}
