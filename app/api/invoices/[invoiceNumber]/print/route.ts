import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { resolveLanguage, resolveScale } from "@/utils/services/pdfDocument";
import {
  buildInvoicePdf,
  invoicePdfQuery,
  type DocumentType,
} from "@/utils/services/receiptService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceNumber } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const language = resolveLanguage(searchParams.get("lang"));
    const scale = resolveScale(searchParams.get("scale"));
    const requestedDoc: DocumentType =
      searchParams.get("doc") === "receipt" ? "receipt" : "invoice";

    await connectToDatabase();
    const isConnected = await waitForConnection(10000);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const invoice = await invoicePdfQuery(invoiceNumber).lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const userId = session.user._id ?? session.user.id;
    if (!session.user.admin && invoice.user._id.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // A receipt is only valid once the invoice is paid; otherwise fall back to
    // the plain invoice so the document is never misleading.
    const documentType: DocumentType =
      requestedDoc === "receipt" && invoice.status === "paid"
        ? "receipt"
        : "invoice";

    const pdfBytes = await buildInvoicePdf(invoice, {
      language,
      scale,
      documentType,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${documentType}-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
