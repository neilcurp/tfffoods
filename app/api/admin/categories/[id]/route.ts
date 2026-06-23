import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import dbConnect from "@/utils/config/dbConnection";
import Category from "@/utils/models/Category";

// PUT update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, displayNames, descriptions, order, isActive } = body;

    if (!displayNames?.en || !displayNames?.["zh-TW"]) {
      return NextResponse.json(
        { error: "Category names are required in both languages" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if another category with same name or slug exists (excluding current category)
    const existingCategory = await Category.findOne({
      $or: [
        { name },
        { slug },
        { "displayNames.en": displayNames.en },
        { "displayNames.zh-TW": displayNames["zh-TW"] },
      ],
      _id: { $ne: id },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name or slug already exists" },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        displayNames,
        descriptions: descriptions || { en: "", "zh-TW": "" },
        order,
        isActive,
      },
      { new: true }
    );

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error in PUT /api/admin/categories/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    await dbConnect();
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/categories/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
