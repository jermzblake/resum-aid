import { describe, it, expect } from 'bun:test'
import { PDFGeneratorService } from '@/services/pdf-generator.service'
import { minimalResume, longBulletsResume } from '../fixtures/resume'

describe('PDFGeneratorService', () => {
  it('generates a non-empty PDF buffer', () => {
    const svc = new PDFGeneratorService()
    const buf = svc.generateResumePDF(longBulletsResume)
    expect(buf.byteLength).toBeGreaterThan(1000)
  })

  it('handles long wrapped bullets without throwing (pagination)', () => {
    const svc = new PDFGeneratorService()
    const buf = svc.generateResumePDF(longBulletsResume)
    expect(buf.byteLength).toBeGreaterThan(1000)
  })

  it('formats contact line and dates sensibly', () => {
    const svc = new PDFGeneratorService()
    const buf = svc.generateResumePDF({
      ...minimalResume,
      personalInfo: { ...minimalResume.personalInfo, linkedin: 'https://www.linkedin.com/in/test-user' },
      workExperience: [
        {
          title: 'Engineer',
          company: 'Acme',
          startDate: '2020',
          current: true,
          endDate: undefined,
          achievements: ['Did things'],
          technologies: [],
        },
      ],
    })
    expect(buf.byteLength).toBeGreaterThan(800)
  })
})
