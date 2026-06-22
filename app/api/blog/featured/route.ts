import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import BlogPost from "@/utils/models/BlogPost";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ensure database connection is established
    await connectToDatabase();

    // Wait for connection to be ready
    const isConnected = await waitForConnection();
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const featuredPost = await BlogPost.findOne({
      $or: [{ status: "published" }, { publishedAt: { $lte: new Date() } }],
      featured: true,
    })
      .populate("author", "name email")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    // No featured post is a normal empty state, not an error. Return 200 with
    // a null body so consumers don't have to treat "empty" as a failure (and
    // the dev console isn't littered with 404s on every homepage load).
    if (!featuredPost) {
      return NextResponse.json(null, { status: 200 });
    }

    // Transform the post to ensure proper author structure
    const transformedPost = {
      ...featuredPost,
      author: featuredPost.author
        ? typeof featuredPost.author === "object"
          ? {
              _id: featuredPost.author._id || "",
              name: featuredPost.author.name || "Unknown",
              email: featuredPost.author.email || "",
            }
          : { _id: "", name: "Unknown", email: "" }
        : { _id: "", name: "Unknown", email: "" },
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error("Error fetching featured post:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured post" },
      { status: 500 }
    );
  }
}
