import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Testing database connection...");
    await connectToDatabase();
    console.log("Database connected successfully");

    console.log("Testing Invoice model...");
    const invoices = await Invoice.find()
      .populate("user", "name email")
      .populate("orders")
      .lean();

    // Log each invoice for debugging
    invoices.forEach((invoice, index) => {
      console.log(`\nInvoice ${index + 1}:`, {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        periodInvoiceNumber: invoice.periodInvoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        createdAt: invoice.createdAt,
        user: invoice.user,
        items: invoice.items?.length,
        orders: invoice.orders?.length,
      });
    });

    return NextResponse.json({
      success: true,
      count: invoices.length,
      invoices: invoices,
    });
  } catch (error) {
    console.error("Error testing invoices:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
