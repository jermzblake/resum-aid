import { describe, it, expect } from 'bun:test'
import { createEmptyResume } from '@/utils/resume'

describe('createEmptyResume', () => {
  it('returns a structurally valid empty resume', () => {
    const r = createEmptyResume()

    expect(r).toBeDefined()
    expect(r.personalInfo).toBeDefined()
    expect(typeof r.personalInfo.name).toBe('string')

    // Optional fields can be undefined or string; current defaults
    expect(r.personalInfo.email).toBeUndefined()
    expect(r.personalInfo.phone).toBeUndefined()
    expect(r.personalInfo.location).toBeUndefined()

    expect(typeof r.personalInfo.linkedin).toBe('string')
    expect(typeof r.personalInfo.website).toBe('string')

    expect(typeof r.summary).toBe('string')
    expect(Array.isArray(r.workExperience)).toBe(true)
    expect(Array.isArray(r.education)).toBe(true)
    expect(Array.isArray(r.skills)).toBe(true)
    expect(Array.isArray(r.certifications)).toBe(true)

    expect(r.workExperience.length).toBe(0)
    expect(r.education.length).toBe(0)
    expect(r.skills.length).toBe(0)
    expect(r.certifications.length).toBe(0)
  })
})
