import { Context } from 'hono'
import type { JobMatcherService } from '@/services/job-matcher-service'
import { JobMatchResultsView } from '@/views/pages/job-match-results.view'
import { ErrorComponent } from '@/views/components/error.component'

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
        return ctx.html(
          ErrorComponent({
            title: 'Invalid Input',
            message: 'Resume file and job description are required.',
            status: 400,
          }),
          400,
        )
      }

      const results = await this.jobMatcherService.matchJob({
        resumeFile,
        jobDescription,
      })

      return ctx.html(JobMatchResultsView({ results }))
    } catch (error) {
      const message = (error as Error).message
      return ctx.html(ErrorComponent({ title: 'Job Match Error', message, status: 500 }), 500)
    }
  }
}
