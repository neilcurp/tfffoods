import connect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ brand: string }> }
) {
  await connect();

  const { brand } = await params;

  function createFlexibleSearchPattern(input: string) {
    const stripped = input.replace(/\s+/g, "").toLowerCase();
    return stripped.split("").join("\\s*");
  }

  try {
    const flexiblePattern = createFlexibleSearchPattern(brand);

    const brandRegex = new RegExp(flexiblePattern, "i");

    const foundProducts = await Product.find({ brand: brandRegex })
      .populate("user")
      .sort({ createdAt: -1 });

    if (foundProducts && foundProducts.length > 0) {
      return NextResponse.json(foundProducts);
    } else {
      return NextResponse.json(
        { error: "error fetching brand products with this name" },
        { status: 404 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "error fetching brand products", details: errorMessage },
      { status: 500 }
    );
  }
}
