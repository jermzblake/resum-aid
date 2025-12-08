import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { ResumeBuilderService } from '@/services/resume-builder.service'
import type { PDFGeneratorService } from '@/services/pdf-generator.service'
import type { ParsedResume } from '@/types'
import { ErrorComponent } from '@/views/components/error.component'
import { ParseLoaderFragment } from '@/views/fragments/parse-loader.fragment'
import { ResumePreviewDataView } from '@/views/pages/resume-preview-data.view'
import { randomUUID } from 'crypto'
import { createEmptyResume } from '@/utils/resume'

/**
 * Simple in-memory session store for resume builder
 * Maps sessionID -> { resume, gaps, extractionNotes, updatedAt }
 */
const resumeSessions = new Map<
  string,
  {
    resume: ParsedResume
    gaps: any[]
    extractionNotes: string
    updatedAt: number
    resumeText?: string
    inProgress?: boolean
  }
>()

const SESSION_TTL = 24 * 60 * 60 * 1000 // Session TTL: 24 hours

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${randomUUID().replace(/-/g, '')}`
}

/**
 * Get or create session ID from cookies
 */
function getSessionId(c: Context): string {
  const cookieHeader = c.req.header('cookie') || ''
  const sessionMatch = cookieHeader.match(/resumeSessionId=([^;]+)/)
  let sessionId = sessionMatch ? sessionMatch[1] : null

  if (!sessionId) {
    sessionId = generateSessionId()
  }

  // Set response cookie
  c.header('Set-Cookie', `resumeSessionId=${sessionId}; Path=/; Max-Age=${SESSION_TTL / 1000}; HttpOnly; SameSite=Lax`)

  return sessionId
}

/**
 * Save resume to session
 */
function saveResumeSession(sessionId: string, resume: ParsedResume, gaps: any[], extractionNotes: string) {
  resumeSessions.set(sessionId, {
    resume,
    gaps,
    extractionNotes,
    updatedAt: Date.now(),
  })
}

/**
 * Get resume from session
 */
function getResumeSession(sessionId: string) {
  const session = resumeSessions.get(sessionId)

  // Clean up expired sessions
  if (session && Date.now() - session.updatedAt > SESSION_TTL) {
    resumeSessions.delete(sessionId)
    return null
  }

  return session
}

/**
 * Clear session
 */
function clearResumeSession(sessionId: string) {
  resumeSessions.delete(sessionId)
}

export class ResumeBuilderController {
  constructor(
    private resumeBuilderService: ResumeBuilderService,
    private pdfGeneratorService: PDFGeneratorService,
  ) {}

  /**
   * POST /api/resume/init-parse
   * Initialize parse and return loader fragment that wires SSE
   */
  async initParseResume(ctx: Context) {
    try {
      const formData = await ctx.req.parseBody()
      const file = formData.resume as File | undefined
      const text = formData.text as string | undefined

      if (!file && (!text || text.trim().length === 0)) {
        return ctx.html(
          ErrorComponent({
            title: 'No Input',
            message: 'Please upload a resume file or paste resume text.',
            status: 400,
          }),
          400,
        )
      }

      const sessionId = getSessionId(ctx)
      const existing = getResumeSession(sessionId)
      if (existing?.inProgress) {
        return ctx.html(
          ErrorComponent({
            title: 'Already Parsing',
            message: 'A resume parse is already in progress. Please wait or refresh after it completes.',
            status: 429,
          }),
          429,
        )
      }

      // Parse raw input into text and stash in session for the stream step
      const resumeText = await this.resumeBuilderService.parseResume(file, text)
      resumeSessions.set(sessionId, {
        resume: createEmptyResume(),
        gaps: [],
        extractionNotes: '',
        updatedAt: Date.now(),
        resumeText,
        inProgress: true,
      })
      // Return a loader fragment that connects SSE stream
      return ctx.html(ParseLoaderFragment('/api/resume/parse-stream'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.html(ErrorComponent({ title: 'Parse Error', message, status: 500 }), 500)
    }
  }

  /**
   * GET /api/resume/parse-stream
   * Stream extraction progress with SSE (EventSource)
   */
  async parseResumeStream(ctx: Context) {
    try {
      const sessionId = getSessionId(ctx)
      const session = getResumeSession(sessionId)
      if (!session || !session.resumeText) {
        return streamSSE(ctx, async (stream) => {
          await stream.writeSSE({ event: 'error', data: 'Resume file or text is required' })
        })
      }

      return streamSSE(ctx, async (stream) => {
        // Heartbeat to keep the SSE connection alive during long LLM operations
        let alive = true
        const heartbeat = setInterval(async () => {
          if (!alive) return
          try {
            await stream.writeSSE({ event: 'ping', data: '💓' })
          } catch (_) {
            // Ignore transient write errors
          }
        }, 5000)
        try {
          // Step 1: Parse resume text
          await stream.writeSSE({
            event: 'progress',
            data: 'Parsing resume text... ',
          })

          const resumeText = session.resumeText as string
          await stream.writeSSE({
            event: 'progress',
            data: '✓ Parsing complete\nExtracting structured data... ',
          })

          const result = await this.resumeBuilderService.extractResumeData(resumeText)
          await stream.writeSSE({
            event: 'progress',
            data: '✓ Extraction complete\nDetecting gaps... ',
          })

          saveResumeSession(sessionId, result.resume, result.gaps, result.extractionNotes)
          // Mark not in progress and clear raw text to prevent replays
          const s = getResumeSession(sessionId)
          if (s) {
            s.inProgress = false
            s.resumeText = undefined
            s.updatedAt = Date.now()
          }

          await stream.writeSSE({
            event: 'progress',
            data: '✓ Ready to review',
          })

          await stream.writeSSE({
            event: 'complete',
            // Send minimal HTML fragment that triggers the next GET and allows HTMX to swap cleanly
            data: "<div class=\"hidden\" hx-on::load=\"htmx.ajax('GET', '/api/resume/gaps', { target: '#tool-content', swap: 'innerHTML', push: false })\"></div>",
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          await stream.writeSSE({
            event: 'error',
            // Provide an HTML error box that HTMX can swap without throwing
            data: `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700"><strong>Error:</strong> ${message}</div>`,
          })
          // Ensure session is not stuck in progress on error
          const s = getResumeSession(sessionId)
          if (s) {
            s.inProgress = false
            s.resumeText = undefined
            s.updatedAt = Date.now()
          }
        } finally {
          // Stop heartbeat
          alive = false
          clearInterval(heartbeat)
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.html(ErrorComponent({ title: 'Parse Error', message, status: 500 }), 500)
    }
  }

  /**
   * GET /api/resume/state
   * Retrieve current session state (resume + gaps)
   */
  async getResumeState(ctx: Context) {
    try {
      const sessionId = getSessionId(ctx)
      const session = getResumeSession(sessionId)

      if (!session) {
        return ctx.json({ error: 'No resume session found' }, 404)
      }
      // Basic validation before returning
      // Importing schema here would cause a cycle; rely on service-level schema use
      return ctx.json({
        resume: session.resume,
        gaps: session.gaps,
        extractionNotes: session.extractionNotes,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.json({ error: message }, 500)
    }
  }

  /**
   * PUT /api/resume/update
   * Update resume data with user edits
   */
  async updateResume(ctx: Context) {
    try {
      const sessionId = getSessionId(ctx)
      const session = getResumeSession(sessionId)

      if (!session) {
        return ctx.json({ error: 'No resume session found' }, 404)
      }

      const body = await ctx.req.json()
      const updates = body.updates || {}

      // Merge updates with existing resume
      const updatedResume = this.resumeBuilderService.fillGaps(session.resume, updates)

      // Re-save with updates
      saveResumeSession(sessionId, updatedResume, session.gaps, session.extractionNotes)

      return ctx.json({ success: true, resume: updatedResume })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.json({ error: message }, 500)
    }
  }

  /**
   * GET /api/resume/preview
   * Generate HTML preview of current resume
   */
  async getPreview(ctx: Context) {
    try {
      const sessionId = getSessionId(ctx)
      const session = getResumeSession(sessionId)

      if (!session) {
        return ctx.html(
          ErrorComponent({
            title: 'No Resume',
            message: 'Please parse a resume first.',
            status: 404,
          }),
          404,
        )
      }

      return ctx.html(ResumePreviewDataView(session.resume))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.html(ErrorComponent({ title: 'Preview Error', message, status: 500 }), 500)
    }
  }

  /**
   * POST /api/resume/download
   * Generate and download PDF
   */
  async downloadPDF(ctx: Context) {
    try {
      const sessionId = getSessionId(ctx)
      const session = getResumeSession(sessionId)

      if (!session) {
        return ctx.json({ error: 'No resume session found' }, 404)
      }

      const pdfBuffer = await this.resumeBuilderService.generatePDF(session.resume)

      // Set response headers for PDF download
      ctx.header('Content-Type', 'application/pdf')
      ctx.header(
        'Content-Disposition',
        `attachment; filename="${session.resume.personalInfo.name || 'resume'}_resume.pdf"`,
      )

      // Clear session after download
      clearResumeSession(sessionId)

      return ctx.newResponse(Buffer.from(pdfBuffer))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return ctx.json({ error: message }, 500)
    }
  }
}
