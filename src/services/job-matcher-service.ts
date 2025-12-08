import { LLMTaskService } from '@/services/llm/llm.task.service'
import type { JobMatchResult, JobMatchInput } from '@/types'
import { extractResumeText } from '@/utils/resume-text'

export class JobMatcherService {
  private llmTaskService: LLMTaskService

  constructor(llmTaskService: LLMTaskService) {
    this.llmTaskService = llmTaskService
  }

  async matchJob(input: JobMatchInput): Promise<JobMatchResult> {
    if (!input.resumeFile) {
      throw new Error('Resume file is required')
    }
    let resumeText: string
    try {
      resumeText = await extractResumeText(input.resumeFile)
    } catch (error) {
      // Standardize error message expected by tests and consumers
      throw new Error('Failed to extract text from the resume file.')
    }

    return this.llmTaskService.matchJob(resumeText, input.jobDescription)
  }
}
