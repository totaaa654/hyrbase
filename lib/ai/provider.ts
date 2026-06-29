import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";

export function getAIProvider(): AIProvider {
  return new GeminiProvider();
}
