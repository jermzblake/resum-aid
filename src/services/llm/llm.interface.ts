import type { ResumeInput, GeneratedResume, JobMatchResult } from '@/types'

export interface LLMTask {
  matchJob(resume: string, jobDescription: string): Promise<JobMatchResult>
}

export interface BulletAnalysis {
  original: string
  score: number
  feedback: string
  improved: string
}
