function sanitizeBaseName(raw: string | undefined): string {
  const fallback = 'resume'
  if (!raw || !raw.trim()) return fallback
  let s = raw.trim()
  // Remove CRLF and control chars
  s = s.replace(/[\r\n]+/g, ' ').replace(/[\x00-\x1F\x7F]/g, '')
  // Strip quotes and path separators and reserved chars * ? < > | :
  s = s.replace(/["\\/<>|:*?]+/g, ' ')
  // Collapse whitespace and underscores
  s = s.replace(/\s+/g, ' ')
  s = s.replace(/\s/g, '_')
  // Limit length
  if (s.length > 100) s = s.slice(0, 100)
  s = s.replace(/^_+|_+$/g, '')
  // Ensure non-empty
  if (!s) return fallback
  return s
}

function toAsciiSafe(input: string): string {
  // Remove non-ASCII for the plain filename fallback
  return input.replace(/[^\x20-\x7E]/g, '')
}

function encodeRFC5987(value: string): string {
  // Percent-encode UTF-8 for filename*
  // encodeURIComponent handles UTF-8; also escape `!'()*` for strict RFC
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

export function getSafeDownloadHeaders(baseName: string | undefined, ext = '.pdf') {
  const sanitized = sanitizeBaseName(baseName)
  const finalName = `${sanitized}_resume${ext}`
  const ascii = toAsciiSafe(finalName)
  const encoded = encodeRFC5987(finalName)
  const contentDisposition = `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`
  return {
    contentType: 'application/pdf',
    contentDisposition,
    filename: finalName,
  }
}
