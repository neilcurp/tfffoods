import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { GuaranteeSection } from "@/models/GuaranteeSection";

// GET guarantee section
export async function GET() {
  try {
    await connectToDatabase();
    const guaranteeSection = await GuaranteeSection.findOne({});
    return NextResponse.json({
      title: guaranteeSection?.title || { en: "", "zh-TW": "" },
      items: guaranteeSection?.items || [],
    });
  } catch (error) {
    console.error("Error fetching guarantee section:", error);
    return NextResponse.json(
      { error: "Failed to fetch guarantee section" },
      { status: 500 }
    );
  }
}

// POST guarantee section
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { title, items } = await request.json();
    await connectToDatabase();
    let guaranteeSection = await GuaranteeSection.findOne({});
    if (!guaranteeSection) {
      guaranteeSection = new GuaranteeSection({ title, items });
    } else {
      guaranteeSection.title = title;
      guaranteeSection.items = items;
    }
    await guaranteeSection.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating guarantee section:", error);
    return NextResponse.json(
      { error: "Failed to update guarantee section" },
      { status: 500 }
    );
  }
}
