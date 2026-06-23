import { format } from "date-fns";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";
import DeliverySettings from "@/utils/models/DeliverySettings";
import {
  loadStoreBranding,
  fetchLogoImage,
  renderDocument,
  pickLang,
  createPdfDocument,
  paymentVerifiedMessage,
  type SupportedLanguage,
  type DocKeyValue,
  type DocModel,
  type PdfLineItem,
} from "@/utils/services/pdfDocument";

export type DocumentType = "invoice" | "receipt";

/** Populate paths for invoice/receipt PDF generation (orders use `items`, not cartProducts). */
export function invoicePdfQuery(invoiceNumber: string) {
  return Invoice.findOne({ invoiceNumber })
    .populate({
      path: "user",
      model: User,
      select: "name email phone address",
    })
    .populate({
      path: "orders",
      populate: {
        path: "items.id",
        model: Product,
        select: "name displayNames images price description",
      },
    });
}

export function invoicePdfQueryByOrder(orderId: string) {
  return Invoice.findOne({ orders: orderId })
    .populate({
      path: "user",
      model: User,
      select: "name email phone address",
    })
    .populate({
      path: "orders",
      populate: {
        path: "items.id",
        model: Product,
        select: "name displayNames images price description",
      },
    });
}

interface BuildOptions {
  language: SupportedLanguage;
  scale?: number;
  documentType?: DocumentType;
}

function safeDate(value: unknown): string {
  if (!value) return "-";
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? "-" : format(d, "PPP");
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Orders store line items under `items`; legacy paths may use `cartProducts`. */
function mapOrderLineItems(
  order: any,
  language: SupportedLanguage
): PdfLineItem[] {
  if (!order) return [];

  if (Array.isArray(order.cartProducts) && order.cartProducts.length > 0) {
    return order.cartProducts.map((item: any) => ({
      name:
        pickLang(item.product?.displayNames, language) ||
        item.product?.name ||
        "Product not found",
      quantity: item.quantity,
      price: item.price || item.product?.price || 0,
    }));
  }

  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item: any) => ({
      name:
        pickLang(item.id?.displayNames, language) ||
        pickLang(item.product?.displayNames, language) ||
        item.id?.name ||
        item.product?.name ||
        "Product not found",
      quantity: item.quantity,
      price: item.price ?? item.id?.price ?? item.product?.price ?? 0,
    }));
  }

  return [];
}

export function pickDeliveryMethodName(
  deliveryMethodIndex: unknown,
  deliverySettings: { deliveryMethods?: Array<{ name?: { en?: string; "zh-TW"?: string } }> } | null,
  language: SupportedLanguage
): string | undefined {
  if (typeof deliveryMethodIndex !== "number") return undefined;
  const method = deliverySettings?.deliveryMethods?.[deliveryMethodIndex];
  if (!method?.name) return undefined;
  return pickLang(method.name, language) || method.name.en;
}

function buildDeliveryRows(
  address: string | undefined,
  deliveryMethod: string | undefined
): DocKeyValue[] {
  return [
    { label: "Address", value: address?.trim() || "Not specified" },
    {
      label: "Delivery Method",
      value: deliveryMethod?.trim() || "Not specified",
    },
  ];
}

async function renderToBuffer(
  model: DocModel,
  language: SupportedLanguage,
  scale: number
): Promise<ArrayBuffer> {
  const branding = await loadStoreBranding(language);
  const logo = await fetchLogoImage(branding.logoUrl);
  const doc = await createPdfDocument();
  renderDocument(doc, { model, branding, logo, scale });
  return doc.output("arraybuffer");
}

/**
 * Single source of truth for the branded invoice/receipt PDF. Used by the
 * invoice print/download routes and by the payment-confirmation emails. A
 * "receipt" is the same document with a PAID badge and "RECEIPT" title.
 */
