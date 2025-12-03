import { LLMService } from './llm.service'
import type { LLMTask } from './llm.interface'
import type { ResumeInput, GeneratedResume, JobMatchResult } from '@/types'
import { matchJobPrompt } from './prompts'

export class LLMTaskService implements LLMTask {
  private llmService: LLMService

  constructor(llmService: LLMService) {
    this.llmService = llmService
  }

  async matchJob(resumeText: string, jobDescription: string): Promise<JobMatchResult> {
    const systemPrompt = `You are an expert career coach and job matching specialist. Analyze resumes against job descriptions to provide a match score, identify strengths and gaps, and offer actionable recommendations.`

    const userPrompt = matchJobPrompt(resumeText, jobDescription)

    const response = await this.llmService.prompt(userPrompt, systemPrompt)
    const result = JSON.parse(response) as JobMatchResult
    return result
  }
}
