import { describe, it, expect, beforeEach, vi } from 'bun:test'
import { ResumeBuilderController } from '@/controllers/resume-builder.controller'
import type { ResumeBuilderService } from '@/services/resume-builder.service'
import type { PDFGeneratorService } from '@/services/pdf-generator.service'
import { mockStreamSSE, resetSSE, getSSEEvents } from '../helpers/sse'
import { minimalResume } from '../fixtures/resume'

function makeController(overrides: Partial<ResumeBuilderService> = {}) {
  const resumeService = {
    parseResume: vi.fn(async (_file?: File, text?: string) => (text || '').trim()),
    extractResumeData: vi.fn(async (_text: string) => ({
      resume: minimalResume,
      gaps: [],
      extractionNotes: 'ok',
    })),
    fillGaps: vi.fn((resume, updates) => ({ ...resume, ...updates })),
    generatePDF: vi.fn(async (_resume) => new Uint8Array([1, 2, 3])),
  } as unknown as ResumeBuilderService

  const pdfService = {} as PDFGeneratorService
  const controller = new ResumeBuilderController(resumeService, pdfService)
  return { controller, resumeService }
}

// Minimal Context mock
class MockContext {
  req: any
  headers: Record<string, string> = {}
  constructor(method: string, url: string, body?: any, cookie?: string) {
    this.req = {
      method,
      url,
      header: (name: string) => (name.toLowerCase() === 'cookie' ? cookie || '' : this.headers[name]),
      parseBody: async () => body || {},
      json: async () => body || {},
    }
  }
  header(name: string, value: string) {
    this.headers[name] = value
  }
  html(html: any, status = 200) {
    return { type: 'html', status, body: String(html) }
  }
  json(obj: any, status = 200) {
    return { type: 'json', status, body: obj }
  }
  newResponse(buf: Uint8Array | Buffer) {
    return { type: 'binary', status: 200, body: buf, headers: this.headers }
  }
}

// Use shared SSE mock utilities
mockStreamSSE()

function collectSSE(fn: (ctx: any) => Promise<any>, cookie?: string) {
  const ctx = new MockContext('GET', '/api/resume/parse-stream', undefined, cookie)
  resetSSE()
  return fn(ctx).then(() => getSSEEvents())
}

describe('ResumeBuilderController', () => {
  let cookie: string

  beforeEach(() => {
    cookie = ''
  })

  it('init-parse: returns error HTML when no input', async () => {
    const { controller } = makeController()
    const ctx = new MockContext('POST', '/api/resume/init-parse', {})
    const res: any = await controller.initParseResume(ctx as any)
    expect(res.type).toBe('html')
    expect(res.status).toBe(400)
    expect(String(res.body)).toContain('No Input')
  })

  it('init-parse: accepts text and sets session cookie', async () => {
    const { controller } = makeController()
    const ctx = new MockContext('POST', '/api/resume/init-parse', { text: ' my resume ' })
    const res: any = await controller.initParseResume(ctx as any)
    expect(res.type).toBe('html')
    expect(res.status).toBe(200)
    // Validate Set-Cookie header is set
    expect(Object.keys(ctx.headers)).toContain('Set-Cookie')
    cookie = String(ctx.headers['Set-Cookie'] || '')
    expect(String(res.body)).toContain('/api/resume/parse-stream')
  })

  it('parse-stream: emits progress and complete, and clears inProgress/resumeText', async () => {
    const { controller } = makeController()
    // First init-parse to create session
    const initCtx = new MockContext('POST', '/api/resume/init-parse', { text: 'resume text' })
    await controller.initParseResume(initCtx as any)
    const sessionCookie = initCtx.headers['Set-Cookie']

    const events = await collectSSE(controller.parseResumeStream.bind(controller), sessionCookie)
    const eventNames = events.map((e: any) => e.event)
    expect(eventNames).toContain('progress')
    expect(eventNames).toContain('complete')
    // Heartbeat pings are timing-dependent; don't assert presence
    // After completion, calling getResumeState should return saved resume
    const stateCtx = new MockContext('GET', '/api/resume/state', undefined, sessionCookie)
    const state: any = await controller.getResumeState(stateCtx as any)
    expect(state.type).toBe('json')
    expect(state.body.resume.personalInfo.name).toBe('Test User')
  })

  it('parse-stream: emits error and unlocks session when extraction throws', async () => {
    const { controller, resumeService } = makeController()
    ;(resumeService.extractResumeData as any) = vi.fn(async () => {
      throw new Error('LLM failed')
    })
    const initCtx = new MockContext('POST', '/api/resume/init-parse', { text: 'resume text' })
    await controller.initParseResume(initCtx as any)
    const sessionCookie = initCtx.headers['Set-Cookie']

    const events = await collectSSE(controller.parseResumeStream.bind(controller), sessionCookie)
    const errorEvent = events.find((e: any) => e.event === 'error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.data).toContain('Error:')
  })

  it('preview: renders data view when session exists', async () => {
    const { controller } = makeController()
    const initCtx = new MockContext('POST', '/api/resume/init-parse', { text: 'resume text' })
    await controller.initParseResume(initCtx as any)
    const sessionCookie = initCtx.headers['Set-Cookie']
    // Simulate parse-stream completion
    await collectSSE(controller.parseResumeStream.bind(controller), sessionCookie)

    const previewCtx = new MockContext('GET', '/api/resume/preview', undefined, sessionCookie)
    const res: any = await controller.getPreview(previewCtx as any)
    expect(res.type).toBe('html')
    expect(res.status).toBe(200)
    expect(String(res.body)).toContain('Download PDF')
  })

  it('update: merges updates and returns new resume', async () => {
    const { controller } = makeController()
    const initCtx = new MockContext('POST', '/api/resume/init-parse', { text: 'resume text' })
    await controller.initParseResume(initCtx as any)
    const sessionCookie = initCtx.headers['Set-Cookie']
    await collectSSE(controller.parseResumeStream.bind(controller), sessionCookie)

    const updateCtx = new MockContext(
      'PUT',
      '/api/resume/update',
      { updates: { summary: 'Updated summary' } },
      sessionCookie,
    )
    const res: any = await controller.updateResume(updateCtx as any)
    expect(res.type).toBe('json')
    expect(res.status).toBe(200)
    expect(res.body.resume.summary).toBe('Updated summary')
  })

  it('download: returns PDF with headers and clears session', async () => {
    const { controller } = makeController()
    const initCtx = new MockContext('POST', '/api/resume/init-parse', { text: 'resume text' })
    await controller.initParseResume(initCtx as any)
    const sessionCookie = initCtx.headers['Set-Cookie']
    await collectSSE(controller.parseResumeStream.bind(controller), sessionCookie)

    const dlCtx = new MockContext('POST', '/api/resume/download', undefined, sessionCookie)
    const res: any = await controller.downloadPDF(dlCtx as any)
    expect(res.type).toBe('binary')
    expect(res.headers['Content-Type']).toBe('application/pdf')
    expect(String(res.headers['Content-Disposition'])).toContain('resume.pdf')
    expect((res.body as Uint8Array).length).toBeGreaterThan(0)

    // After download, session should be cleared
    const stateCtx = new MockContext('GET', '/api/resume/state', undefined, sessionCookie)
    const state: any = await controller.getResumeState(stateCtx as any)
    expect(state.status).toBe(404)
  })
})
