import { format } from "date-fns";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";
import {
  loadStoreBranding,
  fetchLogoImage,
  renderDocument,
  pickLang,
  createPdfDocument,
  type SupportedLanguage,
  type DocKeyValue,
  type DocModel,
  type PdfLineItem,
} from "@/utils/services/pdfDocument";

export type DocumentType = "invoice" | "receipt";

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

  const items: PdfLineItem[] = (firstOrder?.cartProducts || []).map(
    (item: any) => ({
      name:
        pickLang(item.product?.displayNames, language) ||
        item.product?.name ||
        "Product not found",
      quantity: item.quantity,
      price: item.price || 0,
    })
  );

  const deliveryCost = firstOrder?.deliveryCost || 0;
  const subtotal = firstOrder?.total ? firstOrder.total - deliveryCost : 0;

  const billingAddress =
    pickLang(invoice.billingAddress, language) ||
    pickLang(invoice.user?.address, language);
  const shippingAddress =
    pickLang(invoice.shippingAddress, language) || billingAddress;

  const model: DocModel = {
    label: isReceipt ? "RECEIPT" : "INVOICE",
    paid,
    detailsTitle: "Invoice Details",
    detailRows,
    paymentRows,
    billingAddress,
    shippingAddress,
    items,
    totals: { subtotal, deliveryCost, total: invoice.amount || 0 },
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

  const items: PdfLineItem[] = (order.items || []).map((item: any) => ({
    name:
      pickLang(item.id?.displayNames, language) ||
      item.id?.name ||
      "Product not found",
    quantity: item.quantity,
    price: item.id?.price || 0,
  }));

  const shippingAddress = pickLang(order.shippingAddress, language);
  const billingAddress =
    pickLang(order.billingAddress, language) || shippingAddress;

  const model: DocModel = {
    label: "ORDER",
    paid,
    detailsTitle: "Order Details",
    detailRows,
    paymentRows,
    billingAddress,
    shippingAddress,
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
    const invoice = await Invoice.findOne({ orders: orderId })
      .populate({ path: "user", model: User, select: "name email phone address" })
      .populate({
        path: "orders.cartProducts.product",
        model: Product,
        select: "name displayNames images price description",
      })
      .lean();

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
