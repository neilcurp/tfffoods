import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { jsPDF } from "jspdf";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    await connectToDatabase();
    const isConnected = await waitForConnection(10000);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 }
      );
    }

    const order = await Order.findById(orderId)
      .populate({
        path: "items.id",
        model: Product,
        select: "name displayNames images price description",
      })
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userId = session.user._id ?? session.user.id;
    if (!session.user.admin && order.user.toString() !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create PDF document
    const doc = new jsPDF();

    // Add content to PDF
    doc.setFontSize(20);
    doc.text("ORDER DETAILS", 105, 20, { align: "center" });

    // Initialize yPos for dynamic positioning
    let yPos = 40;

    // Order Info
    doc.setFontSize(12);
    if (order.orderType === "period-order" && order.periodInvoiceNumber) {
      // Period Invoice Info
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255); // Blue color for period invoice
      doc.text(`Period Invoice: ${order.periodInvoiceNumber}`, 20, yPos);
      yPos += 10;
      doc.text(
        `Period: ${format(
          new Date(order.periodStart),
          "yyyy/MM/dd"
        )} - ${format(new Date(order.periodEnd), "yyyy/MM/dd")}`,
        20,
        yPos
      );
      yPos += 10;
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.setFontSize(12);
      doc.text(`Order Reference: ${order.orderReference}`, 20, yPos);
      yPos += 20;
    } else {
      doc.text(`Order Reference: ${order.orderReference}`, 20, yPos);
      yPos += 10;
      doc.text(`Date: ${format(new Date(order.createdAt), "PPP")}`, 20, yPos);
      yPos += 20;
    }

    // Customer Details
    doc.setFontSize(14);
    doc.text("Customer Information", 20, yPos);
    yPos += 15;
    doc.setFontSize(12);
    doc.text(`Name: ${order.name}`, 20, yPos);
    yPos += 10;
    doc.text(`Email: ${order.email}`, 20, yPos);
    yPos += 10;
    doc.text(`Phone: ${order.phone || "-"}`, 20, yPos);
    yPos += 10;

    // Handle long addresses by wrapping text
    const addressLines = doc.splitTextToSize(
      `Address: ${
        order.shippingAddress?.en || order.shippingAddress?.["zh-TW"] || "-"
      }`,
      180
    );
    addressLines.forEach((line: string, index: number) => {
      doc.text(line, 20, yPos);
      yPos += 10;
    });

    yPos += 10;

    // Order Items
    doc.setFontSize(14);
    doc.text("Order Items", 20, yPos);
    yPos += 15;
    doc.setFontSize(12);

    // Table headers
    doc.text("Item", 20, yPos);
    doc.text("Qty", 130, yPos);
    doc.text("Price", 150, yPos);
    doc.text("Total", 175, yPos);
    yPos += 10;

    // Table content
    order.items?.forEach((item: any) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      const product = item.id;
      const productName =
        product?.displayNames?.en || product?.name || "Product not found";
      const lines = doc.splitTextToSize(productName, 100);

      lines.forEach((line: string, index: number) => {
        doc.text(line, 20, yPos + index * 10);
      });

      doc.text(item.quantity?.toString() || "0", 130, yPos);
      doc.text(`$${(product?.price || 0).toFixed(2)}`, 150, yPos);
      doc.text(
        `$${((item.quantity || 0) * (product?.price || 0)).toFixed(2)}`,
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
    const subtotal = order.subtotal || 0;

    doc.text("Subtotal:", 130, yPos);
    doc.text(`$${subtotal.toFixed(2)}`, 175, yPos);
    yPos += 10;
    doc.text("Delivery Cost:", 130, yPos);
    doc.text(`$${(order.deliveryCost || 0).toFixed(2)}`, 175, yPos);
    yPos += 10;
    doc.setFontSize(14);
    doc.text("Total:", 130, yPos);
    doc.text(`$${order.total.toFixed(2)}`, 175, yPos);

    const pdfBytes = doc.output("arraybuffer");

    // Return PDF with appropriate headers for download
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="order-${order.orderReference}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating order PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
