import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { LLMTaskService } from '@/services/llm/llm.task.service'
import type { LLMService } from '@/services/llm/llm.service'
import type { JobMatchResult } from '@/types'

describe('LLMTaskService', () => {
  let llmTaskService: LLMTaskService
  let mockLLMService: LLMService

  beforeEach(() => {
    // Create mock LLMService
    mockLLMService = {
      prompt: mock(async () => '{"score": 85, "strengths": [], "gaps": [], "recommendations": []}'),
    } as unknown as LLMService

    llmTaskService = new LLMTaskService(mockLLMService)
  })

  describe('matchJob', () => {
    const resumeText = `
      John Doe
      Senior Software Engineer
      
      Experience:
      - 5 years of JavaScript development
      - React, Node.js, TypeScript
      - Built scalable web applications
      
      Education:
      - BS Computer Science
    `

    const jobDescription = `
      We are looking for a Senior Software Engineer with:
      - 5+ years of experience
      - Strong JavaScript/TypeScript skills
      - Experience with React and Node.js
      - Cloud deployment experience (AWS/Azure)
    `

    it('should successfully match a resume with a job description', async () => {
      const mockResponse = JSON.stringify({
        score: 85,
        strengths: ['Strong JavaScript/TypeScript experience', '5 years of relevant experience'],
        gaps: ['No cloud deployment experience mentioned'],
        recommendations: ['Add AWS or Azure certifications', 'Highlight any cloud projects'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob(resumeText, jobDescription)

      expect(result).toBeDefined()
      expect(result.score).toBe(85)
      expect(result.strengths).toBeArrayOfSize(2)
      expect(result.gaps).toBeArrayOfSize(1)
      expect(result.recommendations).toBeArrayOfSize(2)
      expect(mockLLMService.prompt).toHaveBeenCalledTimes(1)
    })

    it('should call LLMService with correct prompts', async () => {
      const mockResponse = JSON.stringify({
        score: 90,
        strengths: ['Excellent match'],
        gaps: [],
        recommendations: ['Apply now!'],
      })

      mockLLMService.prompt = mock(async (userPrompt: string, systemPrompt: string) => mockResponse)

      await llmTaskService.matchJob(resumeText, jobDescription)

      expect(mockLLMService.prompt).toHaveBeenCalledTimes(1)

      const callArgs = (mockLLMService.prompt as any).mock.calls[0]
      const [userPrompt, systemPrompt] = callArgs

      expect(systemPrompt).toContain('expert career coach')
      expect(systemPrompt).toContain('job matching specialist')
      expect(userPrompt).toContain(resumeText)
      expect(userPrompt).toContain(jobDescription)
      expect(userPrompt).toContain('JSON format')
    })

    it('should parse JSON response correctly', async () => {
      const mockResponse = JSON.stringify({
        score: 75,
        strengths: ['Good technical skills', 'Relevant experience', 'Strong education'],
        gaps: ['Missing leadership experience', 'No cloud certifications'],
        recommendations: ['Obtain AWS certification', 'Highlight any team leadership', 'Add more specific metrics'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob(resumeText, jobDescription)

      expect(result.score).toBe(75)
      expect(result.strengths).toBeArrayOfSize(3)
      expect(result.gaps).toBeArrayOfSize(2)
      expect(result.recommendations).toBeArrayOfSize(3)
      expect(result.strengths[0]).toBe('Good technical skills')
    })

    it('should handle perfect match score', async () => {
      const mockResponse = JSON.stringify({
        score: 100,
        strengths: ['Perfect match in all areas'],
        gaps: [],
        recommendations: ['No improvements needed'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob(resumeText, jobDescription)

      expect(result.score).toBe(100)
      expect(result.gaps).toBeArrayOfSize(0)
    })

    it('should handle low match score', async () => {
      const mockResponse = JSON.stringify({
        score: 20,
        strengths: ['Basic programming knowledge'],
        gaps: ['Missing all required skills', 'No relevant experience', 'Wrong field'],
        recommendations: ['Consider different position', 'Gain required skills', 'Take relevant courses'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob(resumeText, jobDescription)

      expect(result.score).toBe(20)
      expect(result.gaps.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should handle malformed JSON response', async () => {
      mockLLMService.prompt = mock(async () => 'Invalid JSON response')

      await expect(llmTaskService.matchJob(resumeText, jobDescription)).rejects.toThrow()
    })

    it('should handle empty resume text', async () => {
      const mockResponse = JSON.stringify({
        score: 0,
        strengths: [],
        gaps: ['No information provided'],
        recommendations: ['Please provide resume details'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob('', jobDescription)

      expect(result.score).toBe(0)
      expect(mockLLMService.prompt).toHaveBeenCalled()
    })

    it('should handle empty job description', async () => {
      const mockResponse = JSON.stringify({
        score: 50,
        strengths: ['Good resume'],
        gaps: ['Cannot evaluate without job requirements'],
        recommendations: ['Please provide job description'],
      })

      mockLLMService.prompt = mock(async () => mockResponse)

      const result = await llmTaskService.matchJob(resumeText, '')

      expect(result).toBeDefined()
      expect(mockLLMService.prompt).toHaveBeenCalled()
    })

    it('should handle LLM service errors', async () => {
      mockLLMService.prompt = mock(async () => {
        throw new Error('LLM service unavailable')
      })

      await expect(llmTaskService.matchJob(resumeText, jobDescription)).rejects.toThrow('LLM service unavailable')
    })

    it('should handle response with extra whitespace', async () => {
      const mockResponse = `
        
        {
          "score": 80,
          "strengths": ["Good fit"],
          "gaps": ["Minor gaps"],
          "recommendations": ["Keep improving"]
        }
        
      `

      mockLLMService.prompt = mock(async () => mockResponse.trim())

      const result = await llmTaskService.matchJob(resumeText, jobDescription)

      expect(result.score).toBe(80)
      expect(result).toHaveProperty('strengths')
      expect(result).toHaveProperty('gaps')
      expect(result).toHaveProperty('recommendations')
    })
  })
})
