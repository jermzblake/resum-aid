import { LLMService } from './llm.service'
import type { LLMTask, BulletAnalysis } from './llm.interface'
import type { ResumeInput, GeneratedResume, JobMatchResult } from '@/types'
import { matchJobPrompt, analyzeBulletsPrompt, analyzeBulletPrompt } from './prompts'

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

  async analyzeBullets(bullets: string[]): Promise<BulletAnalysis[]> {
    const systemPrompt = `You are an expert career coach and resume writer. Analyze each resume bullet point using the XYZ formula (Accomplished X as measured by Y by doing Z) to provide a score from 0 to 10, constructive feedback, and an improved version of the bullet point.`
    // const userPrompt = `Analyze the following resume bullet points:\n\n${bullets
    //   .map((b, i) => `${i + 1}. ${b}`)
    //   .join(
    //     '\n',
    //   )}\n\nProvide the analysis in the following JSON format:\n[\n  {\n    "original": "original bullet point",\n    "score": numeric score from 0 to 10,\n    "feedback": "constructive feedback",\n    "improved": "improved bullet point"\n  },\n  ...\n]`
    const userPrompt = analyzeBulletsPrompt(bullets)

    const response = await this.llmService.prompt(userPrompt, systemPrompt)
    const result = JSON.parse(response) as BulletAnalysis[]
    return result
  }

  async analyzeBullet(bullet: string): Promise<AsyncGenerator<string, void, unknown>> {
    const systemPrompt = `You are an expert career coach and resume writer. Analyze the resume bullet point using the XYZ formula (Accomplished X as measured by Y by doing Z) to provide a score from 0 to 10, constructive feedback, and an improved version of the bullet point. You do not need to make direct references to the formula in your response.`
    const userPrompt = analyzeBulletPrompt(bullet)
    // stream response
    const response = await this.llmService.promptStream(userPrompt, systemPrompt)
    return response
  }
}
