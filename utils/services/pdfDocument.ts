import type { jsPDF } from "jspdf";
import { connectToDatabase } from "@/utils/database";
import StoreSettings from "@/utils/models/StoreSettings";
import { ensurePdfFont } from "@/utils/services/pdfFonts";

export { createPdfDocument } from "@/utils/services/pdfFonts";

export type SupportedLanguage = "en" | "zh-TW";

type MultiLang = { en?: string; "zh-TW"?: string } | undefined | null;

export interface StoreBranding {
  storeName: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
}

interface LogoImage {
  dataUrl: string;
  format: "PNG" | "JPEG" | "WEBP";
}

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const ACCENT: [number, number, number] = [83, 92, 145];
const MUTED: [number, number, number] = [110, 110, 110];

export function resolveLanguage(value: string | null | undefined): SupportedLanguage {
  return value === "zh-TW" ? "zh-TW" : "en";
}

export function pickLang(value: MultiLang, language: SupportedLanguage): string {
  if (!value) return "";
  return value[language] || value.en || value["zh-TW"] || "";
}

export function formatMoney(amount: number | undefined | null): string {
  return `$${(amount || 0).toFixed(2)}`;
}

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.4;

/** Default PDF text is ~18% smaller than raw jsPDF point sizes — keeps cards compact on A4. */
const FONT_BASE = 0.82;

function fontPt(pt: number, scale = 1): number {
  return pt * FONT_BASE * scale;
}

function gap(mm: number, scale = 1): number {
  return mm * FONT_BASE * scale;
}

/**
 * Parse a `?scale=` query value into a safe font-scale multiplier.
 * Falls back to 1 (current default look) and clamps to a sane range so
 * documents never become unreadable or overflow the page.
 */
export function resolveScale(value: string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, parsed));
}

export async function loadStoreBranding(
  language: SupportedLanguage
): Promise<StoreBranding> {
  await connectToDatabase();
  const settings: any = await StoreSettings.findOne().lean();

  const office = settings?.contactPage?.contactInfo?.officeLocations?.[0];

  return {
    storeName: pickLang(settings?.storeName, language) || "tfffoods",
    logoUrl: typeof settings?.logo === "string" ? settings.logo : "",
    email: settings?.contactInfo?.email || office?.email || "",
    phone: settings?.contactInfo?.phone || office?.phone || "",
    address: pickLang(office?.address, language),
  };
}

export async function fetchLogoImage(
  logoUrl: string
): Promise<LogoImage | null> {
  if (!logoUrl || !/^https?:\/\//i.test(logoUrl)) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString("base64");

    let format: LogoImage["format"] = "PNG";
    let mime = "image/png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      format = "JPEG";
      mime = "image/jpeg";
    } else if (contentType.includes("webp")) {
      format = "WEBP";
      mime = "image/webp";
    } else if (contentType.includes("png")) {
      format = "PNG";
      mime = "image/png";
    }

    return { dataUrl: `data:${mime};base64,${base64}`, format };
  } catch {
    return null;
  }
}

const CARD_TITLE_PT = 8;

