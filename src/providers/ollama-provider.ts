import ollama from 'ollama'
import type { LLMProvider, LLMChatRequest, LLMChatResponse } from '../services/llm-service'

export class OllamaProvider implements LLMProvider {
  constructor(private model: string = process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud') {}

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const response = await ollama.chat({
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
    const response = await ollama.chat({
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
    const response = await ollama.embed({
      model: this.model,
      input: text,
    })

    return response.embeddings
  }

  setModel(model: string): void {
    this.model = model
  }
}
