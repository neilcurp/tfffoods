import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import HeroSection from "@/models/HeroSection";

interface Params {
  params: {
    sectionId: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Resolve params first
    const resolvedParams = await params;
    const { sectionId } = resolvedParams;

    // Deactivate all sections first
    await HeroSection.updateMany({}, { isActive: false });

    // Activate the selected section
    const section = await HeroSection.findByIdAndUpdate(
      sectionId,
      { isActive: true },
      { new: true }
    );

    if (!section) {
      return NextResponse.json(
        { error: "Hero section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error("Failed to activate hero section:", error);
    return NextResponse.json(
      { error: "Failed to activate hero section" },
      { status: 500 }
    );
  }
}
