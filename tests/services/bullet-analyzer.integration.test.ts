import { describe, it, expect, beforeEach } from 'bun:test'
import { LLMService } from '@/services/llm/llm.service'
import { LLMTaskService } from '@/services/llm/llm.task.service'
import { BulletAnalyzerService } from '@/services/bullet-analyzer.service'
import type { LLMProvider, LLMChatRequest } from '@/services/llm/llm.service'
import type { BulletAnalysis } from '@/services/llm/llm.interface'

describe('Bullet Analyzer Integration Tests', () => {
  let bulletAnalyzerService: BulletAnalyzerService
  let mockProvider: LLMProvider

  beforeEach(() => {
    mockProvider = {
      chat: async () => ({ content: '' }),
    }
  })

  const setupServices = (provider: LLMProvider) => {
    const llmService = new LLMService(provider)
    const llmTaskService = new LLMTaskService(llmService)
    return new BulletAnalyzerService(llmTaskService)
  }

  describe('Full streaming flow', () => {
    it('should stream complete bullet analysis from provider through all layers', async () => {
      // Mock provider that streams a complete JSON response
      async function* mockProviderStream() {
        yield '{'
        yield '\n  "score": 8,'
        yield '\n  "feedback": "Good use of metrics and specifics. Consider adding more context about the impact.",'
        yield '\n  "improved": "Led team of 5 engineers to deliver project 2 weeks ahead of schedule and 15% under budget, resulting in $50K cost savings"'
        yield '\n}'
      }

      mockProvider.chatStream = (request: LLMChatRequest) => {
        expect(request.messages).toBeDefined()
        expect(request.messages.length).toBeGreaterThan(0)
        expect(request.stream).toBe(true)
        return mockProviderStream()
      }

      bulletAnalyzerService = setupServices(mockProvider)

      const bullet = 'Led team to deliver project on time and under budget'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      expect(fullResponse).toContain('"score": 8')
      expect(fullResponse).toContain('"feedback"')
      expect(fullResponse).toContain('"improved"')

      // Verify it's parseable as JSON
      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(8)
      expect(parsed.feedback).toContain('metrics')
      expect(parsed.improved).toContain('team of 5 engineers')
    })

    it('should handle JSON wrapped in markdown code blocks', async () => {
      async function* mockProviderStream() {
        yield '```json\n'
        yield '{\n'
        yield '  "score": 9,\n'
        yield '  "feedback": "Excellent quantification",\n'
        yield '  "improved": "Increased sales by 150%"\n'
        yield '}'
        yield '\n```'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const bullet = 'Increased sales significantly'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      // Clean markdown like the controller does
      const cleanedResponse = fullResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^json\n/g, '')

      const parsed: BulletAnalysis = JSON.parse(cleanedResponse)
      expect(parsed.score).toBe(9)
      expect(parsed.feedback).toBe('Excellent quantification')
      expect(parsed.improved).toBe('Increased sales by 150%')
    })

    it('should handle mixed chunk sizes', async () => {
      async function* mockProviderStream() {
        yield '{"score": 7, '
        yield '"feed'
        yield 'back": '
        yield '"Good start. '
        yield 'Add more details.", '
        yield '"improved": "Enhanced version with metrics"}'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test bullet')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBe(6)
      const fullResponse = chunks.join('')
      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(7)
      expect(parsed.feedback).toContain('Good start')
    })

    it('should propagate errors from provider through all layers', async () => {
      async function* errorStream() {
        yield '{"score": 5,'
        throw new Error('Provider connection timeout')
      }

      mockProvider.chatStream = () => errorStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test')

      await expect(async () => {
        for await (const chunk of stream) {
          // Error will be thrown during iteration
        }
      }).toThrow('Provider connection timeout')
    })

    it('should handle incomplete JSON gracefully', async () => {
      async function* mockProviderStream() {
        yield '{"score": 6, "feedback": "Partial'
        // Stream ends abruptly
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      // Should collect the partial response
      expect(fullResponse).toBe('{"score": 6, "feedback": "Partial')

      // Parsing will fail (as expected in real scenario)
      expect(() => JSON.parse(fullResponse)).toThrow()
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle bullet with special characters and numbers', async () => {
      async function* mockProviderStream() {
        yield '{\n'
        yield '  "score": 10,\n'
        yield '  "feedback": "Perfect use of metrics with $ and %",\n'
        yield '  "improved": "Achieved 150% ROI ($2.5M) on project & reduced costs by 30%"\n'
        yield '}'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const bullet = 'Achieved high ROI and reduced costs'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(10)
      expect(parsed.improved).toContain('$2.5M')
      expect(parsed.improved).toContain('150%')
      expect(parsed.improved).toContain('&')
    })

    it('should handle very long feedback and improved text', async () => {
      const longFeedback = 'A'.repeat(500) + ' with detailed analysis'
      const longImproved = 'B'.repeat(500) + ' improved version'

      async function* mockProviderStream() {
        yield '{"score": 5, '
        yield `"feedback": "${longFeedback}", `
        yield `"improved": "${longImproved}"}`
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Brief bullet')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(5)
      expect(parsed.feedback.length).toBeGreaterThan(500)
      expect(parsed.improved.length).toBeGreaterThan(500)
    })

    it('should handle whitespace and newlines in JSON', async () => {
      async function* mockProviderStream() {
        yield '  {\n'
        yield '    "score"  :  8  ,\n'
        yield '    "feedback"  :  "Good job"  ,\n'
        yield '    "improved"  :  "Better version"\n'
        yield '  }  \n'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      const parsed: BulletAnalysis = JSON.parse(fullResponse.trim())
      expect(parsed.score).toBe(8)
      expect(parsed.feedback).toBe('Good job')
    })

    it('should handle empty feedback or improved fields', async () => {
      async function* mockProviderStream() {
        yield '{"score": 0, "feedback": "", "improved": ""}'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(0)
      expect(parsed.feedback).toBe('')
      expect(parsed.improved).toBe('')
    })

    it('should handle maximum score with minimal feedback', async () => {
      async function* mockProviderStream() {
        yield '{"score": 10, "feedback": "Perfect!", "improved": "No changes needed"}'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const bullet = 'Led team of 10 engineers to deliver $5M project 3 months early, achieving 200% ROI'
      const stream = await bulletAnalyzerService.streamBulletAnalysis(bullet)

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      const parsed: BulletAnalysis = JSON.parse(fullResponse)
      expect(parsed.score).toBe(10)
      expect(parsed.feedback).toBe('Perfect!')
      expect(parsed.improved).toBe('No changes needed')
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle provider that returns non-JSON text', async () => {
      async function* mockProviderStream() {
        yield 'This is not JSON, '
        yield 'just regular text response'
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      expect(fullResponse).toBe('This is not JSON, just regular text response')
      expect(() => JSON.parse(fullResponse)).toThrow()
    })

    it('should handle provider that throws immediately', async () => {
      mockProvider.chatStream = () => {
        throw new Error('Provider authentication failed')
      }

      bulletAnalyzerService = setupServices(mockProvider)

      await expect(bulletAnalyzerService.streamBulletAnalysis('Test')).rejects.toThrow('Provider authentication failed')
    })

    it('should handle empty stream from provider', async () => {
      async function* mockProviderStream() {
        // Empty generator
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      const stream = await bulletAnalyzerService.streamBulletAnalysis('Test')

      let fullResponse = ''
      for await (const chunk of stream) {
        fullResponse += chunk
      }

      expect(fullResponse).toBe('')
    })

    it('should handle multiple rapid iterations', async () => {
      let callCount = 0
      async function* mockProviderStream() {
        callCount++
        yield `{"score": ${callCount}, "feedback": "Test ${callCount}", "improved": "Version ${callCount}"}`
      }

      mockProvider.chatStream = () => mockProviderStream()
      bulletAnalyzerService = setupServices(mockProvider)

      // Run multiple analyses
      for (let i = 1; i <= 3; i++) {
        const stream = await bulletAnalyzerService.streamBulletAnalysis(`Test bullet ${i}`)
        let fullResponse = ''
        for await (const chunk of stream) {
          fullResponse += chunk
        }
        const parsed: BulletAnalysis = JSON.parse(fullResponse)
        expect(parsed.score).toBe(i)
      }

      expect(callCount).toBe(3)
    })
  })
})
