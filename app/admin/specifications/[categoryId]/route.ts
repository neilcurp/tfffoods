import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import Category from "@/utils/models/Category";
import connect from "@/utils/config/dbConnection";
import { Types } from "mongoose";

interface Params {
  params: Promise<{
    categoryId: string;
  }>;
}

interface Specification {
  label: string;
  key?: string;
  type: "text" | "number" | "select";
  options?: string[];
  required: boolean;
  description?: string;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { categoryId } = await params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ specifications: category.specifications || [] });
  } catch (error) {
    console.error("Error fetching specifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch specifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    const { categoryId } = await params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    const { specifications } = await request.json();

    // Validate specifications array
    if (!Array.isArray(specifications)) {
      return NextResponse.json(
        { error: "Specifications must be an array" },
        { status: 400 }
      );
    }

    // Validate each specification
    const validatedSpecs: Specification[] = specifications.map((spec) => ({
      label: spec.label.trim(),
      key: spec.key || spec.label.toLowerCase().replace(/\s+/g, "_"),
      type: spec.type,
      options:
        spec.type === "select" ? spec.options?.filter(String) : undefined,
      required: !!spec.required,
      description: spec.description?.trim(),
    }));

    // Update category with new specifications
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { $set: { specifications: validatedSpecs } },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ specifications: category.specifications });
  } catch (error) {
    console.error("Error updating specifications:", error);
    return NextResponse.json(
      { error: "Failed to update specifications" },
      { status: 500 }
    );
  }
}
