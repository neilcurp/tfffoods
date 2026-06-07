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

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await request.json();
    const resolvedParams = await params;
    const { sectionId } = resolvedParams;

    const section = await HeroSection.findByIdAndUpdate(
      sectionId,
      { $set: data },
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
    console.error("Failed to update hero section:", error);
    return NextResponse.json(
      { error: "Failed to update hero section" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const { sectionId } = resolvedParams;

    const section = await HeroSection.findByIdAndDelete(sectionId);

    if (!section) {
      return NextResponse.json(
        { error: "Hero section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Hero section deleted successfully" });
  } catch (error) {
    console.error("Failed to delete hero section:", error);
    return NextResponse.json(
      { error: "Failed to delete hero section" },
      { status: 500 }
    );
  }
}
