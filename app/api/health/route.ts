import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/utils/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Actively (re)establish the cached connection so the health check reflects
    // real DB reachability instead of failing right after a fresh container start
    // when no other route has triggered a connection yet.
    await connectToDatabase();

    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          database: "disconnected",
          readyState: dbStatus,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

