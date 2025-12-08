import jsPDF from 'jspdf'
import type { ParsedResume } from '@/types'

export class PDFGeneratorService {
  /**
   * Generate a professional single-page resume PDF from ParsedResume
   * Optimized for ATS (Applicant Tracking Systems) with clean formatting
   */
  generateResumePDF(resume: ParsedResume): Uint8Array {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 40
    const contentWidth = pageWidth - 2 * margin

    let yPosition = margin

    const colors = {
      headerText: [0, 0, 0],
      sectionTitle: [40, 40, 40],
      bodyText: [50, 50, 50],
      accentLine: [220, 220, 220],
    } as const

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
    }

    // ===== HEADER / CONTACT INFO =====
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...(colors.headerText as [number, number, number]))
    doc.text(resume.personalInfo.name, margin, yPosition)
    yPosition += 20

    // Contact line
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...(colors.bodyText as [number, number, number]))

    const contactParts: string[] = []
    if (resume.personalInfo.email) contactParts.push(resume.personalInfo.email)
    if (resume.personalInfo.phone) contactParts.push(resume.personalInfo.phone)
    if (resume.personalInfo.location) contactParts.push(resume.personalInfo.location)
    if (resume.personalInfo.linkedin && resume.personalInfo.linkedin !== '') {
      contactParts.push(this.stripUrl(resume.personalInfo.linkedin))
    }

    const contactText = contactParts.join(' • ')
    doc.text(contactText, margin, yPosition, { maxWidth: contentWidth })
    yPosition += 14

    // Divider line
    doc.setDrawColor(...(colors.accentLine as [number, number, number]))
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // ===== Helpers for accurate pagination =====
    // Typography & spacing tuning
    const lineHeightFor = (fontSize: number) => Math.round(fontSize * 1.4)
    const gaps = {
      sectionTop: 14,
      sectionBottom: 10,
      block: 8,
      bullet: 4,
    }
    const measureWrappedTextHeight = (text: string | string[], maxWidth: number, fontSize: number) => {
      const lines = Array.isArray(text) ? text : doc.splitTextToSize(text, maxWidth)
      const h = (doc as any).getTextDimensions
        ? (doc as any).getTextDimensions(lines).h
        : lines.length * lineHeightFor(fontSize)
      return { lines, height: Math.ceil(h) }
    }
    const drawWrappedText = (text: string | string[], x: number, y: number, maxWidth: number, fontSize: number) => {
      doc.setFontSize(fontSize)
      const { lines, height } = measureWrappedTextHeight(text, maxWidth, fontSize)
      doc.text(lines, x, y, { maxWidth })
      return height
    }

    // ===== PROFESSIONAL SUMMARY =====
    if (resume.summary && resume.summary.trim().length > 0) {
      // Section title
      const titleFont = 12
      const titleH = lineHeightFor(titleFont)
      checkPageBreak(titleH)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(titleFont)
      doc.setTextColor(...(colors.sectionTitle as [number, number, number]))
      doc.text('Professional Summary', margin, yPosition)
      yPosition += titleH + gaps.sectionTop

      // Content
      const contentFont = 10
      const { height: summaryH } = measureWrappedTextHeight(resume.summary, contentWidth, contentFont)
      checkPageBreak(summaryH)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(contentFont)
      doc.setTextColor(...(colors.bodyText as [number, number, number]))
      const drawnH = drawWrappedText(resume.summary, margin, yPosition, contentWidth, contentFont)
      yPosition += drawnH + gaps.sectionBottom
    }

    // ===== WORK EXPERIENCE =====
    if (resume.workExperience.length > 0) {
      // Section header
      const headerFont = 12
      const headerH = lineHeightFor(headerFont)
      checkPageBreak(headerH)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(headerFont)
      doc.setTextColor(...(colors.sectionTitle as [number, number, number]))
      doc.text('Work Experience', margin, yPosition)
      yPosition += headerH + gaps.sectionTop

      for (const job of resume.workExperience) {
        // Job block

        // Job title and company
        const jobTitleFont = 11
        const jobTitleH = lineHeightFor(jobTitleFont)
        checkPageBreak(jobTitleH)
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(jobTitleFont)
        doc.setTextColor(...(colors.headerText as [number, number, number]))
        doc.text(job.title, margin, yPosition)

        const dateText = job.endDate
          ? `${job.startDate} - ${job.endDate}`
          : job.current
            ? `${job.startDate} - Present`
            : job.startDate
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(10)
        const dateWidth = doc.getTextWidth(dateText)
        doc.text(dateText, pageWidth - margin - dateWidth, yPosition)

        yPosition += jobTitleH

        // Company name
        const companyFont = 10
        const companyH = lineHeightFor(companyFont)
        checkPageBreak(companyH)
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(companyFont)
        doc.setTextColor(...(colors.bodyText as [number, number, number]))
        doc.text(job.company, margin, yPosition)
        yPosition += companyH

        // Team size if present
        if (job.teamSize) {
          const teamFont = 9
          const teamH = lineHeightFor(teamFont)
          checkPageBreak(teamH)
          doc.setFontSize(teamFont)
          doc.text(`Team Size: ${job.teamSize} people`, margin, yPosition)
          yPosition += teamH
        }

        // Achievements/bullets
        if (job.achievements.length > 0) {
          for (const achievement of job.achievements) {
            const bulletFont = 10
            const { lines, height } = measureWrappedTextHeight(achievement, contentWidth - 20, bulletFont)
            checkPageBreak(height)
            doc.setFont('Helvetica', 'normal')
            doc.setFontSize(bulletFont)
            // Bullet glyph and text on same baseline
            doc.text('•', margin + 4, yPosition)
            doc.text(lines, margin + 18, yPosition, { maxWidth: contentWidth - 20 })
            yPosition += height + gaps.bullet
          }
        }

        // Technologies if present
        if (job.technologies.length > 0) {
          const techFont = 9
          const { height: techH } = measureWrappedTextHeight(
            `Tech: ${job.technologies.join(', ')}`,
            contentWidth,
            techFont,
          )
          checkPageBreak(techH)
          doc.setFontSize(techFont)
          doc.setFont('Helvetica', 'italic')
          doc.setTextColor(100, 100, 100)
          drawWrappedText(`Tech: ${job.technologies.join(', ')}`, margin, yPosition, contentWidth, techFont)
          yPosition += techH
          doc.setTextColor(...(colors.bodyText as [number, number, number]))
        }
        yPosition += gaps.block
      }

      yPosition += gaps.sectionBottom
    }

    // ===== EDUCATION =====
    if (resume.education.length > 0) {
      const eduHeaderFont = 12
      const eduHeaderH = lineHeightFor(eduHeaderFont)
      checkPageBreak(eduHeaderH)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(eduHeaderFont)
      doc.setTextColor(...(colors.sectionTitle as [number, number, number]))
      doc.text('Education', margin, yPosition)
      yPosition += eduHeaderH + gaps.sectionTop

      for (const edu of resume.education) {
        // Degree
        const degreeFont = 11
        const degreeH = lineHeightFor(degreeFont)
        checkPageBreak(degreeH)
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(degreeFont)
        doc.setTextColor(...(colors.headerText as [number, number, number]))
        const degreeText = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree
        doc.text(degreeText, margin, yPosition)
        yPosition += degreeH

        // Institution
        const instFont = 10
        const instH = lineHeightFor(instFont)
        checkPageBreak(instH)
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(instFont)
        doc.setTextColor(...(colors.bodyText as [number, number, number]))
        doc.text(edu.institution, margin, yPosition)
        yPosition += instH

        // Date and GPA
        if (edu.graduationDate || edu.gpa) {
          const detailsFont = 9
          const detailsText = [
            edu.graduationDate ? `Graduated: ${edu.graduationDate}` : null,
            edu.gpa ? `GPA: ${edu.gpa}` : null,
          ]
            .filter(Boolean)
            .join(' • ')
          const { height: detailsH } = measureWrappedTextHeight(detailsText, contentWidth, detailsFont)
          checkPageBreak(detailsH)
          doc.setFontSize(detailsFont)
          drawWrappedText(detailsText, margin, yPosition, contentWidth, detailsFont)
          yPosition += detailsH
        }
        yPosition += gaps.block
      }
      yPosition += gaps.sectionBottom
    }

    // ===== SKILLS =====
    if (resume.skills.length > 0) {
      const skillsHeaderFont = 12
      const skillsHeaderH = lineHeightFor(skillsHeaderFont)
      checkPageBreak(skillsHeaderH)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(skillsHeaderFont)
      doc.setTextColor(...(colors.sectionTitle as [number, number, number]))
      doc.text('Skills', margin, yPosition)
      yPosition += skillsHeaderH + gaps.sectionTop

      doc.setFont('Helvetica', 'normal')
      const skillsFont = 10
      doc.setFontSize(skillsFont)
      doc.setTextColor(...(colors.bodyText as [number, number, number]))
      const skillsText = resume.skills.join(', ')
      const { height: skillsH } = measureWrappedTextHeight(skillsText, contentWidth, skillsFont)
      checkPageBreak(skillsH)
      drawWrappedText(skillsText, margin, yPosition, contentWidth, skillsFont)
      yPosition += skillsH + gaps.sectionBottom
    }

    // ===== CERTIFICATIONS =====
    if (resume.certifications.length > 0) {
      const certHeaderFont = 12
      const certHeaderH = lineHeightFor(certHeaderFont)
      checkPageBreak(certHeaderH)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(certHeaderFont)
      doc.setTextColor(...(colors.sectionTitle as [number, number, number]))
      doc.text('Certifications', margin, yPosition)
      yPosition += certHeaderH + gaps.sectionTop

      for (const cert of resume.certifications) {
        const certFont = 10
        const { height: certH } = measureWrappedTextHeight(`• ${cert}`, contentWidth - 18, certFont)
        checkPageBreak(certH)
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(certFont)
        doc.setTextColor(...(colors.bodyText as [number, number, number]))
        drawWrappedText(`• ${cert}`, margin + 4, yPosition, contentWidth - 18, certFont)
        yPosition += certH + gaps.bullet
      }
    }

    const buffer = doc.output('arraybuffer')
    return new Uint8Array(buffer)
  }

  /**
   * Strip URL to just domain for readability
   */
  private stripUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }
}
