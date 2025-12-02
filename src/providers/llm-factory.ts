import { LLMService } from '../services/llm-service'
import { OllamaProvider } from './ollama-provider'
import { OpenAIProvider } from './openai-provider'

export type LLMProviderType = 'ollama' | 'openai'

export interface LLMConfig {
  provider: LLMProviderType
  model?: string
  apiKey?: string
}

export class LLMFactory {
  static create(config: LLMConfig): LLMService {
    switch (config.provider) {
      case 'ollama':
        return new LLMService(new OllamaProvider(config.model || process.env.OLLAMA_MODEL || 'gpt-oss:120b-cloud'))

      case 'openai':
        return new LLMService(
          new OpenAIProvider(
            config.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
            config.apiKey || process.env.OPENAI_API_KEY || '',
          ),
        )

      default:
        throw new Error(`Unknown provider: ${config.provider}`)
    }
  }

  static createOllama(model?: string): LLMService {
    return this.create({ provider: 'ollama', model })
  }

  static createOpenAI(model?: string, apiKey?: string): LLMService {
    return this.create({ provider: 'openai', model, apiKey })
  }
}
