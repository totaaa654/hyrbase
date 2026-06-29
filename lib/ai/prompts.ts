import type { AnalysisInput } from "./types";

/**
 * Concise analysis prompt — structured JSON output only.
 * Kept intentionally short to minimise prompt tokens and reduce
 * the risk of the model running out of output budget.
 */
export function buildAnalysisPrompt(input: AnalysisInput): string {
  return `You are a resume analyst. Return ONLY valid JSON, no other text.

Company: ${input.companyName}
Position: ${input.position}

JOB DESCRIPTION:
${input.jobDescription}

RESUME:
${input.resumeText}

Return this exact JSON shape with no extra fields:
{"resume_match":0,"ats_score":0,"matching_skills":[],"missing_skills":[],"strengths":[],"weaknesses":[],"summary":"","suggestions":[]}

Constraints:
- resume_match, ats_score: integers 0-100
- Each array: minimum 3 string items
- summary: 2-3 sentences
- Never use phrases like "chance of getting hired"`;
}

/**
 * Standalone resume ATS prompt — returns ONLY a two-field JSON object.
 * Intentionally minimal to stay well within free-tier token limits.
 */
export function buildResumeATSPrompt(resumeText: string): string {
  return `Evaluate this resume for ATS compatibility. Return ONLY valid JSON, no other text.

Resume:
${resumeText}

Return exactly this JSON shape:
{"ats_score": <integer 0-100>, "status": "<Excellent|Good|Fair|Poor>"}

Score guide: 90-100=Excellent, 75-89=Good, 60-74=Fair, below 60=Poor
Evaluate: keyword presence, section structure, contact info, formatting clarity, quantified achievements.
Return ONLY the JSON object.`;
}

/**
 * Cover letter prompt — plain text output only, no JSON.
 */
export function buildCoverLetterPrompt(input: AnalysisInput): string {
  return `Write a professional cover letter for this job application.

Company: ${input.companyName}
Position: ${input.position}

JOB DESCRIPTION:
${input.jobDescription}

CANDIDATE RESUME:
${input.resumeText}

Requirements:
- 3-4 paragraphs
- Professional tone, no filler phrases
- Personalized to this specific company and role
- Reference concrete skills and experience from the resume
- No markdown, no subject line, no date, no placeholders
- Return only the cover letter text`;
}
