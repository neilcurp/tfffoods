import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { resolveLanguage, resolveScale } from "@/utils/services/pdfDocument";
import { buildOrderPdf } from "@/utils/services/receiptService";

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
    const searchParams = new URL(request.url).searchParams;
    const language = resolveLanguage(searchParams.get("lang"));
    const scale = resolveScale(searchParams.get("scale"));

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

    const pdfBytes = await buildOrderPdf(order, { language, scale });

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="order-${order.orderReference}.pdf"`,
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
