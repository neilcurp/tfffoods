import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import Invoice from "@/utils/models/Invoice";
import DeliverySettings from "@/utils/models/DeliverySettings";
import { removeOrderFromInvoices } from "@/utils/services/invoiceService";
import { logger } from "@/utils/logger";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectToDatabase();
    const { orderId } = await context.params;

    // Get the order with populated items
    const order = await Order.findById(orderId)
      .populate({
        path: "items.id",
        model: Product,
        select: "_id name displayNames images price",
      })
      .select(
        "_id user name email phone shippingAddress items deliveryMethod paymentMethod status paymentProof paymentReference paymentDate subtotal deliveryCost total createdAt updatedAt orderType invoiceNumber periodInvoiceNumber periodStart periodEnd orderReference"
      )
      .lean()
      .exec();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If it's a period order but missing periodInvoiceNumber, try to find it
    if (
      order.orderType === "period-order" &&
      (!order.periodInvoiceNumber || !order.periodStart || !order.periodEnd)
    ) {
      console.log(
        "Period order missing invoice details, trying to find invoice..."
      );
      const invoice = await Invoice.findOne({
        orders: order._id,
        invoiceType: "period",
      }).lean();

      if (invoice) {
        console.log("Found matching invoice:", {
          invoiceNumber: invoice.invoiceNumber,
          orderId: order._id,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
        });

        const updates: any = {};
        if (!order.periodInvoiceNumber)
          updates.periodInvoiceNumber = invoice.invoiceNumber;
        if (!order.periodStart) updates.periodStart = invoice.periodStart;
        if (!order.periodEnd) updates.periodEnd = invoice.periodEnd;

        // Update the order in database
        if (Object.keys(updates).length > 0) {
          await Order.findByIdAndUpdate(order._id, updates);
          Object.assign(order, updates);
        }
      } else {
        console.log("No matching invoice found for period order:", order._id);
      }
    }

    console.log("Order data from database:", {
      id: order._id,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      periodInvoiceNumber: order.periodInvoiceNumber,
      periodStart: order.periodStart,
      periodEnd: order.periodEnd,
      orderReference: order.orderReference,
      fullOrder: order,
    });

    // Calculate totals if they're missing
    if (!order.subtotal || !order.total) {
      order.subtotal = order.items.reduce((sum, item) => {
        const price = item.id?.price || 0;
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);

      order.deliveryCost = order.deliveryCost || 0;
      order.total = order.subtotal + order.deliveryCost;
    }

    // Get delivery settings to include delivery method name
    const deliverySettings = await DeliverySettings.findOne().lean().exec();
    if (deliverySettings && typeof order.deliveryMethod === "number") {
      const selectedMethod =
        deliverySettings.deliveryMethods[order.deliveryMethod];
      if (selectedMethod) {
        order.deliveryMethodName = selectedMethod.name;
      }
    }

    logger.info("Fetched order details:", {
      orderId,
      status: order.status,
      itemCount: order.items?.length || 0,
      deliveryMethod: order.deliveryMethod,
      deliveryMethodName: order.deliveryMethodName,
    });

    return NextResponse.json(order);
  } catch (error) {
    logger.error("Error fetching order:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      orderId: context.params.then((p) => p.orderId),
    });
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// Helper function to broadcast order status update
async function broadcastOrderUpdate(orderId: string, status: string) {
  try {
    // You might want to implement server-sent events or websockets here
    // For now, we'll rely on client-side polling
    console.log(`Broadcasting order update: ${orderId} -> ${status}`);
  } catch (error) {
    console.error("Error broadcasting order update:", error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  await connectToDatabase();

  try {
    const body = await request.json();
    const { paymentProofUrl, status } = body;

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Handle payment proof update
    if (paymentProofUrl) {
      updateData.paymentProof = paymentProofUrl;
      updateData.status = "pending_payment_verification";
    }

    // Handle status update
    if (status) {
      updateData.status = status;

      // Find associated invoice
      const invoice = await Invoice.findOne({ orders: orderId });

      if (invoice) {
        // Just save the invoice to trigger the pre-save hook
        // which will check all orders and update status accordingly
        await invoice.save();
        console.log(`Triggered invoice ${invoice.invoiceNumber} status update`);
      }

      // Broadcast the status update for frontend to clear cart
      await broadcastOrderUpdate(orderId, status);
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    }).populate({
      path: "items.id",
      model: Product,
      select: "_id name displayNames images price",
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  await connectToDatabase();

  try {
    const { orderId } = params;
    console.log(`Attempting to delete order ${orderId}...`);

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // First, clean up the invoices that reference this order
    await removeOrderFromInvoices(orderId);

    // Then delete the order
    await Order.findByIdAndDelete(orderId);

    return NextResponse.json({
      success: true,
      message: "Order and related invoice references deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
