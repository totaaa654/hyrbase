export interface AnalysisInput {
  resumeText: string;
  jobDescription: string;
  companyName: string;
  position: string;
}

/** Returned by analyzeResume() — never contains cover letter content. */
export interface ResumeAnalysis {
  resume_match: number;
  ats_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  suggestions: string[];
}

/** Returned by generateCoverLetter() — a separate AI request. */
export interface CoverLetterResult {
  coverLetter: string;
}

/** Returned by analyzeResumeATS() — standalone resume quality score. */
export interface ResumeATSResult {
  ats_score: number;
  status: "Excellent" | "Good" | "Fair" | "Poor";
}

export interface AIProvider {
  analyzeResume(input: AnalysisInput): Promise<ResumeAnalysis>;
  generateCoverLetter(input: AnalysisInput): Promise<CoverLetterResult>;
  analyzeResumeATS(resumeText: string): Promise<ResumeATSResult>;
}
