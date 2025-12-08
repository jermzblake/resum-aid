export const matchJobPrompt = (resume: string, jobDescription: string) => {
  return `Given the following resume and job description, evaluate how well the resume matches the job requirements. Provide a match score from 1 to 100, list key strengths of the resume in relation to the job, identify any gaps or weaknesses, and offer recommendations for improvement.
  Generate the response in the following JSON format:
{
  "score": number, // Match score from 1 to 100
  "strengths": string[], // List of strengths
  "gaps": string[], // List of gaps or weaknesses
  "recommendations": string[] // List of recommendations for improvement
}

Resume: """${resume}"""

Job Description: """${jobDescription}"""`
}

export const analyzeBulletPrompt = (bullet: string) => {
  return `Analyze the following resume bullet point for clarity, impact, and overall quality. Provide a score from 1 to 10, constructive feedback, and an improved version of the bullet point. 

Bullet Point: "${bullet}"

Format the response as a JSON object with the following structure:
{
  "score": numeric score from 1 to 10,
  "feedback": "constructive feedback",
  "improved": "improved bullet point"
}`
}

export const extractResumePrompt = (resumeText: string) => {
  return `Extract and structure the following resume text into a professional JSON format. Identify any missing critical information (gaps).

Resume Text:
"""${resumeText}"""

RESPOND WITH ONLY VALID JSON, NO MARKDOWN CODE BLOCKS OR EXPLANATIONS.

Parse this into the following JSON structure:
{
  "resume": {
    "personalInfo": {
      "name": "string (required, extracted from resume)",
      "email": "string (optional, valid email format)",
      "phone": "string (optional, phone number)",
      "location": "string (optional, city/state or full location)",
      "linkedin": "string (optional, full URL or empty string)",
      "website": "string (optional, full URL or empty string)"
    },
    "summary": "string (optional, professional summary if available)",
    "workExperience": [
      {
        "company": "string (required)",
        "title": "string (required)",
        "startDate": "string (required, format: YYYY-MM or similar)",
        "endDate": "string (optional)",
        "current": "boolean (true if currently employed there)",
        "teamSize": "number (optional, if mentioned)",
        "achievements": ["array of specific accomplishments"],
        "technologies": ["array of tools/tech used"]
      }
    ],
    "education": [
      {
        "institution": "string (required)",
        "degree": "string (required)",
        "field": "string (optional, major/field of study)",
        "graduationDate": "string (optional, format: YYYY-MM or similar)",
        "gpa": "string (optional)"
      }
    ],
    "skills": ["array of skills extracted"],
    "certifications": ["array of certifications if listed"]
  },
  "gaps": [
    {
      "section": "workExperience|education|personalInfo|skills",
      "field": "the specific field name that's missing or incomplete",
      "message": "human-friendly message explaining what's missing",
      "index": "number (only for array items like workExperience[0])"
    }
  ],
  "extractionNotes": "string with any observations about the resume quality or extraction confidence"
}

Important:
Strict formatting rules to ensure valid data:
- Do NOT return null anywhere. If unknown, use an empty string for optional strings, false for optional booleans, and empty arrays for optional lists.
- For personalInfo.linkedin and personalInfo.website, ALWAYS include the full URL scheme. Prefer https://... If only a handle or domain is present, convert to a full https:// URL. If unknown, use an empty string.
- Dates (e.g., startDate, endDate, graduationDate) MUST be strings. Prefer YYYY-MM. If only year is known, use YYYY.
- GPA MUST be a string (e.g., "3.7"), even if the source is numeric.
- Arrays (e.g., skills, certifications, achievements, technologies) MUST be arrays. If none found, return an empty array.
- For gaps: only include critical missing fields (email, phone, work experience titles, etc.).
- Achievements should be specific accomplishments, not generic descriptions.
- Be generous with extraction—if a field might contain useful info, include it.
- For work experience with no end date, infer current: true if context suggests they still work there.`
}

export const generateBulletsPrompt = (context: { title: string; company: string; description: string }) => {
  return `Generate 3-4 impressive resume bullet points for the following role using the XYZ formula (Accomplished X as measured by Y by doing Z). Make them quantifiable, impactful, and ATS-friendly.

Role Context:
- Company: ${context.company}
- Title: ${context.title}
- Description/Context: ${context.description}

RESPOND WITH ONLY VALID JSON, NO MARKDOWN CODE BLOCKS OR EXPLANATIONS.

Return a JSON object with this structure:
{
  "bullets": [
    "bullet point 1 with metrics",
    "bullet point 2 with metrics",
    "bullet point 3 with metrics",
    "bullet point 4 with metrics (optional)"
  ]
}

Guidelines:
- Use strong action verbs
- Include specific metrics (%, $, #, timeframes)
- Keep each bullet under 2 lines
- Focus on business impact and value delivered
- Avoid generic phrases like "responsible for" or "worked on"`
}
