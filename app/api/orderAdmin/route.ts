import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { sendEmail } from "@/lib/emailService";
import { generatePaymentConfirmedEmail } from "@/lib/emailTemplates";
import Invoice from "@/utils/models/Invoice";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { removeOrderFromInvoices } from "@/utils/services/invoiceService";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const status = searchParams.get("status");
    const language = searchParams.get("language") || "en";
    const viewMode = searchParams.get("viewMode") || "one-time";

    const skip = (page - 1) * limit;

    // Build query based on status filter
    const query = status ? { status } : {};

    if (viewMode === "period") {
      // For period view, show period orders
      const orders = await Order.find({
        ...query,
        orderType: "period-order",
      })
        .populate({
          path: "items.id",
          model: Product,
          select: "_id name displayNames images price",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalOrders = await Order.countDocuments({
        ...query,
        orderType: "period-order",
      });

      return NextResponse.json({
        orders,
        hasMore: totalOrders > skip + orders.length,
        totalOrders,
      });
    } else {
      // Regular view - show only one-time orders
      const orders = await Order.find({
        ...query,
        orderType: "onetime-order",
      })
        .populate({
          path: "items.id",
          model: Product,
          select: "_id name displayNames images price",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalOrders = await Order.countDocuments({
        ...query,
        orderType: "onetime-order",
      });

      return NextResponse.json({
        orders,
        hasMore: totalOrders > skip + orders.length,
        totalOrders,
      });
    }
  } catch (error) {
    console.error("Error in orderAdmin GET:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const {
      orderId,
      confirmPayment,
      rejectPayment,
      rejectionReason,
      markAsShipped,
      markAsDelivered,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    let updateFields: any = {};

    // Get the order first
    const order = await Order.findById(orderId).populate({
      path: "items.id",
      model: Product,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (confirmPayment) {
      updateFields = {
        status: "processing",
      };

      // Update stock for each product in the order
      for (const item of order.items) {
        const product = await Product.findById(item.id?._id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await Product.findByIdAndUpdate(item.id?._id, {
            stock: newStock,
          });
          console.log(
            `Updated stock for product ${product.name}: ${product.stock} -> ${newStock}`
          );
        }
      }

      // Find and update associated invoice
      const invoice = await Invoice.findOne({ orders: orderId });
      if (invoice) {
        // For one-time orders, mark invoice as paid when payment is confirmed
        if (invoice.invoiceType === "one-time") {
          invoice.status = "paid";
          await invoice.save();
          console.log(
            `Updated invoice ${invoice.invoiceNumber} status to paid`
          );
        }
      }

      // Send confirmation email using branded template
      try {
        const { subject, text, html } = generatePaymentConfirmedEmail(
          order,
          (order as any)?.user?.language || "en"
        );
        await sendEmail({ to: order.email, subject, text, html });
        console.log("Payment confirmed email sent successfully");
      } catch (emailError) {
        console.error("Error sending payment confirmed email:", emailError);
      }
    } else if (markAsShipped) {
      // Check if vehicle is assigned before marking as shipped
      if (!order.vehicleAssigned) {
        return NextResponse.json(
          { error: "Cannot mark as shipped: No vehicle assigned" },
          { status: 400 }
        );
      }

      updateFields = {
        status: "shipped",
      };

      // Send shipping notification email
      try {
        await sendEmail({
          to: order.email,
          subject: "Your Order Has Been Shipped",
          text: `Dear ${order.name},\n\nYour order #${order._id} has been shipped and is on its way to you.\n\nThank you for your purchase!`,
          html: `
            <h1>Order Shipped</h1>
            <p>Dear ${order.name},</p>
            <p>Your order #${order._id} has been shipped and is on its way to you.</p>
            <p>Thank you for your purchase!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile?tab=orders">Track Your Order</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending shipping email:", emailError);
      }
    } else if (markAsDelivered) {
      // Check if order is shipped before marking as delivered
      if (order.status !== "shipped") {
        return NextResponse.json(
          { error: "Cannot mark as delivered: Order not shipped" },
          { status: 400 }
        );
      }

      updateFields = {
        status: "delivered",
      };

      // Update associated invoice status
      const invoice = await Invoice.findOne({ orders: orderId });
      if (invoice) {
        if (invoice.invoiceType === "one-time") {
          // For one-time orders, mark invoice as paid when delivered
          invoice.status = "paid";
          await invoice.save();
          console.log(
            `Updated one-time invoice ${invoice.invoiceNumber} status to paid after delivery`
          );
        } else if (invoice.invoiceType === "period") {
          // For period invoices, check if all orders are delivered
          const allOrders = await Order.find({ _id: { $in: invoice.orders } });
          const allDelivered = allOrders.every(
            (order) => order.status === "delivered"
          );

          if (allDelivered) {
            invoice.status = "paid";
            await invoice.save();
            console.log(
              `Updated period invoice ${invoice.invoiceNumber} status to paid - all orders delivered`
            );
          }
        }
      }

      // Send delivery confirmation email
      try {
        await sendEmail({
          to: order.email,
          subject: "Your Order Has Been Delivered",
          text: `Dear ${order.name},\n\nYour order #${order._id} has been delivered. We hope you enjoy your purchase!\n\nThank you for shopping with us!`,
          html: `
            <h1>Order Delivered</h1>
            <p>Dear ${order.name},</p>
            <p>Your order #${order._id} has been delivered. We hope you enjoy your purchase!</p>
            <p>Thank you for shopping with us!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile?tab=orders">View Order Details</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending delivery email:", emailError);
      }
    } else if (rejectPayment) {
      updateFields = {
        status: "cancelled",
        rejectionReason: rejectionReason || "Payment proof rejected",
      };

      // Send rejection email
      try {
        await sendEmail({
          to: order.email,
          subject: "Order Rejected",
          text: `Dear ${order.name},\n\nYour order #${order._id} has been rejected.\nReason: ${rejectionReason}\n\nPlease contact support if you have any questions.`,
          html: `
            <h1>Order Rejected</h1>
            <p>Dear ${order.name},</p>
            <p>Your order #${order._id} has been rejected.</p>
            <p>Reason: ${rejectionReason}</p>
            <p>Please contact support if you have any questions.</p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update order with new status
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
      new: true,
    }).populate([
      {
        path: "items.id",
        model: Product,
        select: "_id name displayNames images price",
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error in orderAdmin PUT:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      console.error("Unauthorized delete attempt:", {
        user: session?.user?.email,
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      console.error("Missing orderId in delete request:", {
        params: Object.fromEntries(searchParams),
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Order ID is required",
          code: "MISSING_ORDER_ID",
        },
        { status: 400 }
      );
    }

    // Get the order first to check if it exists
    const order = await Order.findById(orderId);
    if (!order) {
      console.error("Order not found for deletion:", {
        orderId,
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Order not found",
          code: "ORDER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    console.log("Found order to delete:", {
      id: order._id,
      status: order.status,
      total: order.total,
      items: order.items?.length || 0,
    });

    // First, clean up the invoices that reference this order
    try {
      await removeOrderFromInvoices(orderId);
      console.log(
        "Successfully cleaned up invoice references for order:",
        orderId
      );
    } catch (invoiceError) {
      console.error("Error cleaning up invoice references:", {
        error:
          invoiceError instanceof Error
            ? {
                message: invoiceError.message,
                stack: invoiceError.stack,
                name: invoiceError.name,
              }
            : invoiceError,
        orderId,
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Failed to clean up invoice references",
          code: "INVOICE_CLEANUP_ERROR",
          details:
            invoiceError instanceof Error
              ? invoiceError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Then delete the order
    const deletedOrder = await Order.findByIdAndDelete(orderId);
    if (!deletedOrder) {
      console.error("Order not found during deletion:", {
        orderId,
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Order not found during deletion",
          code: "ORDER_DELETE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    console.log("Successfully deleted order:", {
      id: deletedOrder._id,
      status: deletedOrder.status,
      total: deletedOrder.total,
      items: deletedOrder.items?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: "Order and related invoice references deleted successfully",
      deletedOrderId: orderId,
    });
  } catch (error) {
    console.error("Error in orderAdmin DELETE:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      url: request.url,
      params: Object.fromEntries(new URL(request.url).searchParams),
    });
    return NextResponse.json(
      {
        error: "Failed to delete order",
        code: "DELETE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
