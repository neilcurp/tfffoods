import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import Category from "@/utils/models/Category";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    await connectToDatabase();
    const { category } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "en";

    if (!category) {
      return NextResponse.json(
        { message: "Category identifier is required" },
        { status: 400 }
      );
    }

    // Try to find category by slug first, then by ID
    let categoryDoc = await Category.findOne({ slug: category });

    if (!categoryDoc && /^[0-9a-fA-F]{24}$/.test(category)) {
      categoryDoc = await Category.findById(category);
    }

    if (!categoryDoc) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // Format the response with the correct language
    const formattedCategory = {
      ...categoryDoc.toObject(),
      name: categoryDoc.displayNames?.[language] || categoryDoc.name,
    };

    return NextResponse.json({ category: formattedCategory });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
