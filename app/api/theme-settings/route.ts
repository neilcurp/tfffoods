import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import dbConnect from "@/utils/config/dbConnection";
import StoreSettings from "@/utils/models/StoreSettings";

export async function GET() {
  try {
    await dbConnect();

    const settings = await StoreSettings.findOne();
    if (!settings?.themeSettings) {
      return NextResponse.json({
        themeSettings: {
          light: {
            background: "#ffffff",
            card: "#ffffff",
            navbar: "#ffffff",
            text: "#000000",
            mutedText: "#666666",
            border: "#e5e7eb",
            footer: "#f9fafb",
            cardBorder: "#e5e7eb",
            cardItemBorder: "#e5e7eb",
            backgroundOpacity: 100,
            cardOpacity: 100,
            navbarOpacity: 100,
            fontScale: 100,
          },
          dark: {
            background: "#1a1a1a",
            card: "#1e1e1e",
            navbar: "#1e1e1e",
            text: "#ffffff",
            mutedText: "#a1a1a1",
            border: "#374151",
            footer: "#111827",
            cardBorder: "#374151",
            cardItemBorder: "#374151",
            backgroundOpacity: 100,
            cardOpacity: 100,
            navbarOpacity: 100,
            fontScale: 100,
          },
        },
      });
    }

    return NextResponse.json({ themeSettings: settings.themeSettings });
  } catch (error) {
    console.error("Failed to fetch theme settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch theme settings" },
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

    await dbConnect();

    const { themeSettings } = await request.json();
    if (!themeSettings) {
      return NextResponse.json(
        { error: "No theme settings provided" },
        { status: 400 }
      );
    }

    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: { themeSettings } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ themeSettings: settings.themeSettings });
  } catch (error) {
    console.error("Failed to save theme settings:", error);
    return NextResponse.json(
      { error: "Failed to save theme settings" },
      { status: 500 }
    );
  }
}
