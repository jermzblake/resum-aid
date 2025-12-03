import { Context } from 'hono'
import type { JobMatcherService } from '@/services/job-matcher-service'
import { JobMatchResultsView } from '@/views/pages/job-match-results.view'

export class JobMatcherController {
  private jobMatcherService: JobMatcherService

  constructor(jobMatcherService: JobMatcherService) {
    this.jobMatcherService = jobMatcherService
  }

  async matchJob(ctx: Context) {
    try {
      const formData = await ctx.req.parseBody()
      const resumeFile = formData.resume as File
      const jobDescription = formData.job_description as string

      if (!resumeFile || !jobDescription) {
        return ctx.json({ error: 'Resume file and job description are required.' }, 400)
      }

      const results = await this.jobMatcherService.matchJob({
        resumeFile,
        jobDescription,
      })

      return ctx.html(JobMatchResultsView({ results }))
    } catch (error) {
      return ctx.json({ error: (error as Error).message }, 500)
    }
  }
}
