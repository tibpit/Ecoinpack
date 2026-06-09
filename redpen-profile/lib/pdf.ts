// unpdf ships a serverless build of pdfjs with no DOM/canvas dependency —
// required for the Cloudflare Workers runtime (workerd).
import { extractText, getDocumentProxy } from "unpdf";

export class UnreadablePdfError extends Error {
  constructor(message = "Could not extract text from this PDF") {
    super(message);
  }
}

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB — "Save to PDF" exports are well under this

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new UnreadablePdfError("PDF is larger than 5 MB");
  }
  let text: string;
  try {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    text = result.text ?? "";
  } catch {
    throw new UnreadablePdfError();
  }
  const cleaned = text.replace(/\u0000/g, "").trim();
  if (cleaned.length < 100) {
    // Scanned/image PDFs produce empty or near-empty text
    throw new UnreadablePdfError(
      "This PDF contains no extractable text. Use LinkedIn's own \"Save to PDF\" export, or paste your profile as text."
    );
  }
  return cleaned;
}
