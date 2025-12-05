import { LLMTaskService } from '@/services/llm/llm.task.service'
import type { BulletAnalysis } from '@/services/llm/llm.interface'

export class BulletAnalyzerService {
  private llmTaskService: LLMTaskService

  constructor(llmTaskService: LLMTaskService) {
    this.llmTaskService = llmTaskService
  }

  async analyzeBullets(bullets: string[]): Promise<BulletAnalysis[]> {
    const analyses = await this.llmTaskService.analyzeBullets(bullets)
    return analyses
  }

  async streamBulletAnalysis(bullet: string): Promise<AsyncGenerator<string, void, unknown>> {
    const analysisStream = await this.llmTaskService.analyzeBullet(bullet)
    return analysisStream
  }
}
