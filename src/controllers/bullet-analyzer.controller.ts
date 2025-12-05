import { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { BulletAnalyzerService } from '@/services/bullet-analyzer.service'
import { BulletAnalysisLoadingBox, BulletAnalysisResultView } from '@/views/pages/bullet-analysis-result.view'

export class BulletAnalyzerController {
  private bulletAnalyzerService: BulletAnalyzerService

  constructor(bulletAnalyzerService: BulletAnalyzerService) {
    this.bulletAnalyzerService = bulletAnalyzerService
  }

  async initStream(ctx: Context) {
    const body = await ctx.req.parseBody()
    const bullet = body['bullet'] as string
    if (!bullet || bullet.trim().length === 0) {
      return ctx.html(
        `<div class="error">Bullet point cannot be empty. Please provide a valid bullet point.</div>`,
        400,
      )
    }
    const encodeBullet = encodeURIComponent(bullet)

    return ctx.html(BulletAnalysisLoadingBox(encodeBullet))
  }

  chunkParser(chunk: string): string {
    const cleaned = chunk
      .replace(/```json\n?/g, '') // Remove opening code block
      .replace(/```\n?/g, '') // Remove closing code block
      .replace(/^json\n/g, '') // Remove "json" language tag
      //replace open and close curly braces
      .replace(/{/g, ' ')
      .replace(/}/g, ' ')

    // Add a space after each chunk unless it's already whitespace
    const parsedChunk = cleaned.trim() === '' ? cleaned : cleaned + ' '
    return `<span class="fade-in">${parsedChunk}</span>`
  }

  async streamAnalysis(ctx: Context) {
    const queryBullet = ctx.req.query('bullet') || ''
    const bullet = decodeURIComponent(queryBullet)
    if (!bullet || bullet.trim().length === 0) {
      return ctx.html(
        `<div class="error">Bullet point cannot be empty. Please provide a valid bullet point.</div>`,
        400,
      )
    }

    return streamSSE(ctx, async (stream) => {
      try {
        let fullResponse = ''
        const analysisStream = await this.bulletAnalyzerService.streamBulletAnalysis(bullet)

        // Stream tokens to user for real-time feedback
        for await (const chunk of analysisStream) {
          fullResponse += chunk
          await stream.writeSSE({
            event: 'token',
            data: this.chunkParser(chunk),
          })
        }

        // Clean markdown code blocks from accumulated response before parsing
        const cleanedResponse = fullResponse
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^json\n/g, '')

        const analysis = JSON.parse(cleanedResponse)
        const resultHtml = BulletAnalysisResultView(analysis)
        const htmlString = String(resultHtml)

        // Send final result to display in analysis-result container
        await stream.writeSSE({
          event: 'result',
          data: htmlString,
        })
      } catch (error) {
        console.error('Stream analysis error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error occurred'
        await stream.writeSSE({
          event: 'result',
          data: `<div class="error p-4 border border-red-400 bg-red-50 rounded-lg"><strong>Error:</strong> ${message}<br><small>Check console for details</small></div>`,
        })
      }
    })
  }
}
