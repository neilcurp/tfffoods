import Invoice from "@/utils/models/Invoice";

type InvoicePaymentMethod =
  | "credit_card"
  | "bank_transfer"
  | "cash"
  | "offline_payment";

interface MarkPaidOptions {
  method?: InvoicePaymentMethod;
  reference?: string;
  date?: Date;
}

/**
 * Single source of truth for marking an invoice paid. Idempotent: if the
 * invoice is already paid it is returned untouched, so the Stripe webhook and
 * the admin "confirm payment" action can both call this safely.
 */
export async function markInvoicePaid(
  invoice: any,
  options: MarkPaidOptions = {}
): Promise<any | null> {
  if (!invoice) return null;
  if (invoice.status === "paid") return invoice;

  invoice.status = "paid";
  invoice.paymentDate = options.date ?? new Date();
  if (options.method) invoice.paymentMethod = options.method;
  if (options.reference) invoice.paymentReference = options.reference;

  await invoice.save();
  return invoice;
}

/** Find the invoice that owns an order and mark it paid (idempotent). */
export async function markInvoicePaidByOrder(
  orderId: string,
  options: MarkPaidOptions = {}
): Promise<any | null> {
  const invoice = await Invoice.findOne({ orders: orderId });
  if (!invoice) return null;
  return markInvoicePaid(invoice, options);
}
