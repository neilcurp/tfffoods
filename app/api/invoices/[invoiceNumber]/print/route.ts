import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

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
    await connectToDatabase();
    const isConnected = await waitForConnection(10000);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const invoice = await Invoice.findOne({
      invoiceNumber,
    })
      .populate({
        path: "user",
        model: User,
        select: "name email phone address",
      })
      .populate({
        path: "orders.cartProducts.product",
        model: Product,
        select: "name displayNames images price description",
      })
      .lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const userId = session.user._id ?? session.user.id;
    if (
      !session.user.admin &&
      invoice.user._id.toString() !== userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create PDF document
    const doc = new jsPDF();

    // Add content to PDF
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Invoice Info
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${format(new Date(invoice.createdAt), "PPP")}`, 20, 50);

    // Customer Details
    doc.setFontSize(14);
    doc.text("Customer Information", 20, 70);
    doc.setFontSize(12);
    doc.text(`Name: ${invoice.user.name}`, 20, 85);
    doc.text(`Phone: ${invoice.user.phone || "-"}`, 20, 95);
    const address =
      invoice.user.address?.en || invoice.user.address?.["zh-TW"] || "-";
    // Handle long addresses by wrapping text
    const addressLines = doc.splitTextToSize(`Address: ${address}`, 180);
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, 105 + index * 10);
    });

    // Payment Information
    let yPos = 135;
    doc.setFontSize(14);
    doc.text("Payment Information", 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    doc.text(`Payment Method: ${invoice.paymentMethod}`, 20, yPos);
    yPos += 10;
    if (invoice.paymentReference) {
      doc.text(`Payment Reference: ${invoice.paymentReference}`, 20, yPos);
      yPos += 10;
    }
    if (invoice.paymentDate) {
      doc.text(
        `Payment Date: ${format(new Date(invoice.paymentDate), "PPP")}`,
        20,
        yPos
      );
      yPos += 10;
    }

    // Order Items
    yPos += 10;
    doc.setFontSize(14);
    doc.text("Order Items", 20, yPos);
    doc.setFontSize(12);
    yPos += 15;

    // Table headers
    doc.text("Item", 20, yPos);
    doc.text("Qty", 130, yPos);
    doc.text("Price", 150, yPos);
    doc.text("Total", 175, yPos);
    yPos += 10;

    // Table content
    invoice.orders?.[0]?.cartProducts?.forEach((item: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      const productName =
        item.product?.displayNames?.en ||
        item.product?.name ||
        "Product not found";
      const lines = doc.splitTextToSize(productName, 100);

      lines.forEach((line: string, index: number) => {
        doc.text(line, 20, yPos + index * 10);
      });

      doc.text(item.quantity?.toString() || "0", 130, yPos);
      doc.text(`$${(item.price || 0).toFixed(2)}`, 150, yPos);
      doc.text(
        `$${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`,
        175,
        yPos
      );

      yPos += lines.length * 10 + 5;
    });

    // Delivery Method
    yPos += 10;
    doc.text("Delivery Method: Local Delivery", 20, yPos);

    // Totals
    yPos += 20;
    const subtotal = invoice.orders?.[0]?.total
      ? invoice.orders[0].total - (invoice.orders[0].deliveryCost || 0)
      : 0;
    const deliveryCost = invoice.orders?.[0]?.deliveryCost || 0;

    doc.text("Subtotal:", 130, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 175, yPos);
    yPos += 10;
    doc.text("Delivery Cost:", 130, yPos);
    doc.text(`$${deliveryCost.toFixed(2)}`, 175, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.text("Total:", 130, yPos);
    doc.text(`$${invoice.amount.toFixed(2)}`, 175, yPos);

    const pdfBytes = doc.output("arraybuffer");

    // Return PDF with appropriate headers
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
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
