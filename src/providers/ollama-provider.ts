import ollama, { Ollama } from 'ollama'
import type { LLMProvider, LLMChatRequest, LLMChatResponse } from '../services/llm/llm.service'

export class OllamaProvider implements LLMProvider {
  private client: Ollama
  constructor(private model: string = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud') {
    const host = process.env.OLLAMA_HOST || 'http://ollama:11434'
    const apiKey = process.env.OLLAMA_API_KEY
    this.client = apiKey
      ? new Ollama({
          host,
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        })
      : ollama
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const response = await this.client.chat({
      model: this.model,
      messages: request.messages,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    })

    return {
      content: response.message.content,
      model: this.model,
    }
  }

  async *chatStream(request: LLMChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await this.client.chat({
      model: this.model,
      messages: request.messages,
      stream: true,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    })

    for await (const chunk of response) {
      yield chunk.message.content
    }
  }

  async embed(text: string): Promise<number[][]> {
    const response = await this.client.embed({
      model: this.model,
      input: text,
    })

    return response.embeddings
  }

  setModel(model: string): void {
    this.model = model
  }
}
