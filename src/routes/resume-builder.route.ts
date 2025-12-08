import { Hono } from 'hono'
import { ResumeUploadView } from '@/views/pages/resume-upload.view'
import { ResumeGapsView } from '@/views/pages/resume-gaps.view'
import { ResumePreviewView } from '@/views/pages/resume-preview.view'
import { MainLayout } from '@/views/layouts/main.layout'
import type { ResumeBuilderController } from '@/controllers/resume-builder.controller'

export const registerResumeBuilderRoute = (app: Hono, controller: ResumeBuilderController) => {
  // Main resume-wizard entry point
  app.get('/tools/resume-builder', async (c) => {
    const uploadViewHtml = await ResumeUploadView()
    // If it's an HTMX request, return just the content
    if (c.req.header('HX-Request')) {
      c.header('HX-Trigger', JSON.stringify({ setActiveTab: 'builder' }))
      return c.html(uploadViewHtml)
    }

    // Otherwise return the full layout (for direct navigation)
    return c.html(MainLayout(uploadViewHtml, 'builder'))
  })

  // Step 1a: Init parse, return SSE-wired loader fragment
  app.post('/api/resume/init-parse', async (c) => {
    return await controller.initParseResume(c)
  })

  // Step 1b: SSE progress stream (GET)
  app.get('/api/resume/parse-stream', async (c) => {
    return await controller.parseResumeStream(c)
  })

  // Step 2: Get gaps interview view
  app.get('/api/resume/gaps', async (c) => {
    try {
      const state = await controller.getResumeState(c)
      const stateData = state.json ? await state.json() : state

      if (stateData.error) {
        return c.html(
          `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700">
            <strong>Error:</strong> ${stateData.error}. Please <a href="/tools/resume-builder" class="underline">start over</a>.
          </div>`,
          404,
        )
      }

      const gapsViewHtml = await ResumeGapsView({
        resume: stateData.resume,
        gaps: stateData.gaps,
        extractionNotes: stateData.extractionNotes,
      })
      return c.html(gapsViewHtml)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.html(
        `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700"><strong>Error:</strong> ${message}</div>`,
        500,
      )
    }
  })

  // Get current session state
  app.get('/api/resume/state', async (c) => {
    try {
      const state = await controller.getResumeState(c)
      const stateData = state.json ? await state.json() : state

      if (stateData.error) {
        return c.html(
          `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700">
            <strong>Error:</strong> ${stateData.error}. Please <a href="/tools/resume-builder" class="underline">start over</a>.
          </div>`,
          404,
        )
      }

      const gapsViewHtml = await ResumeGapsView({
        resume: stateData.resume,
        gaps: stateData.gaps,
        extractionNotes: stateData.extractionNotes,
      })
      return c.html(gapsViewHtml)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.html(
        `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700"><strong>Error:</strong> ${message}</div>`,
        500,
      )
    }
  })

  // Update resume with user edits
  app.put('/api/resume/update', async (c) => {
    return await controller.updateResume(c)
  })

  // Step 3: Preview resume
  app.get('/api/resume/preview', async (c) => {
    try {
      const previewResponse = await controller.getPreview(c)
      // If it's already HTML response, return it directly
      if (previewResponse.status) {
        return previewResponse
      }
      // Otherwise wrap in preview view
      const previewViewHtml = await ResumePreviewView(String(previewResponse))
      return c.html(previewViewHtml)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return c.html(
        `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700"><strong>Error:</strong> ${message}</div>`,
        500,
      )
    }
  })

  // Download PDF
  app.post('/api/resume/download', async (c) => {
    return await controller.downloadPDF(c)
  })
}
