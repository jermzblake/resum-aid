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
