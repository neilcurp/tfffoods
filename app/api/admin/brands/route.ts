import { NextResponse } from "next/server";
import Brand from "@/utils/models/Brand";
import { connectToDatabase } from "@/utils/database";

export async function GET() {
  try {
    await connectToDatabase();
    // Only get non-deleted brands
    const brands = await Brand.find({ deletedAt: null }).sort({ order: 1 });
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating brand with data:", body);

    await connectToDatabase();

    // Create the brand with current timestamp
    const brand = await Brand.create({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Brand created successfully:", brand);
    return NextResponse.json(brand);
  } catch (error) {
    console.error(
      "Error creating brand:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create brand",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updateData } = await request.json();
    await connectToDatabase();

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update brand",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    console.log("Deleting brand with ID:", id);

    await connectToDatabase();

    // Actually delete the record
    const brand = await Brand.findByIdAndDelete(id);
    console.log("Delete result:", brand);

    if (!brand) {
      console.log("Brand not found with ID:", id);
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete brand",
      },
      { status: 500 }
    );
  }
}
