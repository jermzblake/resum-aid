import { LLMTaskService } from '@/services/llm/llm.task.service'
import type { JobMatchResult, JobMatchInput } from '@/types'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'

export class JobMatcherService {
  private llmTaskService: LLMTaskService

  constructor(llmTaskService: LLMTaskService) {
    this.llmTaskService = llmTaskService
  }

  async matchJob(input: JobMatchInput): Promise<JobMatchResult> {
    if (!input.resumeFile) {
      throw new Error('Resume file is required')
    }
    const resumeText = await this.extractResumeText(input.resumeFile)

    return this.llmTaskService.matchJob(resumeText, input.jobDescription)
  }

  private async extractResumeText(file: File): Promise<string> {
    try {
      if (file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer()
        const pdfDoc = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdfDoc, { mergePages: true })
        return text
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
        return result.value
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
      }
    } catch (error) {
      console.error('Error extracting resume text:', error)
      throw new Error('Failed to extract text from the resume file.')
    }
  }
}
