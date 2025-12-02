import type { LLMProvider, LLMChatRequest, LLMChatResponse } from '../services/llm-service'
import axios from 'axios'

export class OpenAIProvider implements LLMProvider {
  private apiKey: string
  private baseUrl: string = 'https://api.openai.com/v1'

  constructor(
    private model: string = process.env.OPENAI_MODEL || 'gpt-4o-mini',
    apiKey?: string,
  ) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const url = `${this.baseUrl}/chat/completions`

    const payload = {
      model: this.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false,
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await axios.post(url, payload, { headers })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI API error: ${response.statusText || response.status}`)
    }

    const data = response.data

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
    }
  }

  async *chatStream(request: LLMChatRequest): AsyncGenerator<string, void, unknown> {
    const url = `${this.baseUrl}/chat/completions`

    const payload = {
      model: this.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await axios.post(url, payload, { headers, responseType: 'stream' })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI API error: ${response.statusText || response.status}`)
    }

    const stream = response.data as any

    if (!stream) {
      throw new Error('No response body')
    }

    let buffered = ''

    for await (const chunk of stream) {
      const chunkStr = chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk)
      buffered += chunkStr

      const lines = buffered.split('\n')
      // Keep last partial line in buffer
      buffered = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // Skip parsing errors
          }
        }
      }
    }
  }

  async embed(text: string): Promise<number[][]> {
    const url = `${this.baseUrl}/embeddings`

    const payload = {
      model: this.model,
      input: text,
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }

    const response = await axios.post(url, payload, { headers })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`OpenAI API error: ${response.statusText || response.status}`)
    }

    const data = response.data

    return data.data.map((item: any) => item.embedding)
  }

  setModel(model: string): void {
    this.model = model
  }
}
