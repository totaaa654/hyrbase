export interface ResumeATSScore {
  id: string;
  resume_id: string;
  user_id: string;
  ats_score: number;
  status: "Excellent" | "Good" | "Fair" | "Poor";
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysisRecord {
  id: string;
  application_id: string;
  resume_id: string | null;
  resume_match: number;
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  matching_skills: string[];
  missing_skills: string[];
  summary: string | null;
  suggestions: string[];
  generated_cover_letter: string | null;
  ai_provider: string;
  created_at: string;
}
