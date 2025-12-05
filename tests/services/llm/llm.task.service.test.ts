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

  describe('analyzeBullet', () => {
    const testBullet = 'Led team to deliver project on time and under budget'

    it('should successfully stream bullet analysis', async () => {
      async function* mockStream() {
        yield '{"score": 8,'
        yield ' "feedback": "Good quantification",'
        yield ' "improved": "Led team of 5 engineers to deliver project 2 weeks ahead of schedule and 15% under budget"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet(testBullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual([
        '{"score": 8,',
        ' "feedback": "Good quantification",',
        ' "improved": "Led team of 5 engineers to deliver project 2 weeks ahead of schedule and 15% under budget"}',
      ])
      expect(mockLLMService.promptStream).toHaveBeenCalledTimes(1)
    })

    it('should call LLMService.promptStream with correct prompts', async () => {
      async function* mockStream() {
        yield '{"score": 9, "feedback": "Excellent", "improved": "Better version"}'
      }

      mockLLMService.promptStream = mock(async (userPrompt: string, systemPrompt: string) => mockStream())

      await llmTaskService.analyzeBullet(testBullet)

      expect(mockLLMService.promptStream).toHaveBeenCalledTimes(1)

      const callArgs = (mockLLMService.promptStream as any).mock.calls[0]
      const [userPrompt, systemPrompt] = callArgs

      expect(systemPrompt).toContain('expert career coach')
      expect(systemPrompt).toContain('resume writer')
      expect(userPrompt).toContain(testBullet)
      expect(userPrompt).toContain('JSON')
      expect(userPrompt).toContain('score')
      expect(userPrompt).toContain('feedback')
      expect(userPrompt).toContain('improved')
    })

    it('should stream complete JSON response in chunks', async () => {
      async function* mockStream() {
        yield '{'
        yield '\n  "score": 10,'
        yield '\n  "feedback": "Perfect bullet point",'
        yield '\n  "improved": "Optimized system performance by 40%"'
        yield '\n}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet(testBullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      expect(fullResponse).toContain('"score": 10')
      expect(fullResponse).toContain('"feedback"')
      expect(fullResponse).toContain('"improved"')

      // Verify it's valid JSON after cleanup
      const cleanedResponse = fullResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^json\n/g, '')

      const parsed = JSON.parse(cleanedResponse.trim())
      expect(parsed.score).toBe(10)
      expect(parsed.feedback).toBe('Perfect bullet point')
      expect(parsed.improved).toBe('Optimized system performance by 40%')
    })

    it('should handle markdown code blocks in stream', async () => {
      async function* mockStream() {
        yield '```json\n'
        yield '{"score": 7, "feedback": "Good", "improved": "Enhanced version"}'
        yield '\n```'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet(testBullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toContain('```json\n')
      expect(chunks).toContain('\n```')
    })

    it('should handle empty bullet point', async () => {
      async function* mockStream() {
        yield '{"score": 0, "feedback": "No content provided", "improved": "Please provide a bullet point"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet('')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(mockLLMService.promptStream).toHaveBeenCalledWith(expect.any(String), expect.any(String))
    })

    it('should handle single chunk response', async () => {
      async function* mockStream() {
        yield '{"score": 6, "feedback": "Needs specifics", "improved": "Add metrics and achievements"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet('Worked on projects')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toBeArrayOfSize(1)
      const fullResponse = chunks[0]
      const parsed = JSON.parse(fullResponse as string)
      expect(parsed).toHaveProperty('score')
      expect(parsed).toHaveProperty('feedback')
      expect(parsed).toHaveProperty('improved')
    })

    it('should handle streaming errors', async () => {
      mockLLMService.promptStream = mock(() => {
        throw new Error('LLM streaming service unavailable')
      })

      await expect(llmTaskService.analyzeBullet(testBullet)).rejects.toThrow('LLM streaming service unavailable')
    })

    it('should handle stream interruption mid-response', async () => {
      async function* errorStream() {
        yield '{"score": 5,'
        yield ' "feedback": "Starting analysis..."'
        throw new Error('Stream connection lost')
      }

      mockLLMService.promptStream = mock(async () => errorStream())

      const stream = await llmTaskService.analyzeBullet(testBullet)

      await expect(async () => {
        for await (const chunk of stream) {
          // Will throw when error occurs
        }
      }).toThrow('Stream connection lost')
    })

    it('should handle long bullet points', async () => {
      async function* mockStream() {
        yield '{"score": 5, "feedback": "Too verbose", "improved": "Make it concise"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const longBullet = 'A'.repeat(300) + ' with lots of unnecessary details that should be condensed'
      const stream = await llmTaskService.analyzeBullet(longBullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(mockLLMService.promptStream).toHaveBeenCalledWith(expect.stringContaining(longBullet), expect.any(String))
    })

    it('should handle special characters in bullet', async () => {
      async function* mockStream() {
        yield '{"score": 9, "feedback": "Great metrics", "improved": "Achieved 150% ROI on $2M project"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const bullet = 'Achieved 150% ROI on $2M project & reduced costs by 30%'
      const stream = await llmTaskService.analyzeBullet(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(mockLLMService.promptStream).toHaveBeenCalledWith(expect.stringContaining(bullet), expect.any(String))
    })

    it('should handle whitespace-only chunks', async () => {
      async function* mockStream() {
        yield '{"score":'
        yield ' '
        yield '8,'
        yield ' '
        yield '"feedback": "Good",'
        yield ' '
        yield '"improved": "Better"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const stream = await llmTaskService.analyzeBullet(testBullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.filter((c) => c === ' ')).toBeArrayOfSize(3)
      expect(chunks.join('')).toContain('"score": 8')
    })

    it('should return async generator', async () => {
      async function* mockStream() {
        yield '{"score": 7, "feedback": "OK", "improved": "Better"}'
      }

      mockLLMService.promptStream = mock(async () => mockStream())

      const result = await llmTaskService.analyzeBullet(testBullet)

      expect(result).toBeDefined()
      expect(typeof result[Symbol.asyncIterator]).toBe('function')
    })
  })
})
