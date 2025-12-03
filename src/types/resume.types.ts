export interface ResumeInput {
  name: string
  experience: string
  education?: string
  skills?: string[]
}

export interface GeneratedResume {
  content: string
  format: 'html' | 'pdf'
  metadata: {
    generatedAt: Date
    template: string
  }
}
