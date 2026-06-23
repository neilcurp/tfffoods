import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import connectToDatabase from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    if (!orderId) {
      return NextResponse.redirect(
        new URL("/checkout?err=no_order", url.origin)
      );
    }

    const secretKey = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secretKey) {
      return NextResponse.redirect(new URL("/checkout?err=no_sk", url.origin));
    }

    await connectToDatabase();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.redirect(
        new URL("/checkout?err=order_not_found", url.origin)
      );
    }

    const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
    const toNumber = (val: unknown): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const cleaned = val.replace(/[^0-9.\-]/g, "");
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const products = await Product.find({
      _id: { $in: order.items.map((i: any) => i.id) },
    });
    const productIdToProduct: Record<string, any> = {};
    for (const p of products) productIdToProduct[p._id.toString()] = p;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of order.items as any[]) {
      const prod = productIdToProduct[item.id.toString()];
      const unitAmount = Math.round(toNumber(prod?.price) * 100);
      line_items.push({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: (prod?.displayNames?.en || prod?.name || "Product") as string,
          },
        },
      });
    }
    const deliveryCostNum = toNumber(order.deliveryCost);
    if (deliveryCostNum && deliveryCostNum > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(deliveryCostNum * 100),
          product_data: { name: "Delivery" },
        },
      });
    }

    const stripe = new Stripe(secretKey);
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || url.origin;

    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${appBaseUrl}/checkout/success?orderId=${order._id}`,
      cancel_url: `${appBaseUrl}/orders/${order._id}?canceled=1`,
      metadata: { orderId: order._id.toString(), userEmail: order.email },
    });

    const checkoutUrl = (sessionStripe as any).url as string | undefined;
    if (checkoutUrl) {
      return NextResponse.redirect(checkoutUrl, { status: 303 });
    }
    // Fallback: let client handle with session id
    return NextResponse.redirect(
      new URL(`/checkout?sid=${sessionStripe.id}`, url.origin)
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL("/checkout?err=redirect_failed", new URL(request.url).origin)
    );
  }
}
