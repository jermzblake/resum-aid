import { describe, it, expect, beforeEach } from 'bun:test'
import { JobMatcherService } from '@/services/job-matcher-service'
import type { LLMTaskService } from '@/services/llm/llm.task.service'
import type { JobMatchInput, JobMatchResult } from '@/types'

function createMockFile(content: string, type: string = 'application/pdf', name: string = 'resume.pdf'): File {
  return new File([content], name, { type })
}

describe('JobMatcherService Integration', () => {
  let jobMatcherService: JobMatcherService
  let mockLLMTaskService: LLMTaskService

  beforeEach(() => {
    mockLLMTaskService = {
      matchJob: async () => ({
        score: 85,
        strengths: ['Strong technical skills'],
        gaps: ['Missing certifications'],
        recommendations: ['Add AWS certification'],
      }),
    } as unknown as LLMTaskService
    jobMatcherService = new JobMatcherService(mockLLMTaskService)
    // Mock extractResumeText for all tests
    jobMatcherService['extractResumeText'] = async (file: File) => {
      if (
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        if (file.size === 0) throw new Error('Failed to extract text from the resume file.')
        return 'Extracted resume text'
      } else if (file.type === 'text/plain') {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
      } else {
        throw new Error('Failed to extract text from the resume file.')
      }
    }
  })

  it('should match a valid PDF resume with job description', async () => {
    const pdfContent = 'Mock PDF content with experience and skills'
    const resumeFile = createMockFile(pdfContent, 'application/pdf')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer with 5+ years experience',
    }
    const result = await jobMatcherService.matchJob(input)
    expect(result).toHaveProperty('score')
    expect(result.strengths.length).toBeGreaterThan(0)
    expect(result.gaps.length).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeGreaterThan(0)
  })

  it('should match a valid DOCX resume with job description', async () => {
    const docxContent = 'Mock DOCX content with experience and skills'
    const resumeFile = createMockFile(
      docxContent,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'resume.docx',
    )
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer with 5+ years experience',
    }
    const result = await jobMatcherService.matchJob(input)
    expect(result).toHaveProperty('score')
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('should throw error for unsupported file type', async () => {
    const txtContent = 'Plain text resume'
    const resumeFile = createMockFile(txtContent, 'text/plain', 'resume.txt')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer',
    }
    await expect(jobMatcherService.matchJob(input)).rejects.toThrow('Failed to extract text from the resume file.')
  })

  it('should handle empty resume file', async () => {
    const resumeFile = createMockFile('', 'application/pdf')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer',
    }
    await expect(jobMatcherService.matchJob(input)).rejects.toThrow('Failed to extract text from the resume file.')
  })

  it('should propagate LLM service errors', async () => {
    mockLLMTaskService.matchJob = async () => {
      throw new Error('LLM service unavailable')
    }
    const pdfContent = 'Mock PDF content with experience and skills'
    const resumeFile = createMockFile(pdfContent, 'application/pdf')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer',
    }
    await expect(jobMatcherService.matchJob(input)).rejects.toThrow('LLM service unavailable')
  })

  it('should handle large resume files', async () => {
    const largeContent = 'Experience '.repeat(10000)
    const resumeFile = createMockFile(largeContent, 'application/pdf')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: 'Looking for a senior developer',
    }
    const result = await jobMatcherService.matchJob(input)
    expect(result).toHaveProperty('score')
  })

  it('should handle missing job description', async () => {
    const pdfContent = 'Mock PDF content with experience and skills'
    const resumeFile = createMockFile(pdfContent, 'application/pdf')
    const input: JobMatchInput = {
      resumeFile,
      jobDescription: '',
    }
    const result = await jobMatcherService.matchJob(input)
    expect(result).toHaveProperty('score')
  })
})
