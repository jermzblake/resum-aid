import { LLMService } from './llm.service'
import type { LLMTask } from './llm.interface'
import type { JobMatchResult, ExtractionResult, WorkExperience } from '@/types'
import { matchJobPrompt, analyzeBulletPrompt, extractResumePrompt, generateBulletsPrompt } from './prompts'
import { LLMExtractionResponseSchema, BulletsResponseSchema } from '@/types'
import { parseJsonResponse } from './response-utils'

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

  async analyzeBullet(bullet: string): Promise<AsyncGenerator<string, void, unknown>> {
    const systemPrompt = `You are an expert career coach and resume writer. Analyze the resume bullet point using the XYZ formula (Accomplished X as measured by Y by doing Z) to provide a score from 0 to 10, constructive feedback, and an improved version of the bullet point. You do not need to make direct references to the formula in your response.`
    const userPrompt = analyzeBulletPrompt(bullet)
    const response = await this.llmService.promptStream(userPrompt, systemPrompt)
    return response
  }

  async extractResumeData(resumeText: string): Promise<ExtractionResult> {
    const systemPrompt = `You are an expert resume parser and analyzer. Extract and structure resume information accurately, identifying gaps and suggesting improvements. Be thorough in extraction but realistic about what's present in the text.`
    const userPrompt = extractResumePrompt(resumeText)
    const response = await this.llmService.prompt(userPrompt, systemPrompt)

    const validated = parseJsonResponse(response, LLMExtractionResponseSchema, {
      stripCodeFences: true,
      requireJsonOnly: true,
    })

    return {
      resume: validated.resume,
      gaps: validated.gaps,
      extractionNotes: validated.extractionNotes,
    }
  }

  async generateAchievementBullets(context: WorkExperience & { company: string }): Promise<string[]> {
    const systemPrompt = `You are an expert resume writer specializing in creating impactful, quantifiable achievement statements using the XYZ formula (Accomplished X as measured by Y by doing Z). Your bullets are ATS-friendly and compelling to recruiters.`

    const userPrompt = generateBulletsPrompt({
      title: context.title,
      company: context.company,
      description: context.achievements.join('; ') || 'General job responsibilities',
    })

    const response = await this.llmService.prompt(userPrompt, systemPrompt)
    const validated = parseJsonResponse(response, BulletsResponseSchema, {
      stripCodeFences: true,
      requireJsonOnly: true,
    })
    return validated.bullets
  }
}
