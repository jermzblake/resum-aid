import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { LLMFactory } from '../../../src/providers/llm-factory'

const ORIGINAL_ENV = { ...process.env }

describe('LLMFactory.createFromEnv', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    delete process.env.LLM_PROVIDER
    delete process.env.OPENAI_API_KEY
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('defaults to ollama when LLM_PROVIDER is not set', () => {
    const service = LLMFactory.createFromEnv()
    expect(service).toBeDefined()
  })

  it('throws when LLM_PROVIDER=openai and OPENAI_API_KEY is missing', () => {
    process.env.LLM_PROVIDER = 'openai'
    delete process.env.OPENAI_API_KEY
    expect(() => LLMFactory.createFromEnv()).toThrow('OPENAI_API_KEY is required when LLM_PROVIDER=openai')
  })

  it('returns service when LLM_PROVIDER=openai and OPENAI_API_KEY is provided', () => {
    process.env.LLM_PROVIDER = 'openai'
    process.env.OPENAI_API_KEY = 'sk-test'
    const service = LLMFactory.createFromEnv()
    expect(service).toBeDefined()
  })

  it('handles case-insensitive provider names', () => {
    process.env.LLM_PROVIDER = 'OpenAI' // mixed case
    process.env.OPENAI_API_KEY = 'sk-test'
    const service = LLMFactory.createFromEnv()
    expect(service).toBeDefined()
  })
})
