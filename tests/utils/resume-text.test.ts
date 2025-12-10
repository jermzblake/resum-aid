import { describe, expect, it, vi } from 'bun:test'
import { extractResumeText } from '@/utils/resume-text'

// Mocks
vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(async () => ({
    /* mock doc proxy */
  })),
  extractText: vi.fn(async () => ({ text: 'PDF TEXT' })),
}))

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async () => ({ value: 'DOCX TEXT' })),
  },
}))

function makeFile(type: string, data: Uint8Array = new Uint8Array([1, 2, 3])): File {
  //@ts-ignore
  const blob = new Blob([data], { type })
  return new File([blob], 'test.' + (type === 'application/pdf' ? 'pdf' : 'docx'), { type })
}

describe('extractResumeText', () => {
  it('extracts text from PDF', async () => {
    const file = makeFile('application/pdf')
    const text = await extractResumeText(file)
    expect(text).toBe('PDF TEXT')
  })

  it('extracts text from DOCX', async () => {
    const file = makeFile('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const text = await extractResumeText(file)
    expect(text).toBe('DOCX TEXT')
  })

  it('throws on unsupported type', async () => {
    const file = new File([new Uint8Array([1])], 'bad.txt', { type: 'text/plain' })
    await expect(extractResumeText(file)).rejects.toThrow('Unsupported file type')
  })

  it('propagates generic error on failure', async () => {
    const file = makeFile('application/pdf')
    const { extractText } = await import('unpdf')
    ;(extractText as any).mockImplementationOnce(async () => {
      throw new Error('boom')
    })
    await expect(extractResumeText(file)).rejects.toThrow('Failed to extract text from the resume file.')
  })
})
