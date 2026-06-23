import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Invoice from "@/utils/models/Invoice";
import User from "@/utils/models/User";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import DeliverySettings from "@/utils/models/DeliverySettings";
import { connectToDatabase } from "@/utils/database";

interface CartProduct {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
  };
  quantity: number;
}

interface OrderType {
  _id: string;
  name: string;
  email: string;
  total: number;
  subtotal?: number;
  deliveryCost?: number;
  deliveryMethod?: number;
  status: string;
  createdAt: Date;
  cartProducts: CartProduct[];
  toObject: () => any;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    console.log("Starting invoice fetch...");

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("No authenticated session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Connecting to database...");
    await connectToDatabase();

    const { invoiceNumber } = await props.params;
    console.log("Fetching invoice number:", invoiceNumber);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log("User not found for email:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.log("Found user:", user._id);

    console.log("Querying invoice with:", { invoiceNumber, userId: user._id });
    const invoice = await Invoice.findOne({
      invoiceNumber,
      user: user._id,
    })
      .populate({
        path: "user",
        model: User,
        select: "name email address",
      })
      .populate({
        path: "orders",
        model: Order,
        select:
          "name email total subtotal deliveryCost deliveryMethod status createdAt items",
        populate: {
          path: "items.id",
          model: Product,
          select: "name displayNames images price description",
        },
      })
      .populate({
        path: "items.product",
        model: Product,
        select: "name images price description",
      });

    if (!invoice) {
      console.log("Invoice not found for number:", invoiceNumber);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    console.log("Found invoice:", {
      id: invoice._id,
      orderCount: invoice.orders?.length || 0,
    });

    // Debug logs
    console.log("Raw invoice orders:", invoice.orders);
    if (Array.isArray(invoice.orders)) {
      invoice.orders.forEach((order: OrderType, index: number) => {
        console.log(`Order ${index} data:`, {
          _id: order._id,
          subtotal: order.subtotal,
          deliveryCost: order.deliveryCost,
          total: order.total,
          hasCartProducts: Boolean(order.cartProducts),
          cartProductsCount: order.cartProducts?.length || 0,
        });
      });
    } else {
      console.log(
        "Warning: invoice.orders is not an array:",
        typeof invoice.orders
      );
    }

    try {
      const deliverySettings = await DeliverySettings.findOne().lean().exec();

      // Convert MongoDB dates to ISO strings for proper JSON serialization
      const serializedInvoice = {
        ...invoice.toObject(),
        _id: invoice._id.toString(),
        createdAt: invoice.createdAt?.toISOString() || new Date().toISOString(),
        periodStart:
          invoice.periodStart?.toISOString() || new Date().toISOString(),
        periodEnd: invoice.periodEnd?.toISOString() || new Date().toISOString(),
        paymentProofUrl: invoice.paymentProofUrl,
        orders: Array.isArray(invoice.orders)
          ? invoice.orders.map((order: OrderType) => {
              try {
                // Calculate subtotal from items if it's missing
                const calculatedSubtotal =
                  order.items?.reduce(
                    (sum: number, item: any) =>
                      sum + (item.id?.price || 0) * (item.quantity || 0),
                    0
                  ) || 0;

                // Calculate delivery cost from total and subtotal if it's missing
                const calculatedDeliveryCost =
                  (order.total || 0) - calculatedSubtotal;

                const orderObj = {
                  ...order.toObject(),
                  _id: order._id.toString(),
                  createdAt:
                    order.createdAt?.toISOString() || new Date().toISOString(),
                  deliveryMethodName:
                    typeof order.deliveryMethod === "number" &&
                    deliverySettings?.deliveryMethods?.[order.deliveryMethod]
                      ? deliverySettings.deliveryMethods[order.deliveryMethod].name
                      : undefined,
                  // Use calculated values if stored values are missing
                  subtotal: order.subtotal || calculatedSubtotal,
                  deliveryCost: order.deliveryCost || calculatedDeliveryCost,
                  total:
                    order.total || calculatedSubtotal + calculatedDeliveryCost,
                  // Map items to cartProducts format for frontend compatibility
                  cartProducts:
                    order.items?.map((item) => ({
                      product: {
                        _id: item.id._id.toString(),
                        name: item.id.name,
                        displayNames: item.id.displayNames,
                        images: item.id.images,
                        price: item.id.price,
                        description: item.id.description,
                      },
                      quantity: item.quantity,
                    })) || [],
                };
                console.log("Serialized order:", orderObj);
                return orderObj;
              } catch (orderError) {
                console.error("Error processing order:", orderError);
                // Return a safe version of the order
                return {
                  _id: order._id?.toString() || "unknown",
                  createdAt: new Date().toISOString(),
                  subtotal: 0,
                  deliveryCost: 0,
                  total: 0,
                  cartProducts: [],
                };
              }
            })
          : [],
      };

      console.log("Successfully serialized invoice");
      return NextResponse.json({ invoice: serializedInvoice });
    } catch (serializationError) {
      console.error("Error serializing invoice:", {
        error: serializationError,
        stack:
          serializationError instanceof Error
            ? serializationError.stack
            : undefined,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          orders: invoice.orders?.length || 0,
        },
      });
      return NextResponse.json(
        {
          error: "Error processing invoice data",
          details:
            serializationError instanceof Error
              ? serializationError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching invoice:", {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      params: await props.params,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const { invoiceNumber } = await props.params;
    const { paymentProofUrl, paymentDate, paymentReference } =
      await request.json();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invoice = await Invoice.findOne({
      invoiceNumber,
      user: user._id,
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update payment proof and date
    invoice.paymentProofUrl = paymentProofUrl;
    invoice.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (paymentReference) invoice.paymentReference = paymentReference;
    await invoice.save();

    // Return updated invoice with populated fields
    const updatedInvoice = await Invoice.findOne({
      invoiceNumber,
      user: user._id,
    })
      .populate({
        path: "user",
        model: User,
        select: "name email address",
      })
      .populate({
        path: "orders",
        model: Order,
        select:
          "name email total subtotal deliveryCost deliveryType status createdAt cartProducts",
        populate: {
          path: "cartProducts.product",
          model: Product,
          select: "name displayNames images price description",
        },
      })
      .populate({
        path: "items.product",
        model: Product,
        select: "name images price description",
      });

    // Convert MongoDB dates to ISO strings for proper JSON serialization
    const serializedInvoice = {
      ...updatedInvoice.toObject(),
      createdAt: updatedInvoice.createdAt.toISOString(),
      periodStart: updatedInvoice.periodStart.toISOString(),
      periodEnd: updatedInvoice.periodEnd.toISOString(),
      paymentProofUrl: updatedInvoice.paymentProofUrl,
      orders: updatedInvoice.orders.map((order: OrderType) => {
        const calculatedSubtotal = order.cartProducts.reduce(
          (sum: number, item: CartProduct) =>
            sum + item.product.price * item.quantity,
          0
        );
        const calculatedDeliveryCost = order.total - calculatedSubtotal;

        return {
          ...order.toObject(),
          _id: order._id.toString(),
          createdAt: order.createdAt.toISOString(),
          subtotal: order.subtotal || calculatedSubtotal,
          deliveryCost: order.deliveryCost || calculatedDeliveryCost,
          total: order.total,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      invoice: serializedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
