import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import HeroSection from "@/models/HeroSection";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    // Wait for connection to be ready with timeout
    const isConnected = await waitForConnection();
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const sections = await HeroSection.find().sort("order");
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Failed to fetch hero sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero sections" },
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

    await connectToDatabase();

    // Wait for connection to be ready with timeout
    const isConnected = await waitForConnection();
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const data = await request.json();

    // Ensure media object has default values
    const sectionData = {
      ...data,
      media: {
        videoUrl: data.media?.videoUrl || "",
        posterUrl: data.media?.posterUrl || "/images/placeholder-hero.jpg",
        mediaType: data.media?.mediaType || "image",
      },
    };

    const section = await HeroSection.create(sectionData);
    return NextResponse.json(section);
  } catch (error) {
    console.error("Failed to create hero section:", error);
    return NextResponse.json(
      {
        error: "Failed to create hero section",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
