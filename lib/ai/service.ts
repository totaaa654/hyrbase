import { getAIProvider } from "./provider";
import type { AnalysisInput, CoverLetterResult, ResumeAnalysis, ResumeATSResult } from "./types";

/**
 * AIService is the single entry point for all AI features in HyrBase.
 * Server actions and other callers must always go through this class —
 * never call a provider directly.
 *
 * Adding a new AI feature:
 *   1. Add a static method here.
 *   2. Add the method to the AIProvider interface in types.ts.
 *   3. Implement it in gemini.ts (and any future providers).
 */
export class AIService {
  static async analyzeResume(input: AnalysisInput): Promise<ResumeAnalysis> {
    return getAIProvider().analyzeResume(input);
  }

  static async generateCoverLetter(
    input: AnalysisInput
  ): Promise<CoverLetterResult> {
    return getAIProvider().generateCoverLetter(input);
  }

  static async analyzeResumeATS(resumeText: string): Promise<ResumeATSResult> {
    return getAIProvider().analyzeResumeATS(resumeText);
  }

  // Future methods go here:
  // static async generateInterviewQuestions(...) {}
  // static async rewriteResume(...) {}
  // static async generateFollowUpEmail(...) {}
}