export function drawDocumentHeader(
  doc: jsPDF,
  options: {
    branding: StoreBranding;
    logo: LogoImage | null;
    title: string;
    scale?: number;
  }
): number {
  const { branding, logo, title, scale = 1 } = options;
  const headerTop = 12;
  let logoBottom = headerTop;

  if (logo) {
    try {
      const props = doc.getImageProperties(logo.dataUrl);
      const maxWidth = 36;
      const maxHeight = 14;
      const ratio = props.width / props.height;
      let width = maxWidth;
      let height = width / ratio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }
      doc.addImage(logo.dataUrl, logo.format, MARGIN, headerTop, width, height);
      logoBottom = headerTop + height;
    } catch {
      logoBottom = headerTop;
    }
  }

  if (!logo) {
    doc.setFontSize(fontPt(CARD_TITLE_PT, scale));
    doc.setTextColor(...ACCENT);
    doc.text(branding.storeName, MARGIN, headerTop + gap(4, scale));
    logoBottom = headerTop + gap(6, scale);
  }

  // Company contact block — same size as card section titles
  doc.setFontSize(fontPt(CARD_TITLE_PT, scale));
  doc.setTextColor(...MUTED);
  let infoY = headerTop + gap(1, scale);
  const infoLines: string[] = [];
  if (logo && branding.storeName) infoLines.push(branding.storeName);
  if (branding.address) infoLines.push(branding.address);
  if (branding.phone) infoLines.push(`Tel: ${branding.phone}`);
  if (branding.email) infoLines.push(branding.email);

  infoLines.forEach((raw) => {
    const wrapped = doc.splitTextToSize(raw, 90) as string[];
    wrapped.forEach((line) => {
      doc.text(line, CONTENT_RIGHT, infoY, { align: "right" });
      infoY += gap(4.2, scale);
    });
  });

  const dividerY = Math.max(logoBottom, infoY) + 2;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, dividerY, CONTENT_RIGHT, dividerY);

  // Document title — bold, centered on the page
  const titleY = dividerY + gap(6, scale);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontPt(10, scale));
  doc.setTextColor(40, 40, 40);
  doc.text(title, PAGE_WIDTH / 2, titleY, { align: "center" });

  ensurePdfFont(doc);
  doc.setTextColor(0, 0, 0);
  return titleY + gap(5, scale);
}

const PAID_GREEN: [number, number, number] = [34, 139, 87];
const PAID_GREEN_TEXT: [number, number, number] = [22, 120, 72];
const PAID_GREEN_BG: [number, number, number] = [232, 245, 236];

/** Soft pill badge — right-aligned on the Order Summary title row. */
function drawPaymentConfirmedBadge(
  doc: jsPDF,
  rightX: number,
  titleBaselineY: number,
  scale = 1
): void {
  const label = "Payment confirmed";
  const titleSize = fontPt(CARD_TITLE_PT, scale);
  const fontSize = fontPt(6, scale);
  const padX = gap(3, scale);
  const pillH = gap(5.5, scale);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  const textW = doc.getTextWidth(label);
  const pillW = textW + padX * 2;
  const pillX = rightX - pillW;

  // Vertically center the pill against the section title
  const titleMidY = titleBaselineY - titleSize * 0.3;
  const pillY = titleMidY - pillH / 2;
  const textCenterX = pillX + pillW / 2;
  const textCenterY = pillY + pillH / 2;

  doc.setFillColor(...PAID_GREEN_BG);
  doc.setDrawColor(...PAID_GREEN);
  doc.setLineWidth(0.25);
  doc.roundedRect(pillX, pillY, pillW, pillH, pillH / 2, pillH / 2, "FD");

  doc.setTextColor(...PAID_GREEN_TEXT);
  doc.text(label, textCenterX, textCenterY, {
    align: "center",
    baseline: "middle",
  } as any);
  doc.setTextColor(0, 0, 0);
  ensurePdfFont(doc);
}

/**
 * @deprecated Payment confirmed is now drawn inside the Order Summary card.
 */
export function drawPaidBadge(
  doc: jsPDF,
  _bodyTopY: number,
  _scale = 1
): void {
  // no-op — kept for backwards compatibility
}

export interface PdfLineItem {
  name: string;
  quantity: number;
  price: number;
}

