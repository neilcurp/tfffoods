import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Invoice from "@/utils/models/Invoice";
import { connectToDatabase } from "@/utils/database";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { invoiceNumber } = await params;
    const { status } = await request.json();

    if (!["pending", "paid", "overdue"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    invoice.status = status;
    if (status === "paid") {
      invoice.paymentDate = new Date();
    }

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: "Invoice status updated successfully",
      invoice: {
        ...invoice.toObject(),
        _id: invoice._id.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
