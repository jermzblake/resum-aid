import { z } from 'zod'

export const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company name required'),
  title: z.string().min(1, 'Job title required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  teamSize: z.number().nullable().optional(),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
})

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution required'),
  degree: z.string().min(1, 'Degree required'),
  field: z.string().optional(),
  graduationDate: z.string().optional(),
  gpa: z.string().optional(),
})

export const ParsedResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().min(1, 'Name required'),
    email: z.email('Valid email required').optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedin: z.url().optional().or(z.literal('')),
    website: z.url().optional().or(z.literal('')),
  }),
  summary: z.string().optional(),
  workExperience: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
})

export type ParsedResume = z.infer<typeof ParsedResumeSchema>
export type WorkExperience = z.infer<typeof WorkExperienceSchema>
export type Education = z.infer<typeof EducationSchema>

// Gap detection types
export interface ResumeGap {
  section: string
  field: string
  message: string
  index?: number // For array items
}

export interface ExtractionResult {
  resume: ParsedResume
  gaps: ResumeGap[]
  extractionNotes: string
}

// LLM Response format
export const LLMExtractionResponseSchema = z.object({
  resume: ParsedResumeSchema,
  gaps: z.array(
    z.object({
      section: z.string(),
      field: z.string(),
      message: z.string(),
      // LLMs may emit index as string; coerce to number when present
      index: z.coerce.number().optional(),
    }),
  ),
  extractionNotes: z.string(),
})

// LLM bullets response
export const BulletsResponseSchema = z.object({
  bullets: z.array(z.string()).default([]),
})
