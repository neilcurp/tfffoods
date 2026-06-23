import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import BlogPost from "@/utils/models/BlogPost";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await connectToDatabase();

    // Try to find by ID first
    let post;
    if (mongoose.Types.ObjectId.isValid(id)) {
      post = await BlogPost.findById(id).lean();
    }

    // If not found by ID, try to find by slug
    if (!post) {
      post = await BlogPost.findOne({ slug: id }).lean();
    }

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await request.json();

    await connectToDatabase();

    // Find the existing post
    const existingPost = await BlogPost.findById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // If the post is being marked as featured, unmark other posts first
    if (data.featured && !existingPost.featured) {
      await BlogPost.updateMany({ _id: { $ne: id } }, { featured: false });
    }

    // Set publishedAt date if status is being changed to published
    if (data.status === "published" && existingPost.status !== "published") {
      data.publishedAt = new Date();
    }

    // Update the post fields
    Object.assign(existingPost, data);

    // Save the post to trigger the pre-save middleware
    const updatedPost = await existingPost.save();

    // Revalidate the blog pages
    revalidatePath("/blog");
    revalidatePath(`/blog/${updatedPost.slug}`);

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    await connectToDatabase();

    const post = await BlogPost.findByIdAndDelete(id);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Revalidate the blog pages after deletion
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
