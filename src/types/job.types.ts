export interface JobMatchInput {
  resumeFile: File
  jobDescription: string
}

export interface JobMatchResult {
  score: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
}