export function drawDocumentFooter(
  doc: jsPDF,
  branding: StoreBranding,
  scale = 1
): void {
  const footerY = 285;
  doc.setDrawColor(225, 225, 225);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 4, CONTENT_RIGHT, footerY - 4);

  const parts = [branding.storeName, branding.phone, branding.email].filter(
    Boolean
  );
  doc.setFontSize(fontPt(7, scale));
  doc.setTextColor(...MUTED);
  doc.text(parts.join("  ·  "), PAGE_WIDTH / 2, footerY, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

/* -------------------------------------------------------------------------- */
/* Card-based document layout (light / print-friendly, mirrors the web UI)    */
/* -------------------------------------------------------------------------- */

const CARD_BORDER: [number, number, number] = [225, 227, 234];
const CARD_BG: [number, number, number] = [249, 250, 251];
const LABEL_GRAY: [number, number, number] = [120, 122, 132];
const VALUE_DARK: [number, number, number] = [33, 37, 41];
const TABLE_STRIPE: [number, number, number] = [245, 246, 248];

const CONTENT_WIDTH = CONTENT_RIGHT - MARGIN;
const COL_GAP = 8;
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2;
const CARD_PAD_X = 5;
const CARD_PAD_TOP = 6;
const CARD_TITLE_GAP = 4.5;
const CARD_PAD_BOTTOM = 4;

export interface DocKeyValue {
  label: string;
  value: string;
}

export interface DocModel {
  /** Document title, e.g. "INVOICE" | "RECEIPT" | "ORDER". */
  label: string;
  paid: boolean;
  detailsTitle: string;
  detailRows: DocKeyValue[];
  paymentRows: DocKeyValue[];
  billingAddress: string;
  shippingAddress: string;
  items: PdfLineItem[];
  totals: { subtotal: number; deliveryCost: number; total: number };
}

function drawCardBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2.5, 2.5, "FD");
}

function drawCardTitle(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  scale: number
): void {
  doc.setFontSize(fontPt(CARD_TITLE_PT, scale));
  doc.setTextColor(...ACCENT);
  doc.text(label.toUpperCase(), x, y);
  doc.setTextColor(0, 0, 0);
}

function measureRows(
  doc: jsPDF,
  rows: DocKeyValue[],
  scale: number,
  maxWidth: number
): number {
  const labelGap = gap(3.2, scale);
  const valueLine = gap(3.5, scale);
  const blockGap = gap(2, scale);
  let h = 0;
  doc.setFontSize(fontPt(8, scale));
  for (const r of rows) {
    h += labelGap;
    const lines = doc.splitTextToSize(r.value || "-", maxWidth) as string[];
    h += Math.max(lines.length, 1) * valueLine + blockGap;
  }
  return h;
}

function drawRows(
  doc: jsPDF,
  x: number,
  yStart: number,
  rows: DocKeyValue[],
  scale: number,
  maxWidth: number
): number {
  const labelGap = gap(3.2, scale);
  const valueLine = gap(3.5, scale);
  const blockGap = gap(2, scale);
  let y = yStart;
  for (const r of rows) {
    doc.setFontSize(fontPt(6.5, scale));
    doc.setTextColor(...LABEL_GRAY);
    doc.text(r.label, x, y);
    y += labelGap;
    doc.setFontSize(fontPt(8, scale));
    doc.setTextColor(...VALUE_DARK);
    const lines = doc.splitTextToSize(r.value || "-", maxWidth) as string[];
    lines.forEach((line) => {
      doc.text(line, x, y);
      y += valueLine;
    });
    y += blockGap;
  }
  doc.setTextColor(0, 0, 0);
  return y;
}

function measureItemsTable(
  doc: jsPDF,
  items: PdfLineItem[],
  left: number,
  right: number,
  scale: number
): number {
  const itemX = left + 3;
  const qtyX = right - 56;
  const itemMaxW = qtyX - 8 - itemX;
  const rowLine = gap(4, scale);
  let h = gap(6.5, scale);
  doc.setFontSize(fontPt(8, scale));
  for (const it of items) {
    const lines = doc.splitTextToSize(it.name || "Product", itemMaxW) as string[];
    h += Math.max(lines.length * rowLine, gap(5.5, scale)) + gap(2.5, scale);
  }
  return h;
}

