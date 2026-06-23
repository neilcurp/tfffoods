import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import User from "@/utils/models/User";
import Invoice from "@/utils/models/Invoice";
import { connectToDatabase } from "@/utils/database";
import { addMonths, startOfDay, endOfDay } from "date-fns";

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const params = await context.params;
    const { isPeriodPaidUser, paymentPeriod } = await request.json();

    const updateData: any = {};
    if (typeof isPeriodPaidUser === "boolean") {
      updateData.isPeriodPaidUser = isPeriodPaidUser;
    }
    if (paymentPeriod !== undefined) {
      updateData.paymentPeriod = paymentPeriod || null;
    }

    const user = await User.findByIdAndUpdate(
      params.userId,
      { $set: updateData },
      { new: true }
    ).select("name email isPeriodPaidUser paymentPeriod");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user is being set as a period user, create their first invoice
    if (isPeriodPaidUser && paymentPeriod) {
      const today = new Date();
      const periodStart = startOfDay(today);
      const periodEnd = endOfDay(
        paymentPeriod === "monthly" ? addMonths(today, 1) : addMonths(today, 3)
      );

      // Create initial invoice
      const invoice = await Invoice.create({
        user: user._id,
        periodStart,
        periodEnd,
        amount: 0, // Initial amount
        status: "pending",
        items: [], // Initial items
        invoiceType: "period",
      });

      // Add invoice to user's payment history
      await User.findByIdAndUpdate(user._id, {
        $push: {
          paymentHistory: {
            periodStart,
            periodEnd,
            amount: 0,
            status: "pending",
            invoice: invoice._id,
          },
        },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating period user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
