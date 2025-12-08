import type { Context } from 'hono'
import { ResumeGapsView } from '@/views/pages/resume-gaps.view'
import type { ResumeBuilderController } from '@/controllers/resume-builder.controller'

interface ResumeStateData {
  resume?: unknown
  gaps?: unknown
  extractionNotes?: unknown
  error?: string
}

export async function handleResumeGapsState(c: Context, controller: ResumeBuilderController) {
  try {
    const state = await controller.getResumeState(c)
    const stateData: ResumeStateData = (state as any)?.json ? await (state as any).json() : (state as any)

    if (stateData.error) {
      return c.html(renderStartOverError(stateData.error), 404)
    }

    const gapsViewHtml = await ResumeGapsView({
      resume: stateData.resume as any,
      gaps: stateData.gaps as any,
      extractionNotes: stateData.extractionNotes as any,
    })
    return c.html(gapsViewHtml)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.html(renderErrorHtml(message), 500)
  }
}

export function renderErrorHtml(message: string) {
  return `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700"><strong>Error:</strong> ${message}</div>`
}

export function renderStartOverError(message: string) {
  return `<div class="p-4 border border-red-400 bg-red-50 rounded-lg text-red-700">
    <strong>Error:</strong> ${message}. Please <a href="/tools/resume-builder" class="underline">start over</a>.
  </div>`
}
