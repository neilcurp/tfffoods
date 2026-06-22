import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import StoreSettings from "@/utils/models/StoreSettings";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();

      // Wait for connection to be ready with timeout
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      // Get store settings from database
      let settings = await StoreSettings.findOne();

      // If no settings exist, create default settings
      if (!settings) {
        settings = await StoreSettings.create({
          contactInfo: {
            email: "contact@example.com",
            phone: "+1234567890",
          },
        });
      }

      return NextResponse.json(settings);
    } catch (error) {
      console.error(
        `Failed to fetch store settings (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        return NextResponse.json(
          { error: "Failed to fetch store settings" },
          { status: 500 }
        );
      }

      // Wait longer between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the request body EXACTLY ONCE, before the retry loop. A Request body
  // is a single-use stream, so reading it inside the loop would throw
  // "Body has already been read" on the first retry and mask the real error.
  let body: { settings?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { settings } = body;
  if (!settings) {
    return NextResponse.json({ error: "No settings provided" }, { status: 400 });
  }

  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      // Update settings
      const updatedSettings = await StoreSettings.findOneAndUpdate(
        {},
        { $set: settings },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      console.log(
        "Updated settings:",
        JSON.stringify(updatedSettings, null, 2)
      );
      return NextResponse.json(updatedSettings);
    } catch (error) {
      console.error(
        `Failed to save store settings (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
          { error: "Failed to save store settings", details: errorMessage },
          { status: 500 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}
