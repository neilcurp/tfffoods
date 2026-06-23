import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import Category from "@/utils/models/Category";
import type { Language } from "@/types";
import { productCache } from "@/utils/cache";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const { productId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get("language") || "en") as Language;
    const skipCache = searchParams.get("skipCache") === "true";

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check cache first if not skipping
    if (!skipCache) {
      try {
        const cachedProduct = productCache.get(productId);
        if (cachedProduct) {
          // Return cached data with the requested language
          const response = {
            ...cachedProduct,
            name: cachedProduct.displayNames?.[language] || cachedProduct.name,
            description:
              cachedProduct.descriptions?.[language] ||
              cachedProduct.description,
            brand: {
              ...cachedProduct.brand,
              name:
                cachedProduct.brand?.displayNames?.[language] ||
                cachedProduct.brand?.name,
            },
            category: {
              ...cachedProduct.category,
              name:
                cachedProduct.category?.displayNames?.[language] ||
                cachedProduct.category?.name,
              specifications: cachedProduct.category?.specifications?.map(
                (spec: any) => ({
                  ...spec,
                  key: spec.key,
                  type: spec.type,
                  options:
                    spec.type === "select" && spec.options
                      ? {
                          en: spec.options?.en || [],
                          "zh-TW": spec.options?.["zh-TW"] || [],
                          prices: spec.options?.prices || [],
                        }
                      : undefined,
                  required: spec.required,
                  displayNames: spec.displayNames,
                  value: spec.value,
                  label: spec.displayNames?.[language] || spec.key,
                })
              ),
            },
            specifications: cachedProduct.specifications?.map((spec: any) => ({
              ...spec,
              key: spec.key,
              type: spec.type,
              options:
                spec.type === "select" && spec.options
                  ? {
                      en: spec.options?.en || [],
                      "zh-TW": spec.options?.["zh-TW"] || [],
                    }
                  : undefined,
              required: spec.required,
              displayNames: spec.displayNames,
              value: spec.value,
              label: spec.displayNames?.[language] || spec.key,
            })),
          };
          return NextResponse.json({ product: response });
        }
      } catch (error) {
        console.error("Error processing cached product:", error);
        // Don't return error, continue to fetch from DB
      }
    }

    // If not in cache or cache error, fetch from database
    const doc = await Product.findById(productId)
      .populate({
        path: "brand",
        model: Brand,
        select: "name displayNames slug icon isActive",
      })
      .populate({
        path: "category",
        model: Category,
        select: "name displayNames specifications",
      })
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    try {
      // Store in cache
      productCache.set(productId, doc);

      // Format response with language
      const response = {
        ...doc,
        name: doc.displayNames?.[language] || doc.name,
        description: doc.descriptions?.[language] || doc.description,
        brand: {
          ...doc.brand,
          name: doc.brand?.displayNames?.[language] || doc.brand?.name,
        },
        category: {
          ...doc.category,
          name: doc.category?.displayNames?.[language] || doc.category?.name,
          specifications: doc.category?.specifications?.map((spec: any) => ({
            ...spec,
            key: spec.key,
            type: spec.type,
            options:
              spec.type === "select" && spec.options
                ? {
                    en: spec.options?.en || [],
                    "zh-TW": spec.options?.["zh-TW"] || [],
                    prices: spec.options?.prices || [],
                  }
                : undefined,
            required: spec.required,
            displayNames: spec.displayNames,
            value: spec.value,
            label: spec.displayNames?.[language] || spec.key,
          })),
        },
        specifications: doc.specifications?.map((spec: any) => ({
          ...spec,
          key: spec.key,
          type: spec.type,
          options:
            spec.type === "select" && spec.options
              ? {
                  en: spec.options?.en || [],
                  "zh-TW": spec.options?.["zh-TW"] || [],
                  prices: spec.options?.prices || [],
                }
              : undefined,
          required: spec.required,
          displayNames: spec.displayNames,
          value: spec.value,
          label: spec.displayNames?.[language] || spec.key,
        })),
        timestamp: Date.now(),
      };

      return NextResponse.json({ product: response });
    } catch (error) {
      console.error("Error formatting product response:", error);
      return NextResponse.json(
        { error: "Failed to format product data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Clear cache when product is updated
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectToDatabase();
    const { productId } = await params;
    const body = await req.json();

    const doc = await Product.findByIdAndUpdate(
      productId,
      { ...body },
      { new: true, runValidators: true }
    )
      .populate("brand")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Clear cache
    productCache.delete(productId);

    const product = doc as unknown as ProductType;
    const brand = product.brand || defaultBrand;

    const response = {
      _id: product._id.toString(),
      name: product.name,
      displayNames: product.displayNames,
      description: product.description,
      images: product.images,
      price: product.price,
      originalPrice: product.originalPrice,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        displayNames: brand.displayNames || { en: brand.name },
      },
      featured: product.featured || false,
      stock: product.stock || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ product: response });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        message: "Failed to update product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Clear cache when product is deleted
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectToDatabase();
    const { productId } = await params;

    const doc = await Product.findByIdAndDelete(productId)
      .populate("brand")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Clear cache
    productCache.delete(productId);

    const product = doc as unknown as ProductType;
    const brand = product.brand || defaultBrand;

    const response = {
      _id: product._id.toString(),
      name: product.name,
      displayNames: product.displayNames,
      description: product.description,
      images: product.images,
      price: product.price,
      originalPrice: product.originalPrice,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        displayNames: brand.displayNames || { en: brand.name },
      },
      featured: product.featured || false,
      stock: product.stock || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ product: response });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        message: "Failed to delete product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
