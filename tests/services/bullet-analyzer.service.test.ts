import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { BulletAnalyzerService } from '@/services/bullet-analyzer.service'
import type { LLMTaskService } from '@/services/llm/llm.task.service'

describe('BulletAnalyzerService', () => {
  let bulletAnalyzerService: BulletAnalyzerService
  let mockLLMTaskService: LLMTaskService

  beforeEach(() => {
    mockLLMTaskService = {} as LLMTaskService
    bulletAnalyzerService = new BulletAnalyzerService(mockLLMTaskService)
  })

  describe('streamBulletAnalysis', () => {
    it('should successfully stream bullet analysis', async () => {
      async function* mockStream() {
        yield '{"score": 8,'
        yield ' "feedback": "Great use of metrics",'
        yield ' "improved": "Led team of 5 engineers..."}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Led team of engineers to deliver project'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual([
        '{"score": 8,',
        ' "feedback": "Great use of metrics",',
        ' "improved": "Led team of 5 engineers..."}',
      ])
      expect(mockLLMTaskService.analyzeBullet).toHaveBeenCalledTimes(1)
      expect(mockLLMTaskService.analyzeBullet).toHaveBeenCalledWith(bullet)
    })

    it('should stream complete JSON response', async () => {
      async function* mockStream() {
        yield '{'
        yield '"score": 9,'
        yield '"feedback": "Excellent quantification",'
        yield '"improved": "Increased sales by 150%"'
        yield '}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Increased sales significantly'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      expect(fullResponse).toContain('"score": 9')
      expect(fullResponse).toContain('"feedback"')
      expect(fullResponse).toContain('"improved"')
      expect(mockLLMTaskService.analyzeBullet).toHaveBeenCalledWith(bullet)
    })

    it('should handle single chunk response', async () => {
      async function* mockStream() {
        yield '{"score": 7, "feedback": "Good start", "improved": "Enhanced version"}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Managed projects'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toBeArrayOfSize(1)
      expect(chunks[0]).toContain('"score": 7')
    })

    it('should handle empty stream', async () => {
      async function* mockStream() {
        // Empty generator
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Test bullet'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toBeArrayOfSize(0)
    })

    it('should propagate LLMTaskService errors', async () => {
      mockLLMTaskService.analyzeBullet = mock(async () => {
        throw new Error('LLM service unavailable')
      })

      const bullet = 'Test bullet'

      await expect(bulletAnalyzerService.streamBulletAnalysis(bullet)).rejects.toThrow('LLM service unavailable')
    })

    it('should handle streaming errors mid-stream', async () => {
      async function* errorStream() {
        yield '{"score": 5,'
        yield ' "feedback":'
        throw new Error('Stream interrupted')
      }

      mockLLMTaskService.analyzeBullet = mock(async () => errorStream())

      const bullet = 'Test bullet'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      await expect(async () => {
        for await (const chunk of stream) {
          // Stream will throw when error occurs
        }
      }).toThrow('Stream interrupted')
    })

    it('should handle markdown code blocks in stream', async () => {
      async function* mockStream() {
        yield '```json\n'
        yield '{"score": 10,'
        yield ' "feedback": "Perfect!",'
        yield ' "improved": "Optimized version"}'
        yield '\n```'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Optimized system performance'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toContain('```json\n')
      expect(chunks).toContain('\n```')
      expect(chunks.some((c) => c.includes('"score": 10'))).toBe(true)
    })

    it('should pass through whitespace chunks', async () => {
      async function* mockStream() {
        yield '{"score":'
        yield ' '
        yield '8,'
        yield ' "feedback":'
        yield ' '
        yield '"Good"}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Test'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toContain(' ')
      expect(chunks.filter((c) => c === ' ')).toBeArrayOfSize(2)
    })

    it('should handle long bullet points', async () => {
      async function* mockStream() {
        yield '{"score": 6, "feedback": "Too verbose", "improved": "Concise version"}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const longBullet = 'A'.repeat(500) + ' very long bullet point with lots of content'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(longBullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(mockLLMTaskService.analyzeBullet).toHaveBeenCalledWith(longBullet)
    })

    it('should handle special characters in bullet', async () => {
      async function* mockStream() {
        yield '{"score": 8, "feedback": "Good", "improved": "Better version"}'
      }

      mockLLMTaskService.analyzeBullet = mock(async () => mockStream())

      const bullet = 'Led $1.5M project with 90% success rate & achieved 200% ROI'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(mockLLMTaskService.analyzeBullet).toHaveBeenCalledWith(bullet)
    })
  })
})
