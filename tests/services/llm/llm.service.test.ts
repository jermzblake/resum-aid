import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { LLMService } from '@/services/llm/llm.service'
import type { LLMProvider, LLMChatRequest, LLMChatResponse, LLMMessage } from '@/services/llm/llm.service'

describe('LLMService', () => {
  let llmService: LLMService
  let mockProvider: LLMProvider

  const mockChatResponse: LLMChatResponse = {
    content: 'This is a test response',
    model: 'test-model',
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
  }

  beforeEach(() => {
    mockProvider = {
      chat: mock(async () => mockChatResponse),
    }

    llmService = new LLMService(mockProvider)
  })

  describe('chat', () => {
    it('should successfully make a chat request', async () => {
      const request: LLMChatRequest = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello!' },
        ],
      }

      const response = await llmService.chat(request)

      expect(response).toEqual(mockChatResponse)
      expect(mockProvider.chat).toHaveBeenCalledTimes(1)
      expect(mockProvider.chat).toHaveBeenCalledWith(request)
    })

    it('should pass temperature and maxTokens parameters', async () => {
      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.7,
        maxTokens: 1000,
      }

      await llmService.chat(request)

      expect(mockProvider.chat).toHaveBeenCalledWith(request)
    })

    it('should handle multiple messages in conversation', async () => {
      const request: LLMChatRequest = {
        messages: [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: 'First answer' },
          { role: 'user', content: 'Second question' },
        ],
      }

      const response = await llmService.chat(request)

      expect(response.content).toBe('This is a test response')
      expect(mockProvider.chat).toHaveBeenCalledWith(request)
    })

    it('should handle provider errors', async () => {
      mockProvider.chat = mock(async () => {
        throw new Error('Provider error')
      })

      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await expect(llmService.chat(request)).rejects.toThrow('Provider error')
    })
  })

  describe('chatStream', () => {
    it('should successfully stream chat responses', async () => {
      async function* mockStream() {
        yield 'Hello'
        yield ' '
        yield 'world'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true,
      }

      const stream = await llmService.chatStream(request)
      const chunks: string[] = []

      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' ', 'world'])
      expect(mockProvider.chatStream).toHaveBeenCalledWith(request)
    })

    it('should throw error if streaming not supported', async () => {
      const providerWithoutStream: LLMProvider = {
        chat: mock(async () => mockChatResponse),
      }

      llmService = new LLMService(providerWithoutStream)

      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      await expect(llmService.chatStream(request)).rejects.toThrow('Streaming not supported by this provider')
    })

    it('should handle streaming errors', async () => {
      async function* errorStream() {
        yield 'Start'
        throw new Error('Stream error')
      }

      mockProvider.chatStream = mock(() => errorStream())

      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const stream = await llmService.chatStream(request)

      await expect(async () => {
        for await (const chunk of stream) {
          // This will throw when error occurs
        }
      }).toThrow('Stream error')
    })
  })

  describe('embed', () => {
    it('should successfully create embeddings', async () => {
      const mockEmbedding = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      mockProvider.embed = mock(async () => mockEmbedding)

      const result = await llmService.embed('Test text')

      expect(result).toEqual(mockEmbedding)
      expect(mockProvider.embed).toHaveBeenCalledWith('Test text')
    })

    it('should throw error if embedding not supported', async () => {
      const providerWithoutEmbed: LLMProvider = {
        chat: mock(async () => mockChatResponse),
      }

      llmService = new LLMService(providerWithoutEmbed)

      await expect(llmService.embed('Test text')).rejects.toThrow('Embedding not supported by this provider')
    })

    it('should handle empty text embedding', async () => {
      const mockEmbedding = [[0, 0, 0, 0, 0]]
      mockProvider.embed = mock(async () => mockEmbedding)

      const result = await llmService.embed('')

      expect(result).toEqual(mockEmbedding)
      expect(mockProvider.embed).toHaveBeenCalledWith('')
    })

    it('should handle embedding errors', async () => {
      mockProvider.embed = mock(async () => {
        throw new Error('Embedding service error')
      })

      await expect(llmService.embed('Test')).rejects.toThrow('Embedding service error')
    })
  })

  describe('promptStream', () => {
    it('should stream a prompt without system message', async () => {
      async function* mockStream() {
        yield 'Hello'
        yield ' '
        yield 'from'
        yield ' '
        yield 'stream'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const userPrompt = 'Test prompt'
      const stream = await llmService.promptStream(userPrompt)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' ', 'from', ' ', 'stream'])
      expect(mockProvider.chatStream).toHaveBeenCalledTimes(1)

      const callArgs = (mockProvider.chatStream as any).mock.calls[0][0]
      expect(callArgs.messages).toBeArrayOfSize(1)
      expect(callArgs.messages[0]).toEqual({ role: 'user', content: userPrompt })
      expect(callArgs.stream).toBe(true)
    })

    it('should include system message when provided', async () => {
      async function* mockStream() {
        yield 'Response'
        yield ' '
        yield 'text'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const userPrompt = 'Hello'
      const systemPrompt = 'You are a helpful assistant'
      const stream = await llmService.promptStream(userPrompt, systemPrompt)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Response', ' ', 'text'])
      expect(mockProvider.chatStream).toHaveBeenCalledTimes(1)

      const callArgs = (mockProvider.chatStream as any).mock.calls[0][0]
      expect(callArgs.messages).toBeArrayOfSize(2)
      expect(callArgs.messages[0]).toEqual({ role: 'system', content: systemPrompt })
      expect(callArgs.messages[1]).toEqual({ role: 'user', content: userPrompt })
      expect(callArgs.stream).toBe(true)
    })

    it('should throw error if streaming not supported', async () => {
      const providerWithoutStream: LLMProvider = {
        chat: mock(async () => mockChatResponse),
      }

      llmService = new LLMService(providerWithoutStream)

      await expect(llmService.promptStream('Test')).rejects.toThrow('Streaming not supported by this provider')
    })

    it('should handle empty prompt', async () => {
      async function* mockStream() {
        yield 'Response'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const stream = await llmService.promptStream('')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toBeArrayOfSize(1)
      expect(mockProvider.chatStream).toHaveBeenCalled()
    })

    it('should handle streaming errors', async () => {
      async function* errorStream() {
        yield 'Start'
        throw new Error('Stream error occurred')
      }

      mockProvider.chatStream = mock(() => errorStream())

      const stream = await llmService.promptStream('Test')

      await expect(async () => {
        for await (const chunk of stream) {
          // Will throw when error occurs
        }
      }).toThrow('Stream error occurred')
    })

    it('should handle long prompts', async () => {
      async function* mockStream() {
        yield 'OK'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const longPrompt = 'A'.repeat(5000)
      const systemPrompt = 'System instructions'

      const stream = await llmService.promptStream(longPrompt, systemPrompt)

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['OK'])
      expect(mockProvider.chatStream).toHaveBeenCalled()

      const callArgs = (mockProvider.chatStream as any).mock.calls[0][0]
      expect(callArgs.messages[1].content).toBe(longPrompt)
    })

    it('should stream JSON responses', async () => {
      async function* mockStream() {
        yield '{"key":'
        yield ' '
        yield '"value"'
        yield '}'
      }

      mockProvider.chatStream = mock(() => mockStream())

      const stream = await llmService.promptStream('Generate JSON')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const fullResponse = chunks.join('')
      expect(fullResponse).toBe('{"key": "value"}')
    })

    it('should handle empty stream', async () => {
      async function* mockStream() {
        // Empty generator
      }

      mockProvider.chatStream = mock(() => mockStream())

      const stream = await llmService.promptStream('Test')

      const chunks: string[] = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks).toBeArrayOfSize(0)
    })
  })

  describe('prompt', () => {
    it('should make a simple prompt without system message', async () => {
      const userPrompt = 'What is the capital of France?'

      const response = await llmService.prompt(userPrompt)

      expect(response).toBe('This is a test response')
      expect(mockProvider.chat).toHaveBeenCalledTimes(1)

      const callArgs = (mockProvider.chat as any).mock.calls[0][0]
      expect(callArgs.messages).toBeArrayOfSize(1)
      expect(callArgs.messages[0]).toEqual({ role: 'user', content: userPrompt })
    })

    it('should include system message when provided', async () => {
      const userPrompt = 'Hello'
      const systemPrompt = 'You are a helpful assistant'

      const response = await llmService.prompt(userPrompt, systemPrompt)

      expect(response).toBe('This is a test response')
      expect(mockProvider.chat).toHaveBeenCalledTimes(1)

      const callArgs = (mockProvider.chat as any).mock.calls[0][0]
      expect(callArgs.messages).toBeArrayOfSize(2)
      expect(callArgs.messages[0]).toEqual({ role: 'system', content: systemPrompt })
      expect(callArgs.messages[1]).toEqual({ role: 'user', content: userPrompt })
    })

    it('should extract content from chat response', async () => {
      mockProvider.chat = mock(async () => ({
        content: 'Custom response content',
        model: 'test-model',
      }))

      const response = await llmService.prompt('Test prompt')

      expect(response).toBe('Custom response content')
    })

    it('should handle empty prompts', async () => {
      const response = await llmService.prompt('')

      expect(response).toBe('This is a test response')
      expect(mockProvider.chat).toHaveBeenCalled()
    })

    it('should handle long prompts', async () => {
      const longPrompt = 'A'.repeat(10000)
      const systemPrompt = 'You are helpful'

      const response = await llmService.prompt(longPrompt, systemPrompt)

      expect(response).toBeDefined()
      expect(mockProvider.chat).toHaveBeenCalled()

      const callArgs = (mockProvider.chat as any).mock.calls[0][0]
      expect(callArgs.messages[1].content).toBe(longPrompt)
    })
  })

  describe('setProvider', () => {
    it('should switch to a new provider', async () => {
      const newMockResponse: LLMChatResponse = {
        content: 'Response from new provider',
        model: 'new-model',
      }

      const newProvider: LLMProvider = {
        chat: mock(async () => newMockResponse),
      }

      llmService.setProvider(newProvider)

      const request: LLMChatRequest = {
        messages: [{ role: 'user', content: 'Test' }],
      }

      const response = await llmService.chat(request)

      expect(response).toEqual(newMockResponse)
      expect(newProvider.chat).toHaveBeenCalled()
      expect(mockProvider.chat).not.toHaveBeenCalled()
    })

    it('should use new provider for prompt method', async () => {
      const newProvider: LLMProvider = {
        chat: mock(async () => ({ content: 'New provider response' })),
      }

      llmService.setProvider(newProvider)

      const response = await llmService.prompt('Test')

      expect(response).toBe('New provider response')
      expect(newProvider.chat).toHaveBeenCalled()
    })

    it('should switch providers multiple times', async () => {
      const provider1: LLMProvider = {
        chat: mock(async () => ({ content: 'Provider 1' })),
      }
      const provider2: LLMProvider = {
        chat: mock(async () => ({ content: 'Provider 2' })),
      }

      llmService.setProvider(provider1)
      let response = await llmService.prompt('Test')
      expect(response).toBe('Provider 1')

      llmService.setProvider(provider2)
      response = await llmService.prompt('Test')
      expect(response).toBe('Provider 2')

      expect(provider1.chat).toHaveBeenCalledTimes(1)
      expect(provider2.chat).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should propagate provider connection errors', async () => {
      mockProvider.chat = mock(async () => {
        throw new Error('Network error: Connection refused')
      })

      await expect(llmService.chat({ messages: [{ role: 'user', content: 'Test' }] })).rejects.toThrow('Network error')
    })

    it('should handle rate limit errors', async () => {
      mockProvider.chat = mock(async () => {
        throw new Error('Rate limit exceeded')
      })

      await expect(llmService.chat({ messages: [{ role: 'user', content: 'Test' }] })).rejects.toThrow(
        'Rate limit exceeded',
      )
    })

    it('should handle authentication errors', async () => {
      mockProvider.chat = mock(async () => {
        throw new Error('Invalid API key')
      })

      await expect(llmService.chat({ messages: [{ role: 'user', content: 'Test' }] })).rejects.toThrow(
        'Invalid API key',
      )
    })
  })

  describe('integration scenarios', () => {
    it('should support complete conversation flow', async () => {
      const conversationResponses = [
        { content: 'Hello! How can I help?' },
        { content: 'Sure, I can help with that.' },
        { content: "You're welcome!" },
      ]

      let callCount = 0
      mockProvider.chat = mock(async () => {
        const response = conversationResponses[callCount++]
        return response || { content: '' }
      })

      // First exchange
      let response = await llmService.prompt('Hello')
      expect(response).toBe('Hello! How can I help?')

      // Second exchange
      response = await llmService.prompt('Can you help me?')
      expect(response).toBe('Sure, I can help with that.')

      // Third exchange
      response = await llmService.prompt('Thank you')
      expect(response).toBe("You're welcome!")

      expect(mockProvider.chat).toHaveBeenCalledTimes(3)
    })

    it('should handle mixed API usage', async () => {
      // Use prompt
      let response = await llmService.prompt('Simple prompt')
      expect(response).toBe('This is a test response')

      // Use chat directly
      const chatResponse = await llmService.chat({
        messages: [{ role: 'user', content: 'Direct chat' }],
      })
      expect(chatResponse.content).toBe('This is a test response')

      expect(mockProvider.chat).toHaveBeenCalledTimes(2)
    })
  })
})
