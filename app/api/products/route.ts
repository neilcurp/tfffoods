/* eslint-disable @typescript-eslint/no-unused-vars */
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import Product from "@/utils/models/Product";
import Category from "@/utils/models/Category";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import dbConnect from "@/utils/config/dbConnection";
import Brand from "@/utils/models/Brand";
import { Types } from "mongoose";
import { createRouteHandler } from "@/utils/routeHandler";
import "@/utils/models"; // Ensure models are registered
import { productsCache, clearAllProductCaches } from "@/utils/cache";

export const dynamic = "force-dynamic";

// Cache TTL in milliseconds (30 seconds)
const CACHE_TTL = 30 * 1000;

interface Specification {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
}

interface ProductQuery {
  price: {
    $gte: number;
    $lte: number;
  };
  draft: {
    $ne: boolean;
  };
  brand?: string;
  category?: Types.ObjectId;
}

interface SortQuery {
  [key: string]: 1 | -1;
}

interface ProductSpecification {
  key: string;
  value: {
    en: string;
    "zh-TW": string;
  };
  type: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  options?: {
    en: string[];
    "zh-TW": string[];
    prices?: number[];
  };
  required?: boolean;
  selectedOptionPrice?: number;
}

interface ProductData {
  user: string;
  name: string;
  description: string;
  brand: string;
  images: string[];
  price: number;
  netPrice: number;
  originalPrice: number;
  stock: number;
  category: string;
  specifications: ProductSpecification[];
  draft?: boolean;
  version?: number;
  featured?: boolean;
  isBestSelling?: boolean;
  isProductOfTheMonth?: boolean;
  productOfTheMonthDetails?: Record<string, any>;
}

interface QueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  category?: string;
}

interface SortOptions {
  [key: string]: { [key: string]: 1 | -1 };
}

interface SortOrder {
  [key: string]: 1 | -1;
}

const handleProducts = createRouteHandler();