export async function buildInvoicePdf(
  invoice: any,
  options: BuildOptions
): Promise<ArrayBuffer> {
  const { language, scale = 1, documentType = "invoice" } = options;
  const isReceipt = documentType === "receipt";
  const paid = invoice.status === "paid";

  const firstOrder = invoice.orders?.[0];
  const orderNumber = firstOrder?._id
    ? `#${String(firstOrder._id).slice(-12).toUpperCase()}`
    : "-";

  const detailRows: DocKeyValue[] = [
    { label: "Name", value: invoice.user?.name ?? "-" },
    { label: "Email", value: invoice.user?.email ?? "-" },
    { label: "Invoice Number", value: invoice.invoiceNumber ?? "-" },
    { label: "Order Number", value: orderNumber },
    { label: "Status", value: titleCase(invoice.status ?? "pending") },
    {
      label: "Type",
      value: invoice.invoiceType === "period" ? "Period" : "One-time",
    },
    { label: "Created", value: safeDate(invoice.createdAt) },
  ];

  const paymentRows: DocKeyValue[] = [
    {
      label: "Payment Method",
      value: invoice.paymentMethod ? titleCase(invoice.paymentMethod) : "-",
    },
    { label: "Payment Status", value: paid ? "Paid" : "Pending" },
  ];
  if (invoice.paymentReference) {
    paymentRows.push({
      label: "Payment Reference",
      value: invoice.paymentReference,
    });
  }
  if (invoice.paymentDate) {
    paymentRows.push({
      label: "Payment Date",
      value: safeDate(invoice.paymentDate),
    });
  }

  const items: PdfLineItem[] = mapOrderLineItems(firstOrder, language);

  const deliveryCost = firstOrder?.deliveryCost || 0;
  const subtotal =
    firstOrder?.subtotal ??
    (firstOrder?.total ? firstOrder.total - deliveryCost : 0);

  const deliverySettings = await DeliverySettings.findOne().lean().exec();
  const deliveryMethodName = pickDeliveryMethodName(
    firstOrder?.deliveryMethod,
    deliverySettings,
    language
  );
  const shippingAddress =
    pickLang(invoice.shippingAddress, language) ||
    pickLang(invoice.billingAddress, language) ||
    pickLang(invoice.user?.address, language);

  const model: DocModel = {
    label: isReceipt ? "RECEIPT" : "INVOICE",
    paid,
    detailsTitle: "Invoice Details",
    detailRows,
    paymentRows,
    deliveryRows: buildDeliveryRows(shippingAddress, deliveryMethodName),
    items,
    totals: { subtotal, deliveryCost, total: invoice.amount || 0 },
    ...(isReceipt && paid
      ? { paymentVerifiedMessage: paymentVerifiedMessage(language) }
      : {}),
  };

  return renderToBuffer(model, language, scale);
}

/** Branded card-style PDF for a single order (order print/download routes). */
export async function buildOrderPdf(
  order: any,
  options: BuildOptions
): Promise<ArrayBuffer> {
  const { language, scale = 1 } = options;
  const paid =
    order.paid === true ||
    ["processing", "shipped", "delivered"].includes(order.status);

  const detailRows: DocKeyValue[] = [
    { label: "Name", value: order.name ?? "-" },
    { label: "Email", value: order.email ?? "-" },
    { label: "Order Reference", value: order.orderReference ?? "-" },
    { label: "Status", value: titleCase(order.status ?? "pending") },
    {
      label: "Type",
      value: order.orderType === "period-order" ? "Period" : "One-time",
    },
    { label: "Date", value: safeDate(order.createdAt) },
  ];
  if (order.orderType === "period-order" && order.periodInvoiceNumber) {
    detailRows.push({
      label: "Period Invoice",
      value: order.periodInvoiceNumber,
    });
  }

  const paymentRows: DocKeyValue[] = [
    {
      label: "Payment Method",
      value: order.paymentMethod ? titleCase(order.paymentMethod) : "-",
    },
    { label: "Payment Status", value: paid ? "Paid" : "Pending" },
  ];
  if (order.paymentReference) {
    paymentRows.push({
      label: "Payment Reference",
      value: order.paymentReference,
    });
  }
  if (order.paymentDate) {
    paymentRows.push({
      label: "Payment Date",
      value: safeDate(order.paymentDate),
    });
  }

  const items: PdfLineItem[] = mapOrderLineItems(order, language);

  const deliverySettings = await DeliverySettings.findOne().lean().exec();
  const deliveryMethodName = pickDeliveryMethodName(
    order.deliveryMethod,
    deliverySettings,
    language
  );
  const shippingAddress = pickLang(order.shippingAddress, language);

  const model: DocModel = {
    label: "ORDER",
    paid,
    detailsTitle: "Order Details",
    detailRows,
    paymentRows,
    deliveryRows: buildDeliveryRows(shippingAddress, deliveryMethodName),
    items,
    totals: {
      subtotal: order.subtotal || 0,
      deliveryCost: order.deliveryCost || 0,
      total: order.total || 0,
    },
  };

  return renderToBuffer(model, language, scale);
}

interface ReceiptAttachment {
  name: string;
  content: string;
}

/**
 * Loads + populates the invoice for an order and returns a Brevo email
 * attachment (base64) of the paid receipt, or null if anything is missing.
 * Never throws — payment confirmation must not fail because of attachment
 * generation.
 */
export async function getReceiptAttachmentByOrder(
  orderId: string,
  language: SupportedLanguage = "en"
): Promise<ReceiptAttachment | null> {
  try {
    const invoice = await invoicePdfQueryByOrder(orderId).lean();

    if (!invoice) return null;

    const bytes = await buildInvoicePdf(invoice, {
      language,
      documentType: "receipt",
    });
    const content = Buffer.from(bytes).toString("base64");
    return { name: `receipt-${invoice.invoiceNumber}.pdf`, content };
  } catch (error) {
    console.error("Failed to build receipt attachment:", error);
    return null;
  }
}
