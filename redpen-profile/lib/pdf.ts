import { PDFParse } from "pdf-parse";

export class UnreadablePdfError extends Error {
  constructor(message = "Could not extract text from this PDF") {
    super(message);
  }
}

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB — "Save to PDF" exports are well under this

export async function extractPdfText(buffer: Buffer): Promise<string> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    throw new UnreadablePdfError("PDF is larger than 5 MB");
  }
  let text: string;
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    text = result.text ?? "";
  } catch {
    throw new UnreadablePdfError();
  } finally {
    await parser.destroy().catch(() => {});
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