export async function GET(request: NextRequest) {
  console.log("🔍 API Request received:", request.url);
  return handleProducts(async () => {
    const { searchParams } = new URL(request.url);
    // Ensure page is at least 1, even if 0 is passed
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const brandId = searchParams.get("brand") || undefined;
    const categoryId = searchParams.get("category") || undefined;
    const includeDrafts = searchParams.get("includeDrafts") === "true";
    const featured = searchParams.get("featured") === "true";
    const language = searchParams.get("language") || "en";
    const skipCache = searchParams.get("skipCache") === "true";

    // Create cache key based on query parameters
    const cacheKey = JSON.stringify({
      page,
      limit,
      minPrice,
      maxPrice,
      brandId,
      categoryId,
      includeDrafts,
      featured,
      language,
    });

    // Check cache first if not skipping cache
    if (!skipCache) {
      const cachedData = productsCache.get(cacheKey);
      if (cachedData) {
        console.log("💾 Returning cached data for GET request");
        return cachedData;
      }
    }

    const query: any = {
      price: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    };

    // Only include non-draft products unless explicitly requested
    if (!includeDrafts) {
      query.draft = { $ne: true };
    }

    if (brandId) {
      query.brand = brandId;
    }

    if (categoryId) {
      query.category = new Types.ObjectId(categoryId);
    }

    if (featured) {
      query.featured = true;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand")
        .populate("category")
        .sort({ order: 1, createdAt: -1 }) // Sort by order first, then creation date
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Store in cache with timestamp
    const response = {
      products: products.map((product: any) => ({
        ...product,
        slug:
          product.slug ||
          product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        order: product.order || 0,
        name: product.displayNames?.[language] || product.name,
        displayNames: product.displayNames || {
          en: product.name,
          "zh-TW": product.name,
        },
        description: product.descriptions?.[language] || product.description,
        brand: {
          ...product.brand,
          name: product.brand.displayNames?.[language] || product.brand.name,
        },
        category: {
          ...product.category,
          name:
            product.category?.displayNames?.[language] ||
            product.category?.name,
        },
        averageRating: product.averageRating ?? 0,
        numReviews: product.numReviews ?? 0,
        featured: product.featured || false,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      timestamp: Date.now(),
    };

    productsCache.set(cacheKey, response);
    console.log("📦 MongoDB Response:", {
      count: products.length,
      ids: products.map((p) => p._id),
      timestamp: new Date().toISOString(),
    });
    return response;
  });
}

export async function POST(request: Request) {
  return handleProducts(async () => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.admin) {
        console.error(
          "Unauthorized: Admin access required",
          session?.user?.email
        );
        throw new Error("Unauthorized");
      }

      // Clone the request before reading the body
      const data: ProductData = await request.json();
      console.log("Received product data:", JSON.stringify(data, null, 2));

      // Validate required fields
      if (!data.name || !data.description || !data.brand || !data.category) {
        console.error("Missing required fields:", { data });
        throw new Error(
          "Missing required fields: name, description, brand, or category"
        );
      }

      if (!data.images || data.images.length === 0) {
        console.error("No images provided");
        throw new Error("At least one image is required");
      }

      if (typeof data.price !== "number" || data.price <= 0) {
        console.error("Invalid price:", data.price);
        throw new Error("Valid price is required");
      }

      if (typeof data.stock !== "number" || data.stock < 0) {
        console.error("Invalid stock:", data.stock);
        throw new Error("Valid stock quantity is required");
      }

      try {
        // Get the highest order value and add 1
        const highestOrder = await Product.findOne({})
          .sort({ order: -1 })
          .select("order")
          .lean();
        const order = (highestOrder?.order || 0) + 1;

        // Validate and format specifications
        const specifications = Array.isArray(data.specifications)
          ? data.specifications.map((spec) => {
              console.log(
                "Processing specification:",
                JSON.stringify(spec, null, 2)
              );
              return {
                key: spec.key,
                value: {
                  en: spec.value.en || "",
                  "zh-TW": spec.value["zh-TW"] || "",
                },
                type: spec.type,
                displayNames: {
                  en: spec.displayNames?.en || spec.key,
                  "zh-TW": spec.displayNames?.["zh-TW"] || spec.key,
                },
                options:
                  spec.type === "select"
                    ? {
                        en: Array.isArray(spec.options?.en)
                          ? spec.options.en
                          : [],
                        "zh-TW": Array.isArray(spec.options?.["zh-TW"])
                          ? spec.options["zh-TW"]
                          : [],
                        prices: Array.isArray(spec.options?.prices)
                          ? spec.options.prices
                          : [],
                      }
                    : undefined,
                selectedOptionPrice: spec.selectedOptionPrice || 0,
                required: spec.required || false,
              };
            })
          : [];

        // Log the specifications for debugging
        console.log(
          "Formatted specifications:",
          JSON.stringify(specifications, null, 2)
        );

        // Create product with specifications
        const productDoc = {
          ...data,
          user: session.user.id,
          order,
          displayNames: {
            en: data.displayNames?.en || data.name,
            "zh-TW": data.displayNames?.["zh-TW"] || data.name,
          },
          descriptions: {
            en: data.descriptions?.en || data.description,
            "zh-TW": data.descriptions?.["zh-TW"] || data.description,
          },
          specifications,
          version: 1,
          featured: data.featured || false,
          isBestSelling: data.isBestSelling || false,
          isProductOfTheMonth: data.isProductOfTheMonth || false,
          productOfTheMonthDetails: data.productOfTheMonthDetails || {},
        };

        console.log(
          "Creating product with data:",
          JSON.stringify(productDoc, null, 2)
        );

        const product = await Product.create(productDoc);

        // Clear all product caches after creating a new product
        clearAllProductCaches();

        console.log("Created product:", JSON.stringify(product, null, 2));
        return { success: true, product };
      } catch (error) {
        console.error("Error creating product in database:", {
          error,
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          validationErrors:
            error instanceof Error && "errors" in error
              ? error.errors
              : undefined,
          data: JSON.stringify(data, null, 2),
        });
        if (error instanceof Error) {
          if (error.message.includes("duplicate key error")) {
            throw new Error("A product with this name already exists");
          }
          if ("errors" in error) {
            // This is a Mongoose validation error
            const validationErrors = Object.values(error.errors || {})
              .map((err) => err.message)
              .join(", ");
            throw new Error(`Validation failed: ${validationErrors}`);
          }
          throw new Error(error.message);
        }
        throw new Error("Failed to create product");
      }
    } catch (error) {
      console.error("Error in POST /api/products:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  });
}
