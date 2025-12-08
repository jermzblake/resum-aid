import { describe, it, expect } from 'bun:test'
import { getSafeDownloadHeaders } from '@/utils/http'

describe('getSafeDownloadHeaders', () => {
  it('builds safe headers for normal names', () => {
    const h = getSafeDownloadHeaders('John Smith')
    expect(h.contentDisposition).toMatch(
      /^attachment; filename="John_Smith_resume\.pdf"; filename\*=UTF-8''John_Smith_resume\.pdf$/,
    )
  })

  it('removes CRLF and quotes to prevent injection', () => {
    const h = getSafeDownloadHeaders('Evil"\r\nX:1')
    expect(h.contentDisposition).not.toMatch(/[\r\n]/)
    expect(h.contentDisposition).toMatch(/filename="Evil_X_1_resume\.pdf"/)
  })

  it('strips path separators and reserved chars', () => {
    const h = getSafeDownloadHeaders('../Jane/..\\Doe:*?')
    expect(h.contentDisposition).toMatch(/filename=".*Jane.*Doe_resume\.pdf"/)
  })

  it('handles non-ASCII with filename*', () => {
    const h = getSafeDownloadHeaders('Маша')
    // ASCII filename fallback should not contain non-ASCII
    const asciiPart = /filename="([^"]+)"/.exec(h.contentDisposition)?.[1] || ''
    expect(asciiPart).not.toMatch(/[^\x20-\x7E]/)
    // filename* must be percent-encoded
    expect(h.contentDisposition).toMatch(/filename\*=UTF-8''/)
  })

  it('falls back on empty input', () => {
    const h = getSafeDownloadHeaders('   ')
    expect(h.contentDisposition).toMatch(/filename="resume_resume\.pdf"/)
  })

  it('caps length', () => {
    const long = 'a'.repeat(300)
    const h = getSafeDownloadHeaders(long)
    const asciiPart = /filename="([^"]+)"/.exec(h.contentDisposition)?.[1] || ''
    expect(asciiPart.length).toBeLessThanOrEqual(100 + '_resume'.length + '.pdf'.length)
  })
})
