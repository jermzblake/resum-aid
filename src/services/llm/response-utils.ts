import { z } from 'zod'

/**
 * Trim, strip markdown code fences (``` or ```lang), parse JSON, and validate via Zod.
 * Returns typed result or throws with informative error messages.
 */
export function parseJsonResponse<T>(
  raw: string,
  schema: z.ZodType<T>,
  options?: { stripCodeFences?: boolean; requireJsonOnly?: boolean },
): T {
  const strip = options?.stripCodeFences !== false
  const requireJsonOnly = options?.requireJsonOnly === true

  let cleaned = (raw || '').trim()

  if (strip) {
    // Remove leading and trailing code fences if present: ```json ... ``` or ``` ... ```
    const fenceStart = cleaned.match(/^```([a-zA-Z]+)?\s*/)
    const fenceEnd = cleaned.match(/\s*```$/)
    if (fenceStart && fenceEnd) {
      // Remove opening fence (with optional language) and closing fence
      cleaned = cleaned
        .replace(/^```[a-zA-Z]*\s*/, '')
        .replace(/\s*```$/, '')
        .trim()
    }
  }

  if (requireJsonOnly) {
    // Basic JSON shape enforcement: start with { or [ and end with } or ]
    const startsJson = cleaned.startsWith('{') || cleaned.startsWith('[')
    const endsJson = cleaned.endsWith('}') || cleaned.endsWith(']')
    if (!startsJson || !endsJson) {
      throw new Error('Invalid JSON response from LLM: expected pure JSON content.')
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch (e: any) {
    throw new Error(`Invalid JSON response from LLM: ${e?.message || String(e)}`)
  }

  try {
    return schema.parse(parsed)
  } catch (e: any) {
    throw new Error(`Validation failed for LLM JSON: ${e?.message || String(e)}`)
  }
}
