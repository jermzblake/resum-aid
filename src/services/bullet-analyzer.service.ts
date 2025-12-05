import { LLMTaskService } from '@/services/llm/llm.task.service'

export class BulletAnalyzerService {
  private llmTaskService: LLMTaskService

  constructor(llmTaskService: LLMTaskService) {
    this.llmTaskService = llmTaskService
  }

  async streamBulletAnalysis(bullet: string): Promise<AsyncGenerator<string, void, unknown>> {
    const analysisStream = await this.llmTaskService.analyzeBullet(bullet)
    return analysisStream
  }
}
