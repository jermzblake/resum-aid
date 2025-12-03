import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { registerLandingRoute } from './routes/landing.route'
import { registerJobMatchRoute } from './routes/job-matcher.route'
import { registerBulletAnalyzerRoute } from './routes/bullet-analyzer.route'
import { registerResumeBuilderRoute } from './routes/resume-builder.route'
import { LLMFactory } from './providers/llm-factory'
import type { LLMService } from '@/services/llm/llm.service'
import { LLMTaskService } from '@/services/llm/llm.task.service'
import { JobMatcherController } from '@/controllers/job-matcher.controller'
import { JobMatcherService } from '@/services/job-matcher-service'

export const createApp = () => {
  const app = new Hono()

  app.use('/*', serveStatic({ root: './public' }))

  // Dependencies
  const llmService: LLMService = LLMFactory.createOllama()
  const llmTaskService = new LLMTaskService(llmService)
  const jobMatcherService = new JobMatcherService(llmTaskService)

  const jobMatcherController = new JobMatcherController(jobMatcherService)

  // Mount routes
  registerLandingRoute(app)
  registerJobMatchRoute(app, jobMatcherController)
  registerBulletAnalyzerRoute(app)
  registerResumeBuilderRoute(app)

  return app
}
