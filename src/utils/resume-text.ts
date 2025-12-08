import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import { Buffer } from 'buffer'

export async function extractResumeText(
  file: File,
  options: { mergePages?: boolean } = { mergePages: true },
): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error('Failed to extract text from the resume file. No file detected.')
  }

  if (
    file.type !== 'application/pdf' &&
    file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
  }

  try {
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await getDocumentProxy(new Uint8Array(buffer))
      const { text } =
        options.mergePages === true
          ? await extractText(pdfDoc, { mergePages: true })
          : await extractText(pdfDoc, { mergePages: false })
      return typeof text === 'string' ? text : text.join('\n')
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      return result.value
    }
  } catch (error) {
    console.error('Error extracting resume text:', error)
    throw new Error('Failed to extract text from the resume file.')
  }
  // if we somehow reach here without returning, throw generic failure
  throw new Error('Failed to extract text from the resume file.')
}
