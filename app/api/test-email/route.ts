import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get("email") || "test@example.com";
    const debug = url.searchParams.get("debug") === "1";

    const envInfo = {
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL,
      senderEmail: process.env.BREVO_SENDER_EMAIL,
    };
    console.log("Environment check:", envInfo);

    const result = await sendEmail({
      to: email,
      subject: "Test Email from EcommApp",
      text: "This is a test email from your ecommerce app",
      html: "<h1>Test Email</h1><p>This is a test email from your ecommerce app</p>",
    });

    return NextResponse.json({
      ok: true,
      sent: result.success,
      result,
      ...(debug ? { env: envInfo } : {}),
    });
  } catch (error) {
    console.error("Test email GET error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log environment variables (without exposing sensitive data)
    console.log("Environment check:", {
      hasBrevoKey: !!process.env.BREVO_API_KEY,
      hasSenderEmail: !!process.env.BREVO_SENDER_EMAIL,
      senderEmail: process.env.BREVO_SENDER_EMAIL,
    });

    const { email = "test@example.com" } = await request.json();
    console.log("Attempting to send test email to:", email);

    const result = await sendEmail({
      to: email,
      subject: "Test Email from EcommApp",
      text: "This is a test email from your ecommerce app",
      html: "<h1>Test Email</h1><p>This is a test email from your ecommerce app</p>",
    });

    console.log("Email send result:", {
      success: result.success,
      error: result.error,
      timestamp: result.timestamp,
    });

    if (result.success) {
      return NextResponse.json({ message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
