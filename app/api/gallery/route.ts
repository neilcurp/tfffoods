import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/config/dbConnection";
import Gallery from "@/utils/models/Gallery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    let gallery = await Gallery.findOne();
    if (!gallery) {
      gallery = await Gallery.create({ images: [] });
    }
    return NextResponse.json({ images: gallery.images });
  } catch (error) {
    logger.error("Failed to fetch gallery", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { images } = await req.json();
    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: "Invalid images array" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Start a session for atomic operations
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
      let gallery = await Gallery.findOne().session(mongoSession);
      if (!gallery) {
        gallery = await Gallery.create([{ images }], { session: mongoSession });
      } else {
        gallery.images = images;
        await gallery.save({ session: mongoSession });
      }

      await mongoSession.commitTransaction();
      return NextResponse.json({ success: true });
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    logger.error("Failed to update gallery", error);
    return NextResponse.json(
      { error: "Failed to update gallery" },
      { status: 500 }
    );
  }
}
