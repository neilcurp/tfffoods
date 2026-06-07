import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import HeroSection from "@/models/HeroSection";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { order } = await request.json();

    // Update each section's order
    await Promise.all(
      order.map(async (sectionId: string, index: number) => {
        await HeroSection.findByIdAndUpdate(sectionId, { order: index });
      })
    );

    const sections = await HeroSection.find().sort("order");
    return NextResponse.json(sections);
  } catch (error) {
    console.error("Failed to reorder hero sections:", error);
    return NextResponse.json(
      { error: "Failed to reorder hero sections" },
      { status: 500 }
    );
  }
}
