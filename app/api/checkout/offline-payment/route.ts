import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Invoice from "@/utils/models/Invoice";
import invoiceNumberService from "@/utils/services/invoiceNumberService";

interface CartItem {
  id: string;
  quantity: number;
  price: number;
}

interface CartProduct {
  product: string;
  quantity: number;
  price: number;
}

export async function POST(req: Request) {
  try {
    console.log("Starting offline payment processing...");

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("Session:", {
      userId: session?.user?._id,
      email: session?.user?.email,
    });

    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connect();
    console.log("Database connected");

    const body = await req.json();
    console.log("Request body:", body);

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "cartItems",
      "paymentProofUrl",
      "paymentReference",
      "billingAddress",
      "shippingAddress",
    ];

    console.log("Checking required fields...");
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Map cartItems to cartProducts structure required by the Order model
    console.log("Mapping cart items...");
    const cartProducts: CartProduct[] = body.cartItems.map(
      (item: CartItem) => ({
        product: item.id,
        quantity: item.quantity,
        price: item.price,
      })
    );

    // Calculate total
    const subtotal = cartProducts.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );
    console.log("Calculated subtotal:", subtotal);

    // Add delivery cost if present
    const deliveryCost = body.deliveryCost || 0;
    const total = subtotal + deliveryCost;
    console.log("Total with delivery:", total);

    // Generate invoice number for one-time payment
    console.log("Generating invoice number...");
    const invoiceNumber =
      await invoiceNumberService.generateOneTimeInvoiceNumber();
    console.log("Generated invoice number:", invoiceNumber);

    // Generate order reference
    console.log("Generating order reference...");
    const orderReference = await invoiceNumberService.generateOrderReference();
    console.log("Generated order reference:", orderReference);

    // Create the order with offline payment info
    console.log("Creating order...");
    const order = await Order.create({
      orderReference,
      name: body.name,
      email: body.email,
      cartProducts,
      subtotal,
      deliveryType: body.deliveryType,
      deliveryCost,
      total,
      status: "pending",
      paid: false,
      user: session.user._id,
      paymentProofUrl: body.paymentProofUrl,
      paymentReference: body.paymentReference,
      invoiceNumber,
      billingAddress: body.billingAddress,
      shippingAddress: body.shippingAddress,
      orderType: "onetime-order",
    });
    console.log("Order created:", order._id);

    // Create invoice for offline payment
    console.log("Creating invoice...");
    const invoice = await Invoice.create({
      user: session.user._id,
      invoiceNumber,
      invoiceType: "one-time",
      periodStart: new Date(),
      periodEnd: new Date(),
      amount: total,
      items: cartProducts.map((item: CartProduct) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      status: "pending",
      paymentMethod: "bank_transfer",
      orders: [order._id],
      billingAddress: body.billingAddress,
      shippingAddress: body.shippingAddress,
      paymentProofUrl: body.paymentProofUrl,
      paymentReference: body.paymentReference,
      paymentDate: body.paymentDate,
    });
    console.log("Invoice created:", invoice._id);

    return NextResponse.json({
      success: true,
      orderId: order._id,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error("Error processing offline payment:", error);
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to submit offline payment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
