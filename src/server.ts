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
import { BulletAnalyzerController } from '@/controllers/bullet-analyzer.controller'
import { BulletAnalyzerService } from '@/services/bullet-analyzer.service'
import { ResumeBuilderController } from '@/controllers/resume-builder.controller'
import { ResumeBuilderService } from '@/services/resume-builder.service'
import { PDFGeneratorService } from '@/services/pdf-generator.service'

export const createApp = () => {
  const app = new Hono()

  app.use('/*', serveStatic({ root: './public' }))

  // Dependencies
  const llmService: LLMService = LLMFactory.createFromEnv()
  const llmTaskService = new LLMTaskService(llmService)
  const jobMatcherService = new JobMatcherService(llmTaskService)
  const bulletAnalyzerService = new BulletAnalyzerService(llmTaskService)
  const pdfGeneratorService = new PDFGeneratorService()
  const resumeBuilderService = new ResumeBuilderService(llmTaskService, {
    pdfGeneratorService,
  })

  const jobMatcherController = new JobMatcherController(jobMatcherService)
  const bulletAnalyzerController = new BulletAnalyzerController(bulletAnalyzerService)
  const resumeBuilderController = new ResumeBuilderController(resumeBuilderService, pdfGeneratorService)

  // Mount routes
  registerLandingRoute(app)
  registerJobMatchRoute(app, jobMatcherController)
  registerBulletAnalyzerRoute(app, bulletAnalyzerController)
  registerResumeBuilderRoute(app, resumeBuilderController)

  return app
}
