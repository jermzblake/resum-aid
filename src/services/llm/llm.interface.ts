import type { ResumeInput, GeneratedResume, JobMatchResult } from '@/types'

export interface LLMTask {
  matchJob(resume: string, jobDescription: string): Promise<JobMatchResult>
  analyzeBullet(bullet: string): Promise<AsyncGenerator<string, void, unknown>>
}

export interface BulletAnalysis {
  original?: string
  score: number
  feedback: string
  improved: string
}
