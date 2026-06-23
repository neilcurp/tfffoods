import { NextResponse } from "next/server";
import Newsletter from "@/utils/models/Newsletter";
import { connectToDatabase } from "@/utils/database";
import { validateEmail } from "@/utils/validation";
import { sendEmail } from "@/lib/emailService";

function buildSubscribeConfirmationEmail(email: string) {
  const subject = "Welcome to tfffoods newsletter / 歡迎訂閱 tfffoods 電子報";
  const text = `Thanks for subscribing to tfffoods newsletter.

Thank you for joining us. We will send updates, promotions, and new arrivals to this email:
${email}

You can unsubscribe anytime from future campaign emails.

---

感謝您訂閱 tfffoods 電子報。
我們會把最新消息、優惠和新品資訊發送到這個電郵：
${email}

您可在日後活動電郵中隨時取消訂閱。`;

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 12px;">Welcome to tfffoods newsletter</h2>
      <p>Thanks for subscribing. We'll send updates, promotions, and new arrivals to:</p>
      <p><strong>${email}</strong></p>
      <p style="margin-bottom:24px;">You can unsubscribe anytime from future campaign emails.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <h2 style="margin:0 0 12px;">歡迎訂閱 tfffoods 電子報</h2>
      <p>感謝您訂閱！我們會把最新消息、優惠和新品資訊發送到：</p>
      <p><strong>${email}</strong></p>
      <p>您可在日後活動電郵中隨時取消訂閱。</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();
    const canSendRealEmail = Boolean(
      process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL
    );

    // Validate email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if email already exists
    const existingSubscriber = await Newsletter.findByEmail(email);

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: "Email is already subscribed" },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        await existingSubscriber.resubscribe();
        const mail = buildSubscribeConfirmationEmail(email);
        const emailResult = await sendEmail({ to: email, ...mail });
        if (emailResult.success && canSendRealEmail) {
          await Newsletter.findByIdAndUpdate(existingSubscriber._id, {
            lastEmailSentAt: new Date(),
          });
        } else {
          console.error(
            "Newsletter re-subscribe confirmation email failed:",
            emailResult.error
          );
        }
        return NextResponse.json(
          { message: "Subscription reactivated successfully" },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    const subscriber = new Newsletter({
      email,
      source: source || "website",
      preferences: {
        marketing: true,
        updates: true,
        promotions: true,
      },
    });

    await subscriber.save();
    const mail = buildSubscribeConfirmationEmail(email);
    const emailResult = await sendEmail({ to: email, ...mail });
    if (emailResult.success && canSendRealEmail) {
      await Newsletter.findByIdAndUpdate(subscriber._id, {
        lastEmailSentAt: new Date(),
      });
    } else {
      console.error(
        "Newsletter subscribe confirmation email failed:",
        emailResult.error
      );
    }

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
