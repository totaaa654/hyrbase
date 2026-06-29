"use server";

import { extractText } from "unpdf";

/**
 * Extracts ordered plain text from a text-based PDF buffer using unpdf.
 * Pages are concatenated in document order separated by double newlines.
 * Throws descriptive errors — never returns null.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty buffer — no PDF data received.");
  }

  let pages: string[];
  try {
    const result = await extractText(new Uint8Array(buffer), { mergePages: false });
    pages = result.text;
  } catch (err) {
    throw new Error(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const fullText = pages
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

  if (!fullText) {
    throw new Error(
      "No extractable text found in this PDF. " +
        "Make sure it is a text-based PDF, not a scanned image."
    );
  }

  return fullText;
}
