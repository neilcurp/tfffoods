import type { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import path from "path";
import {
  PDF_FONT_FAMILY,
  PDF_FONT_FILE,
  PDF_FONT_CDN,
} from "@/utils/services/pdfFontConfig";

export {
  PDF_FONT_FAMILY,
  PDF_FONT_URL,
} from "@/utils/services/pdfFontConfig";

let cachedFontBase64: string | null = null;

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;

  const localPath = path.join(process.cwd(), "public", "fonts", PDF_FONT_FILE);
  try {
    const buffer = await readFile(localPath);
    cachedFontBase64 = buffer.toString("base64");
    return cachedFontBase64;
  } catch {
    const response = await fetch(PDF_FONT_CDN);
    if (!response.ok) {
      throw new Error("Failed to load CJK font for PDF generation");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    cachedFontBase64 = buffer.toString("base64");
    return cachedFontBase64;
  }
}

export async function registerPdfFonts(doc: jsPDF): Promise<void> {
  const base64 = await loadFontBase64();
  doc.addFileToVFS(PDF_FONT_FILE, base64);
  doc.addFont(PDF_FONT_FILE, PDF_FONT_FAMILY, "normal");
  doc.setFont(PDF_FONT_FAMILY, "normal");
}

/** Re-apply after addPage() — jsPDF resets to default font on new pages. */
export function ensurePdfFont(doc: jsPDF): void {
  doc.setFont(PDF_FONT_FAMILY, "normal");
}

export async function createPdfDocument(): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  await registerPdfFonts(doc);
  return doc;
}
