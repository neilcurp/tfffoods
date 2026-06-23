import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Product from "@/utils/models/Product";
import Category from "@/utils/models/Category";
import Brand from "@/utils/models/Brand";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import type { Product as ProductType } from "@/types";
import { Document } from "mongoose";
import { clearAllProductCaches } from "@/utils/cache";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  admin: boolean;
  profileImage: string;
  role: "user" | "admin" | "accounting" | "logistics";
}

interface Session {
  user: SessionUser;
}

interface Params {
  productId: string;
}

interface PopulatedBrand {
  _id: mongoose.Types.ObjectId;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

interface PopulatedCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  specifications: Array<{
    key: string;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
    type: string;
  }>;
}

interface PopulatedProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: PopulatedBrand;
  category: PopulatedCategory;
  specifications: Array<{
    key: string;
    value: {
      en: string;
      "zh-TW": string;
    };
    type: string;
    displayNames: {
      en: string;
      "zh-TW": string;
    };
  }>;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  draft: boolean;
  slug: string;
  order: number;
}

interface ProductData extends Document {
  user: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: mongoose.Types.ObjectId | string;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  category: mongoose.Types.ObjectId | string;
  specifications: Array<{
    key: string;
    value: string | number | { en: string; "zh-TW": string };
    type: string;
  }>;
  draft: boolean;
  slug: string;
  order: number;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const resolvedParams = await params;
    const { productId } = resolvedParams;
    console.log("Product ID:", productId);

    await connectToDatabase();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.error("Invalid product ID:", productId);
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Fetch product with populated brand and category
    const product = (await Product.findById(productId)
      .populate({
        path: "brand",
        select: "name displayNames isActive",
      })
      .populate({
        path: "category",
        select: "name displayNames specifications",
      })
      .lean()) as unknown as PopulatedProduct;

    console.log("Found product:", product);

    if (!product) {
      console.error("Product not found for ID:", productId);
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Initialize specifications from category if empty
    if (!product.specifications || product.specifications.length === 0) {
      product.specifications =
        product.category.specifications?.map((spec) => ({
          key: spec.key || spec.label?.toLowerCase().replace(/\s+/g, "_"),
          value: {
            en: "",
            "zh-TW": "",
          },
          type: spec.type || "text",
          displayNames: spec.displayNames || {
            en: spec.key || spec.label || "",
            "zh-TW": spec.key || spec.label || "",
          },
        })) || [];
    }

    // Format the response
    const formattedProduct = {
      ...product,
      _id: product._id.toString(),
      brand: {
        _id: product.brand._id.toString(),
        name: product.brand.name,
        displayNames: product.brand.displayNames,
        isActive: product.brand.isActive,
      },
      category: {
        _id: product.category._id.toString(),
        name: product.category.name,
        displayNames: product.category.displayNames,
        specifications: product.category.specifications,
      },
      specifications: product.specifications,
      user: product.user.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    console.log("Returning formatted product:", formattedProduct);
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Params }
): Promise<NextResponse> {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const resolvedParams = await params;
    const { productId } = resolvedParams;
    console.log("PUT request for product ID:", productId);

    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.admin) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await request.json()) as ProductData;
    console.log("Received product data:", JSON.stringify(data, null, 2));

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Find the product first to get category and brand IDs
    const product = (await Product.findById(productId)
      .session(mongoSession)
      .lean()) as unknown as ProductData;

    if (!product) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Validate required fields
    if (!data.name || !data.displayNames || !data.brand || !data.category) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug from name if name changed
    const slug = data.name
      ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : product.slug;

    // Ensure images array is properly handled
    const updatedData = {
      ...data,
      slug,
      user: session.user.id,
      images: Array.isArray(data.images) ? data.images : [],
      brand: mongoose.Types.ObjectId.isValid(data.brand) ? data.brand : null,
      category: mongoose.Types.ObjectId.isValid(data.category)
        ? data.category
        : null,
    };

    if (!updatedData.brand || !updatedData.category) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: "Invalid brand or category ID" },
        { status: 400 }
      );
    }

    // Update the product
    const updatedProduct = (await Product.findByIdAndUpdate(
      productId,
      updatedData,
      { new: true, runValidators: true }
    )
      .session(mongoSession)
      .populate({
        path: "brand",
        select: "name displayNames",
      })
      .populate({
        path: "category",
        select: "name displayNames specifications",
      })
      .lean()) as unknown as ProductType;

    if (!updatedProduct) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    // Commit transaction
    await mongoSession.commitTransaction();

    // Clear all product caches
    clearAllProductCaches(productId);

    console.log("Successfully updated product:", updatedProduct._id);
    return NextResponse.json({
      ...updatedProduct,
      timestamp: Date.now(), // Add timestamp for cache busting
    });
  } catch (error) {
    // Only abort if transaction hasn't been committed
    if (mongoSession.inTransaction()) {
      await mongoSession.abortTransaction();
    }
    console.error("Error in PUT handler:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.productId;

    // Connect to database first!
    await connectToDatabase();

    const deletedProduct = await Product.findByIdAndDelete(productId);
    console.log("✅ MongoDB Delete Result:", {
      productId,
      deleted: !!deletedProduct,
      timestamp: new Date().toISOString(),
    });

    if (!deletedProduct) {
      console.log("❌ Product not found in DB:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clear ALL product-related caches
    console.log("🧹 Clearing ALL caches for product:", productId);
    clearAllProductCaches(productId);

    return NextResponse.json({ deletedProductId: productId });
  } catch (error) {
    console.error("❌ Delete Error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
