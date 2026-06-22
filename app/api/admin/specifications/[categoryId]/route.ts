import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Category from "@/utils/models/Category";
import { Types } from "mongoose";

interface Specification {
  label: string;
  key: string;
  type: "text" | "number" | "select";
  options?: {
    en: string[];
    "zh-TW": string[];
    prices?: number[];
  };
  required: boolean;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
}

export const dynamic = "force-dynamic";

// GET specifications for a category
export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { categoryId } = resolvedParams;
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Validate ObjectId
    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    const category = await Category.findById(categoryId);
    console.log("GET - Category from DB:", JSON.stringify(category, null, 2));

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Specifications retrieved successfully",
      specifications: category.specifications || [],
    });
  } catch (error) {
    console.error("Error fetching specifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch specifications" },
      { status: 500 }
    );
  }
}

// POST to update specifications for a category
export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId } = await params;

    await connectToDatabase();

    // Validate ObjectId
    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    const { specifications } = await request.json();
    console.log(
      "POST - Received specifications:",
      JSON.stringify(specifications, null, 2)
    );

    // Validate specifications array
    if (!Array.isArray(specifications)) {
      return NextResponse.json(
        { error: "Specifications must be an array" },
        { status: 400 }
      );
    }

    // Validate each specification
    const validatedSpecs: Specification[] = specifications.map(
      (spec, index) => {
        // Validate required multilingual fields
        if (!spec.displayNames?.en || !spec.displayNames?.["zh-TW"]) {
          throw new Error(
            `Specification ${index + 1} is missing display names`
          );
        }

        // Generate a unique key from English display name
        const key = spec.displayNames.en
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores

        return {
          label: spec.displayNames.en.trim(), // Use English display name as label
          key,
          type: spec.type,
          options:
            spec.type === "select"
              ? {
                  en: spec.options?.en?.filter(Boolean) || [],
                  "zh-TW": spec.options?.["zh-TW"]?.filter(Boolean) || [],
                  prices:
                    spec.options?.prices?.map((p) => {
                      const num = typeof p === "string" ? parseFloat(p) : p;
                      return isNaN(num) ? 0 : Math.round(num * 100) / 100;
                    }) ||
                    Array(spec.options?.en?.filter(Boolean).length || 0).fill(
                      0
                    ),
                }
              : undefined,
          required: !!spec.required,
          displayNames: {
            en: spec.displayNames.en.trim(),
            "zh-TW": spec.displayNames["zh-TW"].trim(),
          },
          descriptions: {
            en: spec.descriptions?.en?.trim() || "",
            "zh-TW": spec.descriptions?.["zh-TW"]?.trim() || "",
          },
        };
      }
    );

    // Check for duplicate keys
    const keys = validatedSpecs.map((spec) => spec.key);
    const duplicateKeys = keys.filter(
      (key, index) => keys.indexOf(key) !== index
    );
    if (duplicateKeys.length > 0) {
      return NextResponse.json(
        {
          error: `Duplicate specification keys found: ${duplicateKeys.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Update the category with new specifications
    const result = await Category.findOneAndUpdate(
      { _id: categoryId },
      { $set: { specifications: validatedSpecs } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify the update
    const verifyCategory = await Category.findById(categoryId);
    if (!verifyCategory?.specifications?.length) {
      return NextResponse.json(
        { error: "Failed to save specifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Specifications saved successfully",
      specifications: verifyCategory.specifications,
    });
  } catch (error) {
    console.error("Error updating specifications:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update specifications";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
