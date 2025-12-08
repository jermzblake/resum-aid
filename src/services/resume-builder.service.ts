import { LLMTaskService } from './llm/llm.task.service'
import type { ParsedResume, ExtractionResult, ResumeGap, WorkExperience } from '@/types'
import { ParsedResumeSchema } from '@/types'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import type { PDFGeneratorService } from './pdf-generator.service'

export interface ResumeBuilderServiceOptions {
  pdfGeneratorService?: PDFGeneratorService
}

export class ResumeBuilderService {
  private llmTaskService: LLMTaskService
  private pdfGeneratorService?: PDFGeneratorService

  constructor(llmTaskService: LLMTaskService, options?: ResumeBuilderServiceOptions) {
    this.llmTaskService = llmTaskService
    this.pdfGeneratorService = options?.pdfGeneratorService
  }

  async parseResume(file?: File, text?: string): Promise<string> {
    if (file) {
      return this.extractResumeText(file)
    } else if (text && text.trim().length > 0) {
      return text.trim()
    } else {
      throw new Error('Resume file or text is required')
    }
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

  async extractResumeData(resumeText: string): Promise<ExtractionResult> {
    try {
      const result = await this.llmTaskService.extractResumeData(resumeText)
      const validated = ParsedResumeSchema.parse(result.resume)
      return { ...result, resume: validated }
    } catch (error) {
      console.error('Error extracting resume data:', error)
      throw new Error('Failed to extract resume information. Please try again.')
    }
  }

  /**
   * Fill gaps in resume data with user edits
   */
  fillGaps(baseResume: ParsedResume, userInput: Partial<ParsedResume>): ParsedResume {
    try {
      // Deep merge user input into base resume
      const merged = {
        personalInfo: {
          ...baseResume.personalInfo,
          ...(userInput.personalInfo || {}),
        },
        summary: userInput.summary !== undefined ? userInput.summary : baseResume.summary,
        workExperience: userInput.workExperience || baseResume.workExperience,
        education: userInput.education || baseResume.education,
        skills: userInput.skills || baseResume.skills,
        certifications: userInput.certifications || baseResume.certifications,
      }

      const validated = ParsedResumeSchema.parse(merged)
      return validated
    } catch (error) {
      console.error('Error filling gaps:', error)
      throw new Error('Invalid resume data format')
    }
  }

  async generateBullets(workExperience: WorkExperience, company: string): Promise<string[]> {
    try {
      const bullets = await this.llmTaskService.generateAchievementBullets({
        ...workExperience,
        company,
      })
      return bullets
    } catch (error) {
      console.error('Error generating bullets:', error)
      throw new Error('Failed to generate bullet points')
    }
  }

  async generatePDF(resume: ParsedResume): Promise<Uint8Array> {
    if (!this.pdfGeneratorService) {
      throw new Error('PDF generator service not available')
    }
    // Validate before generating PDF to avoid runtime errors
    const validated = ParsedResumeSchema.parse(resume)
    return this.pdfGeneratorService.generateResumePDF(validated)
  }
}
