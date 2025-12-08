import { LLMTaskService } from './llm/llm.task.service'
import type { ParsedResume, ExtractionResult, ResumeGap, WorkExperience } from '@/types'
import { ParsedResumeSchema } from '@/types'
import { extractResumeText } from '@/utils/resume-text'
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
      return extractResumeText(file)
    } else if (text && text.trim().length > 0) {
      return text.trim()
    } else {
      throw new Error('Resume file or text is required')
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
