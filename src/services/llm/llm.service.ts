export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMChatRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface LLMChatResponse {
  content: string
  model?: string
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

// Abstract provider interface
export interface LLMProvider {
  chat(request: LLMChatRequest): Promise<LLMChatResponse>
  chatStream?(request: LLMChatRequest): AsyncGenerator<string, void, unknown>
  embed?(text: string): Promise<number[][]>
}

export class LLMService {
  constructor(private provider: LLMProvider) {}

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    return await this.provider.chat(request)
  }

  async chatStream(request: LLMChatRequest): Promise<AsyncGenerator<string, void, unknown>> {
    if (!this.provider.chatStream) {
      throw new Error('Streaming not supported by this provider')
    }
    return this.provider.chatStream(request)
  }

  async embed(text: string): Promise<number[][]> {
    if (!this.provider.embed) {
      throw new Error('Embedding not supported by this provider')
    }
    return this.provider.embed(text)
  }

  // Helper method for simple prompts
  async prompt(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: LLMMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await this.chat({ messages })
    return response.content
  }

  // Helper method for streaming prompts
  async promptStream(prompt: string, systemPrompt?: string): Promise<AsyncGenerator<string, void, unknown>> {
    const messages: LLMMessage[] = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    return await this.chatStream({ messages, stream: true })
  }

  // Switch provider at runtime if needed
  setProvider(provider: LLMProvider): void {
    this.provider = provider
  }
}
