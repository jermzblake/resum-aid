import type { ParsedResume } from '@/types'

export function createEmptyResume(): ParsedResume {
  return {
    personalInfo: {
      name: '',
      email: undefined,
      phone: undefined,
      location: undefined,
      linkedin: '',
      website: '',
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    certifications: [],
  }
}
