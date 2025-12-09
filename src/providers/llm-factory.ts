import { LLMService } from '../services/llm/llm.service'
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

  static createFromEnv(): LLMService {
    const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase() as LLMProviderType
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY || ''
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai')
      }
      return this.create({ provider: 'openai' })
    }
    return this.create({ provider: 'ollama' })
  }

  static createOllama(model?: string): LLMService {
    return this.create({ provider: 'ollama', model })
  }

  static createOpenAI(model?: string, apiKey?: string): LLMService {
    return this.create({ provider: 'openai', model, apiKey })
  }
}
