import type { ParsedResume } from '@/types'

export const minimalResume: ParsedResume = {
  personalInfo: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-5555',
    location: 'Remote',
    linkedin: 'https://linkedin.com/in/test',
    website: '',
  },
  summary: 'Experienced engineer.',
  workExperience: [
    {
      title: 'Engineer',
      company: 'Acme',
      startDate: '2020',
      endDate: '2022',
      current: false,
      achievements: ['Delivered features', 'Improved performance'],
      technologies: ['TypeScript', 'Bun'],
    },
  ],
  education: [{ degree: 'BS', institution: 'Uni', field: 'CS', graduationDate: '2018', gpa: '3.8' }],
  skills: ['TypeScript', 'Node', 'Bun'],
  certifications: ['AWS CP'],
}

export const longBulletsResume: ParsedResume = {
  personalInfo: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '555-5555',
    location: 'Remote',
    linkedin: 'https://linkedin.com/in/test',
    website: '',
  },
  summary: 'Experienced engineer with focus on performance and reliability.',
  workExperience: [
    {
      title: 'Engineer',
      company: 'Acme',
      startDate: '2020',
      endDate: '2022',
      current: false,
      achievements: Array.from(
        { length: 20 },
        (_, i) => `Achievement ${i + 1}: ${'Very long detail '.repeat(6)}to force wrapping and pagination.`,
      ),
      technologies: ['TypeScript', 'Node', 'Bun', 'jsPDF'],
    },
  ],
  education: [{ degree: 'BS', institution: 'Uni', field: 'CS', graduationDate: '2018', gpa: '3.8' }],
  skills: ['TypeScript', 'Node', 'Bun', 'jsPDF', 'HTMX', 'Hono'],
  certifications: ['AWS CP'],
}