function drawModernItemsTable(
  doc: jsPDF,
  items: PdfLineItem[],
  left: number,
  right: number,
  startY: number,
  scale: number
): number {
  const itemX = left + 3;
  const totalX = right - 3;
  const priceX = right - 28;
  const qtyX = right - 56;
  const itemMaxW = qtyX - 8 - itemX;
  const rowLine = gap(4, scale);
  let y = startY;

  doc.setFillColor(...ACCENT);
  doc.rect(left, y, right - left, gap(6.5, scale), "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(fontPt(7, scale));
  const headerTextY = y + gap(4.5, scale);
  doc.text("ITEM", itemX, headerTextY);
  doc.text("QTY", qtyX, headerTextY, { align: "center" });
  doc.text("PRICE", priceX, headerTextY, { align: "right" });
  doc.text("TOTAL", totalX, headerTextY, { align: "right" });
  y += gap(6.5, scale);

  doc.setFontSize(fontPt(8, scale));
  items.forEach((it, idx) => {
    const lines = doc.splitTextToSize(it.name || "Product", itemMaxW) as string[];
    const rowH = Math.max(lines.length * rowLine, gap(5.5, scale)) + gap(2.5, scale);
    if (idx % 2 === 1) {
      doc.setFillColor(...TABLE_STRIPE);
      doc.rect(left, y, right - left, rowH, "F");
    }
    const textY = y + gap(4, scale);
    doc.setTextColor(...VALUE_DARK);
    lines.forEach((line, i) => doc.text(line, itemX, textY + i * rowLine));
    const lineTotal = (it.quantity || 0) * (it.price || 0);
    doc.text(String(it.quantity ?? 0), qtyX, textY, { align: "center" });
    doc.text(formatMoney(it.price), priceX, textY, { align: "right" });
    doc.text(formatMoney(lineTotal), totalX, textY, { align: "right" });
    y += rowH;
  });
  doc.setTextColor(0, 0, 0);
  return y;
}

function drawModernTotals(
  doc: jsPDF,
  rows: { subtotal: number; deliveryCost: number; total: number },
  right: number,
  startY: number,
  scale: number
): void {
  const labelX = right - 60;
  const valueX = right - 3;
  let y = startY + gap(4, scale);

  doc.setFontSize(fontPt(8, scale));
  doc.setTextColor(...LABEL_GRAY);
  doc.text("Subtotal", labelX, y);
  doc.setTextColor(...VALUE_DARK);
  doc.text(formatMoney(rows.subtotal), valueX, y, { align: "right" });
  y += gap(5, scale);

  doc.setTextColor(...LABEL_GRAY);
  doc.text("Delivery", labelX, y);
  doc.setTextColor(...VALUE_DARK);
  doc.text(formatMoney(rows.deliveryCost), valueX, y, { align: "right" });
  y += gap(4, scale);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(labelX, y, valueX, y);
  y += gap(5.5, scale);

  doc.setFontSize(fontPt(9.5, scale));
  doc.setTextColor(...ACCENT);
  doc.text("Total", labelX, y);
  doc.text(formatMoney(rows.total), valueX, y, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

/**
 * Renders a full branded, light card-style document (mirrors the on-site
 * invoice layout): header, two info cards (details + payment), an addresses
 * card, and an order-summary card with the items table + totals.
 */
export function renderDocument(
  doc: jsPDF,
  opts: {
    model: DocModel;
    branding: StoreBranding;
    logo: LogoImage | null;
    scale?: number;
  }
): void {
  const { model, branding, logo, scale = 1 } = opts;

  let yPos = drawDocumentHeader(doc, {
    branding,
    logo,
    title: model.label,
    scale,
  });
  yPos += 2;

  // Row of two cards: details (left) + payment (right)
  const rightX = MARGIN + COL_WIDTH + COL_GAP;
  const innerW = COL_WIDTH - 2 * CARD_PAD_X;
  const cardBodyH = Math.max(
    measureRows(doc, model.detailRows, scale, innerW),
    measureRows(doc, model.paymentRows, scale, innerW)
  );
  const cardH = CARD_PAD_TOP + CARD_TITLE_GAP + cardBodyH + CARD_PAD_BOTTOM;
  drawCardBox(doc, MARGIN, yPos, COL_WIDTH, cardH);
  drawCardBox(doc, rightX, yPos, COL_WIDTH, cardH);
  drawCardTitle(doc, MARGIN + CARD_PAD_X, yPos + CARD_PAD_TOP, model.detailsTitle, scale);
  drawCardTitle(doc, rightX + CARD_PAD_X, yPos + CARD_PAD_TOP, "Payment Information", scale);
  const rowsTop = yPos + CARD_PAD_TOP + CARD_TITLE_GAP;
  drawRows(doc, MARGIN + CARD_PAD_X, rowsTop, model.detailRows, scale, innerW);
  drawRows(doc, rightX + CARD_PAD_X, rowsTop, model.paymentRows, scale, innerW);
  yPos += cardH + 4;

  // Addresses card (two columns)
  const addrColW = (CONTENT_WIDTH - 2 * CARD_PAD_X - COL_GAP) / 2;
  const billRows: DocKeyValue[] = [
    { label: "Billing Address", value: model.billingAddress || "Not specified" },
  ];
  const shipRows: DocKeyValue[] = [
    { label: "Shipping Address", value: model.shippingAddress || "Not specified" },
  ];
  const addrBodyH = Math.max(
    measureRows(doc, billRows, scale, addrColW),
    measureRows(doc, shipRows, scale, addrColW)
  );
  const addrCardH = CARD_PAD_TOP + CARD_TITLE_GAP + addrBodyH + CARD_PAD_BOTTOM;
  drawCardBox(doc, MARGIN, yPos, CONTENT_WIDTH, addrCardH);
  drawCardTitle(doc, MARGIN + CARD_PAD_X, yPos + CARD_PAD_TOP, "Addresses", scale);
  const addrTop = yPos + CARD_PAD_TOP + CARD_TITLE_GAP;
  drawRows(doc, MARGIN + CARD_PAD_X, addrTop, billRows, scale, addrColW);
  drawRows(doc, MARGIN + CARD_PAD_X + addrColW + COL_GAP, addrTop, shipRows, scale, addrColW);
  yPos += addrCardH + 4;

  // Order summary card (items table + totals)
  const tableLeft = MARGIN + CARD_PAD_X;
  const tableRight = CONTENT_RIGHT - CARD_PAD_X;
  const isReceipt = model.label === "RECEIPT";
  const tableH = measureItemsTable(doc, model.items, tableLeft, tableRight, scale);
  const totalsH = gap(22, scale);
  const sumBodyH = tableH + gap(3.5, scale) + totalsH;
  const sumCardH = CARD_PAD_TOP + CARD_TITLE_GAP + sumBodyH + CARD_PAD_BOTTOM;
  if (yPos + sumCardH > 282) {
    doc.addPage();
    ensurePdfFont(doc);
    yPos = MARGIN;
  }
  drawCardBox(doc, MARGIN, yPos, CONTENT_WIDTH, sumCardH);
  const sumTitleY = yPos + CARD_PAD_TOP;
  drawCardTitle(doc, MARGIN + CARD_PAD_X, sumTitleY, "Order Summary", scale);
  if (isReceipt) drawPaymentConfirmedBadge(doc, tableRight, sumTitleY, scale);
  let innerY = yPos + CARD_PAD_TOP + CARD_TITLE_GAP;
  innerY = drawModernItemsTable(doc, model.items, tableLeft, tableRight, innerY, scale);
  innerY += gap(3.5, scale);
  drawModernTotals(doc, model.totals, tableRight, innerY, scale);

  drawDocumentFooter(doc, branding, scale);
}
