import connect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ search: string }> }
) {
  try {
    await connect();
    const { search: searchTerm } = await params;
    const searchTermRegex = new RegExp(searchTerm, "i");

    const foundProducts = await Product.find({
      $or: [
        { name: { $regex: searchTermRegex } },
        { description: { $regex: searchTermRegex } },
        { slug: { $regex: searchTermRegex } },
        { "displayNames.en": { $regex: searchTermRegex } },
        { "displayNames.zh-TW": { $regex: searchTermRegex } },
      ],
    })
      .populate({
        path: "brand",
        model: Brand,
        select: "name displayNames",
      })
      .sort({ order: 1 })
      .lean();

    if (!foundProducts || foundProducts.length === 0) {
      return NextResponse.json(
        { message: "No products found" },
        { status: 404 }
      );
    }

    return NextResponse.json(foundProducts);
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { message: "Error searching products" },
      { status: 500 }
    );
  }
}
