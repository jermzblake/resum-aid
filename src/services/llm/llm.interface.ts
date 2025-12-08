import type { JobMatchResult, ExtractionResult, WorkExperience } from '@/types'

export interface LLMTask {
  matchJob(resume: string, jobDescription: string): Promise<JobMatchResult>
  analyzeBullet(bullet: string): Promise<AsyncGenerator<string, void, unknown>>
  extractResumeData(text: string): Promise<ExtractionResult>
  generateAchievementBullets(context: WorkExperience & { company: string }): Promise<string[]>
}

export interface BulletAnalysis {
  original?: string
  score: number
  feedback: string
  improved: string
}
